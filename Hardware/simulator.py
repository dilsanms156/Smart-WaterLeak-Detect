#!/usr/bin/env python3
"""
ESP32 Hardware Simulator for Smart Water Leakage Detection System
==================================================================
Simulates ESP32 micro-controller telemetry, pulse calculations, local safety relay state,
and command polling against the Next.js backend API over HTTP/HTTPS.

Usage:
    python simulator.py [--url http://localhost:3000] [--token TOKEN] [--device water-leak-device-01]
"""

import sys
import time
import argparse
import urllib.request
import urllib.error
import json
import threading

# ANSI Colors for Terminal Output
GREEN  = "\033[92m"
YELLOW = "\033[93m"
RED    = "\033[91m"
CYAN   = "\033[96m"
BOLD   = "\033[1m"
RESET  = "\033[0m"

class HardwareSimulator:
    def __init__(self, server_url, device_token, device_id):
        self.server_url = server_url.rstrip('/')
        self.device_token = device_token
        self.device_id = device_id

        # Hardware State
        self.pump_state = False       # False = OFF, True = ON
        self.leak_detected = False
        self.leak_location = "NONE"

        # Sensor readings (L/min)
        self.flow_s1 = 0.0
        self.flow_s2 = 0.0
        self.flow_s3 = 0.0

        # Operational parameters
        self.running = True
        self.start_time = time.time()
        self.leak_suspect_time = None
        self.suspected_location = None

        # Simulation Mode: 'normal', 'leak_s1_s2', 'leak_s2_s3'
        self.mode = "normal"

    def log(self, tag, message, color=RESET):
        uptime = int(time.time() - self.start_time)
        print(f"{color}[{tag}] [t={uptime:4d}s] {message}{RESET}")

    def update_flow_rates(self):
        """Calculates sensor flows based on pump state and simulation mode."""
        if not self.pump_state:
            self.flow_s1 = 0.0
            self.flow_s2 = 0.0
            self.flow_s3 = 0.0
            return

        base_flow = 12.5  # Standard pump flow rate in L/min

        if self.mode == "normal":
            self.flow_s1 = base_flow
            self.flow_s2 = base_flow
            self.flow_s3 = base_flow
        elif self.mode == "leak_s1_s2":
            self.flow_s1 = base_flow
            self.flow_s2 = base_flow - 3.2  # 3.2 L/min leak drop
            self.flow_s3 = base_flow - 3.2
        elif self.mode == "leak_s2_s3":
            self.flow_s1 = base_flow
            self.flow_s2 = base_flow
            self.flow_s3 = base_flow - 4.1  # 4.1 L/min leak drop

    def check_local_safety_logic(self):
        """Emulates ESP32 firmware local authority leak detection & emergency shutdown."""
        if self.flow_s1 < 0.3:
            self.leak_suspect_time = None
            self.suspected_location = None
            return

        diff12 = self.flow_s1 - self.flow_s2
        diff23 = self.flow_s2 - self.flow_s3
        threshold = 0.5

        current_suspect = ""
        if diff12 > threshold:
            current_suspect = "BETWEEN S1 AND S2"
        elif diff23 > threshold:
            current_suspect = "BETWEEN S2 AND S3"

        if current_suspect:
            if self.suspected_location != current_suspect:
                self.suspected_location = current_suspect
                self.leak_suspect_time = time.time()
                self.log("SAFETY", f"Leak suspected {current_suspect}. Confirmation timer started...", YELLOW)
            elif time.time() - self.leak_suspect_time >= 3.0:  # 3s sustained check
                if not self.leak_detected:
                    self.leak_detected = True
                    self.leak_location = current_suspect
                    self.pump_state = False  # EMERGENCY PUMP OFF
                    self.log("ALERT", f"⚠ CONFIRMED LEAK ({current_suspect}) — EMERGENCY PUMP SHUTDOWN EXECUTED!", RED + BOLD)
        else:
            if self.leak_suspect_time:
                self.log("SAFETY", "Flow normalized. Leak suspicion cleared.", GREEN)
                self.leak_suspect_time = None
                self.suspected_location = None

    def post_json(self, endpoint, payload):
        """Sends HTTP POST request to backend API."""
        url = f"{self.server_url}{endpoint}"
        data = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(
            url,
            data=data,
            headers={
                'Content-Type': 'application/json',
                'x-device-token': self.device_token
            },
            method='POST'
        )
        try:
            with urllib.request.urlopen(req, timeout=5) as resp:
                return resp.status, json.loads(resp.read().decode('utf-8'))
        except urllib.error.HTTPError as e:
            return e.code, e.reason
        except Exception as e:
            return -1, str(e)

    def get_json(self, endpoint):
        """Sends HTTP GET request to backend API."""
        url = f"{self.server_url}{endpoint}"
        req = urllib.request.Request(
            url,
            headers={'x-device-token': self.device_token},
            method='GET'
        )
        try:
            with urllib.request.urlopen(req, timeout=5) as resp:
                return resp.status, json.loads(resp.read().decode('utf-8'))
        except Exception as e:
            return -1, str(e)

    def send_telemetry(self):
        payload = {
            "deviceId": self.device_id,
            "sensor1Flow": round(self.flow_s1, 2),
            "sensor2Flow": round(self.flow_s2, 2),
            "sensor3Flow": round(self.flow_s3, 2),
            "leakDetected": self.leak_detected,
            "leakLocation": self.leak_location,
            "pumpState": self.pump_state,
            "uptime": int(time.time() - self.start_time)
        }
        status, resp = self.post_json("/api/device/telemetry", payload)
        if status in (200, 201):
            self.log("TELEMETRY", f"Uploaded S1:{self.flow_s1:.1f} S2:{self.flow_s2:.1f} S3:{self.flow_s3:.1f} L/min | Pump:{'ON' if self.pump_state else 'OFF'}", CYAN)
        else:
            self.log("TELEMETRY", f"Upload failed ({status}): {resp}", RED)

    def send_heartbeat(self):
        payload = {
            "deviceId": self.device_id,
            "uptime": int(time.time() - self.start_time),
            "pumpState": self.pump_state,
            "leakDetected": self.leak_detected
        }
        status, resp = self.post_json("/api/device/heartbeat", payload)
        if status == 200:
            self.log("HEARTBEAT", "Heartbeat OK", GREEN)

    def poll_commands(self):
        status, resp = self.get_json(f"/api/device/command?deviceId={self.device_id}")
        if status == 200 and isinstance(resp, dict):
            data = resp.get("data") or resp
            command = data.get("command")
            cmd_id = data.get("id")

            if command:
                self.log("COMMAND", f"Received command from server: {command} (id={cmd_id})", BOLD + YELLOW)
                if command == "ON":
                    if self.leak_detected:
                        self.log("COMMAND", "REJECTED ON command — leak condition is active!", RED)
                        self.post_json("/api/device/command", {"id": cmd_id, "status": "rejected", "deviceId": self.device_id})
                    else:
                        self.pump_state = True
                        self.log("PUMP", "Pump turned ON via remote command", GREEN)
                        self.post_json("/api/device/command", {"id": cmd_id, "status": "executed", "deviceId": self.device_id})
                elif command == "OFF":
                    self.pump_state = False
                    self.log("PUMP", "Pump turned OFF via remote command", YELLOW)
                    self.post_json("/api/device/command", {"id": cmd_id, "status": "executed", "deviceId": self.device_id})

    def run_threads(self):
        def loop_telemetry():
            while self.running:
                self.update_flow_rates()
                self.check_local_safety_logic()
                self.send_telemetry()
                time.sleep(3)

        def loop_commands():
            while self.running:
                self.poll_commands()
                time.sleep(2)

        def loop_heartbeat():
            while self.running:
                self.send_heartbeat()
                time.sleep(15)

        t1 = threading.Thread(target=loop_telemetry, daemon=True)
        t2 = threading.Thread(target=loop_commands, daemon=True)
        t3 = threading.Thread(target=loop_heartbeat, daemon=True)

        t1.start()
        t2.start()
        t3.start()

    def interactive_cli(self):
        print(f"\n{BOLD}{CYAN}========================================================")
        print("  Smart Water Leakage Detection — ESP32 Hardware Simulator")
        print(f"========================================================{RESET}")
        print(f"Server URL: {self.server_url}")
        print(f"Device ID : {self.device_id}")
        print("\nCommands:")
        print("  1 - Turn Pump ON")
        print("  2 - Turn Pump OFF")
        print("  n - Set Normal Flow Mode (No Leaks)")
        print("  l1 - Inject Leak between S1 & S2")
        print("  l2 - Inject Leak between S2 & S3")
        print("  r - Reset Leak Alarm State")
        print("  q - Quit Simulator\n")

        self.run_threads()

        while self.running:
            try:
                cmd = input().strip().lower()
                if cmd == '1':
                    if self.leak_detected:
                        print(f"{RED}Cannot start pump: Leak active! Reset leak state first ('r').{RESET}")
                    else:
                        self.pump_state = True
                        print(f"{GREEN}Pump switched to ON{RESET}")
                elif cmd == '2':
                    self.pump_state = False
                    print(f"{YELLOW}Pump switched to OFF{RESET}")
                elif cmd == 'n':
                    self.mode = "normal"
                    print(f"{GREEN}Mode set to NORMAL (No flow differential){RESET}")
                elif cmd == 'l1':
                    self.mode = "leak_s1_s2"
                    print(f"{RED}Mode set to LEAK BETWEEN S1 AND S2{RESET}")
                elif cmd == 'l2':
                    self.mode = "leak_s2_s3"
                    print(f"{RED}Mode set to LEAK BETWEEN S2 AND S3{RESET}")
                elif cmd == 'r':
                    self.leak_detected = False
                    self.leak_location = "NONE"
                    print(f"{GREEN}Leak alarm reset manually.{RESET}")
                elif cmd == 'q':
                    self.running = False
                    print("Exiting hardware simulator.")
                    sys.exit(0)
            except (KeyboardInterrupt, EOFError):
                self.running = False
                sys.exit(0)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="ESP32 Hardware Simulator")
    parser.add_argument("--url", default="http://localhost:3000", help="Backend API server URL")
    parser.add_argument("--token", default="placeholder_device_token_for_testing", help="Device API authentication token")
    parser.add_argument("--device", default="water-leak-device-01", help="Device Identifier")
    args = parser.parse_args()

    sim = HardwareSimulator(args.url, args.token, args.device)
    sim.interactive_cli()
