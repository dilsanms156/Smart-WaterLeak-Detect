# Smart Water Leakage Detection — Hardware & Assembly Guide

Comprehensive hardware documentation, wiring diagrams, level shifting guidance, firmware setup, and simulation tools for the ESP32 Smart Water Leak Detection System.

---

## 🛠 System Components & Bill of Materials (BOM)

| Component | Qty | Specifications | Description |
|---|---|---|---|
| **Microcontroller** | 1 | ESP32-WROOM-32 (Dev Board) | Wi-Fi microcontroller handling interrupts & local safety |
| **Flow Sensors** | 3 | YF-S401 Water Flow Sensors | Installed in series along pipe: `S1` (inlet) → `S2` → `S3` |
| **Relay Module** | 1 | 1-Channel Relay (5V Active-LOW) | Controls high-voltage / DC power to the water pump |
| **Water Pump** | 1 | 12V DC or 220V AC Submersible/In-line Pump | Main water pump controlled via relay |
| **Level Shifter / Divider** | 3 | 4-channel bidirectional logic converter OR 10kΩ + 20kΩ resistors | Converts 5V sensor pulse outputs to 3.3V safe ESP32 levels |
| **Power Supply** | 1 | 5V 2A USB power for ESP32 + 12V DC adapter for pump | Dual power supply for logic and motor load |

---

## 🔌 GPIO Pinout & Wiring Table

| Component | Component Pin | ESP32 GPIO | Logic Level | Function / Notes |
|---|---|---|---|---|
| **YF-S401 Sensor 1** | Signal (Yellow) | **GPIO 13** | 3.3V (via level shifter) | Inlet flow measurement (`FALLING` interrupt) |
| **YF-S401 Sensor 2** | Signal (Yellow) | **GPIO 25** | 3.3V (via level shifter) | Mid-pipe flow measurement (`FALLING` interrupt) |
| **YF-S401 Sensor 3** | Signal (Yellow) | **GPIO 14** | 3.3V (via level shifter) | Outlet flow measurement (`FALLING` interrupt) |
| **Relay Module** | IN Signal | **GPIO 27** | 3.3V / 5V Tolerant | Active-LOW relay control (`LOW`=ON, `HIGH`=OFF) |
| **Relay Module** | VCC & GND | 5V (VIN) & GND | 5V | Powers relay coil |
| **Sensors 1-3** | VCC & GND | 5V & GND | 5V | Sensor power |
| **Status LED** | Onboard LED | **GPIO 2** | 3.3V | Blinks when Wi-Fi connected |

---

## 📐 Circuit Schematic & Wiring Diagram

```
                       ┌────────────────────────────────────────┐
                       │             POWER SUPPLY               │
                       │   5V DC (ESP32)     12V DC (Pump)      │
                       └──────┬──────┬────────────┬──────┬──────┘
                              │      │            │      │
                              ▼      ▼            ▼      ▼
                           ┌────────────┐     ┌─────────────┐
                           │    ESP32   │     │ Water Pump  │
                           │  Dev Board │     │   (12V DC)  │
                           └─────┬──────┘     └──────▲──────┘
                                 │                   │
  ┌──────────────────────────────┼───────────────────┼──────────────────────────────┐
  │                              │                   │                              │
  │   GPIO 13 ◄───[Level Shift]──┼─── (Yellow) YF-S401 Sensor 1 (Inlet)             │
  │   GPIO 25 ◄───[Level Shift]──┼─── (Yellow) YF-S401 Sensor 2 (Mid-Pipe)           │
  │   GPIO 14 ◄───[Level Shift]──┼─── (Yellow) YF-S401 Sensor 3 (Outlet)             │
  │                              │                                                  │
  │   GPIO 27 ───────────────────┼───► Relay IN  ─── (NO Contact) ──────────────────┘
  │                              │
  └──────────────────────────────┘
```

---

## ⚠ CRITICAL ELECTRICAL SAFETY WARNING

> [!CAUTION]
> **5V Logic Level Shifting Requirement**
> 
> The YF-S401 water flow sensors operate on **5V VCC** and output **5V logic pulses**. **ESP32 GPIO pins are 3.3V logic tolerant ONLY.**
> 
> Connecting 5V pulse signals directly to ESP32 GPIO pins (13, 25, 14) can cause permanent hardware damage to the ESP32 microcontroller.

### Safe Signal Divider Circuit (Option B - Resistors):
For each sensor yellow wire:
```
(Sensor 5V Pulse) ────[ 10 kΩ Resistor ]────┬────► To ESP32 GPIO Pin (3.3V Max)
                                             │
                                    [ 20 kΩ Resistor ]
                                             │
                                            GND
```

---

## 🛡 Relay Safety Logic (Active-LOW)

- **GPIO 27 LOW (`0V`)** = Relay Energized = **Pump ON**
- **GPIO 27 HIGH (`3.3V`)** = Relay De-energized = **Pump OFF**

> [!IMPORTANT]
> The ESP32 firmware initializes `GPIO 27` to **HIGH** immediately upon boot to prevent accidental pump activation during startup or brownout resets.

---

## 💻 ESP32 Firmware Setup & Upload

The firmware is located in [`Hardware/waterPump/`](file:///e:/SmartWaterLeak/Hardware/waterPump):
- [`waterPump.ino`](file:///e:/SmartWaterLeak/Hardware/waterPump/waterPump.ino) — Main sketch (interrupt flow counter, local leak detection safety, HTTPS telemetry & command handler)
- [`config.h`](file:///e:/SmartWaterLeak/Hardware/waterPump/config.h) — Hardware constants, pin definitions, calibration values
- [`credentials.h`](file:///e:/SmartWaterLeak/Hardware/waterPump/credentials.h) — Wi-Fi credentials & backend URL *(git-ignored)*

### Flashing via Arduino IDE:
1. Open [`Hardware/waterPump/waterPump.ino`](file:///e:/SmartWaterLeak/Hardware/waterPump/waterPump.ino) in Arduino IDE.
2. Edit [`credentials.h`](file:///e:/SmartWaterLeak/Hardware/waterPump/credentials.h) with your Wi-Fi SSID and password:
   ```cpp
   #define WIFI_SSID       "YOUR_WIFI_SSID"
   #define WIFI_PASSWORD   "YOUR_WIFI_PASSWORD"
   #define SERVER_URL      "http://YOUR_SERVER_IP:3000"
   #define DEVICE_API_TOKEN "placeholder_device_token_for_testing"
   ```
3. Install required libraries via Arduino Library Manager (`Ctrl+Shift+I`):
   - `ArduinoJson` (v6 or v7)
4. Select **ESP32 Dev Module** from `Tools > Board > ESP32 Arduino`.
5. Set baud rate to `115200` in Serial Monitor and click **Upload**.

---

## 🧪 Testing Options

### Option 1: Hardware Simulator (Python CLI)
Test the web application and backend API without physical hardware:
```bash
python Hardware/simulator.py --url http://localhost:3000
```
Interactive commands:
- `1` / `2`: Turn pump ON / OFF
- `l1`: Inject leak between S1 and S2
- `l2`: Inject leak between S2 and S3
- `n`: Set normal flow (no leak)
- `r`: Reset alarm state

### Option 2: Wokwi Online Hardware Simulator
Open Wokwi in VS Code or [wokwi.com](https://wokwi.com) using [`Hardware/waterPump/diagram.json`](file:///e:/SmartWaterLeak/Hardware/waterPump/diagram.json) to simulate ESP32 potentiometers and relay outputs in browser.
