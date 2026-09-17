// =============================================================================
// Smart Water Leakage Detection & Automatic Pump Protection System
// =============================================================================
// ESP32 Firmware — Local Safety Controller
//
// Hardware:
//   - ESP32 dev board
//   - 3 × YF-S401 water-flow sensors (in series: S1 → S2 → S3)
//   - 1 × relay module (active-LOW) controlling a water pump
//
// Architecture:
//   The ESP32 is the AUTHORITATIVE safety controller.  It detects leaks and
//   cuts the pump LOCALLY — it does NOT depend on cloud connectivity for
//   emergency shutdown.  The web dashboard provides monitoring and manual
//   control, but safety always works offline.
//
// Communication:
//   ESP32 ↔ Next.js backend over HTTPS (no Blynk).
//
// ⚠ ELECTRICAL SAFETY:
//   The YF-S401 may output 5V logic.  ESP32 GPIOs are 3.3V tolerant.
//   Verify your sensor module's output voltage.  If it outputs 5V,
//   use a voltage divider (e.g. 10kΩ + 20kΩ) or a level-shifter.
// =============================================================================

#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>
#include "config.h"
#include "credentials.h"

// =============================================================================
// Interrupt Pulse Counters
// =============================================================================
volatile unsigned long pulseCount1 = 0;
volatile unsigned long pulseCount2 = 0;
volatile unsigned long pulseCount3 = 0;

volatile unsigned long lastPulseTime1 = 0;
volatile unsigned long lastPulseTime2 = 0;
volatile unsigned long lastPulseTime3 = 0;

// ISRs with debouncing — preserved from the original firmware design
void IRAM_ATTR pulseCounter1() {
  unsigned long now = millis();
  if (now - lastPulseTime1 > PULSE_DEBOUNCE_MS) {
    pulseCount1++;
    lastPulseTime1 = now;
  }
}

void IRAM_ATTR pulseCounter2() {
  unsigned long now = millis();
  if (now - lastPulseTime2 > PULSE_DEBOUNCE_MS) {
    pulseCount2++;
    lastPulseTime2 = now;
  }
}

void IRAM_ATTR pulseCounter3() {
  unsigned long now = millis();
  if (now - lastPulseTime3 > PULSE_DEBOUNCE_MS) {
    pulseCount3++;
    lastPulseTime3 = now;
  }
}

// =============================================================================
// State Variables
// =============================================================================

// Current flow rates (L/min)
float flowRate1 = 0.0;
float flowRate2 = 0.0;
float flowRate3 = 0.0;

// Pump state: true = ON (relay energised), false = OFF
bool pumpState = false;

// Leak detection state
bool leakDetected = false;
String leakLocation = "NONE";
unsigned long leakSuspectStart = 0;   // When the leak was first suspected
bool leakSuspected = false;           // Currently under confirmation timer
String suspectedLeakLocation = "";

// millis()-based timers — no delay() calls in loop()
unsigned long lastFlowCalc      = 0;
unsigned long lastTelemetry     = 0;
unsigned long lastCommandPoll   = 0;
unsigned long lastHeartbeat     = 0;
unsigned long lastWifiReconnect = 0;
unsigned long lastLedToggle     = 0;
unsigned long bootTime          = 0;
bool ledState = false;

// =============================================================================
// Relay Helpers (Active-LOW relay module)
// =============================================================================
// Active-LOW means: digitalWrite(LOW) = relay ON = pump ON
//                   digitalWrite(HIGH) = relay OFF = pump OFF

void setPumpOn() {
  digitalWrite(RELAY_PIN, LOW);   // Energise relay → motor starts
  pumpState = true;
  Serial.println("[PUMP] Turned ON");
}

void setPumpOff() {
  digitalWrite(RELAY_PIN, HIGH);  // De-energise relay → motor stops
  pumpState = false;
  Serial.println("[PUMP] Turned OFF");
}

// =============================================================================
// Flow Calculation (called every FLOW_CALC_INTERVAL ms)
// =============================================================================
void calculateFlow() {
  // Atomically read & reset pulse counters
  noInterrupts();
  unsigned long p1 = pulseCount1;  pulseCount1 = 0;
  unsigned long p2 = pulseCount2;  pulseCount2 = 0;
  unsigned long p3 = pulseCount3;  pulseCount3 = 0;
  interrupts();

  // Convert pulses to L/min using the calibration constant.
  // The default window is 1 second (FLOW_CALC_INTERVAL = 1000 ms).
  // If you change the interval, scale accordingly.
  float intervalScale = FLOW_CALC_INTERVAL / 1000.0;
  flowRate1 = (p1 / FLOW_CALIBRATION) / intervalScale;
  flowRate2 = (p2 / FLOW_CALIBRATION) / intervalScale;
  flowRate3 = (p3 / FLOW_CALIBRATION) / intervalScale;

  Serial.printf("[FLOW] S1: %.2f  S2: %.2f  S3: %.2f L/min\n",
                flowRate1, flowRate2, flowRate3);
}

// =============================================================================
// Leak Detection
// =============================================================================
// Compares adjacent sensors in the series path: S1 → S2 → S3.
// A significant flow drop between adjacent sensors indicates a leak.
//
// Safeguards:
//   1. Requires minimum flow on S1 (pump must be running)
//   2. Uses a configurable threshold
//   3. Requires sustained detection for LEAK_CONFIRMATION_TIME_MS
//   4. Ignores readings during the startup grace period
//   5. Does NOT trigger from a single abnormal reading

void checkForLeak() {
  // Don't check during startup — sensors may produce transient readings
  if (millis() - bootTime < STARTUP_GRACE_PERIOD) {
    return;
  }

  // Only check for leaks when meaningful flow exists
  if (flowRate1 < MIN_FLOW_FOR_LEAK_CHECK) {
    // No meaningful flow — clear any pending suspicion
    if (leakSuspected) {
      leakSuspected = false;
      suspectedLeakLocation = "";
      Serial.println("[LEAK] Low/no flow — suspicion cleared");
    }
    return;
  }

  // Compare adjacent sensors
  float diff12 = flowRate1 - flowRate2;  // Drop between S1 and S2
  float diff23 = flowRate2 - flowRate3;  // Drop between S2 and S3

  String currentSuspect = "";

  if (diff12 > LEAK_DIFFERENCE_THRESHOLD) {
    currentSuspect = "BETWEEN S1 AND S2";
    Serial.printf("[LEAK] Suspect: S1→S2 diff = %.2f L/min\n", diff12);
  } else if (diff23 > LEAK_DIFFERENCE_THRESHOLD) {
    currentSuspect = "BETWEEN S2 AND S3";
    Serial.printf("[LEAK] Suspect: S2→S3 diff = %.2f L/min\n", diff23);
  }

  if (currentSuspect.length() > 0) {
    // Leak suspected
    if (!leakSuspected || currentSuspect != suspectedLeakLocation) {
      // New suspicion or location changed — restart confirmation timer
      leakSuspected = true;
      leakSuspectStart = millis();
      suspectedLeakLocation = currentSuspect;
      Serial.printf("[LEAK] Confirmation timer started for: %s\n",
                    currentSuspect.c_str());
    } else if (millis() - leakSuspectStart >= LEAK_CONFIRMATION_TIME_MS) {
      // Sustained — confirm the leak
      if (!leakDetected) {
        leakDetected = true;
        leakLocation = currentSuspect;
        Serial.println("========================================");
        Serial.println("  ⚠  LEAK CONFIRMED — PUMP OFF");
        Serial.printf("  Location: %s\n", leakLocation.c_str());
        Serial.println("========================================");

        // SAFETY: cut the pump immediately
        setPumpOff();
      }
    }
  } else {
    // No leak condition — clear suspicion
    if (leakSuspected) {
      leakSuspected = false;
      suspectedLeakLocation = "";
      Serial.println("[LEAK] Flow difference normalised — suspicion cleared");
    }

    // If a leak was previously confirmed but flow is now normal, clear it.
    // The pump does NOT automatically restart — user must manually turn it on.
    if (leakDetected) {
      Serial.println("[LEAK] Leak condition cleared. Pump remains OFF until manual restart.");
      leakDetected = false;
      leakLocation = "NONE";
    }
  }
}

// =============================================================================
// Wi-Fi Management
// =============================================================================
void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;

  Serial.printf("[WIFI] Connecting to %s...\n", WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  // Wait briefly but don't block forever — loop() must keep running for safety
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 5000) {
    delay(100);
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("[WIFI] Connected — IP: %s\n", WiFi.localIP().toString().c_str());
  } else {
    Serial.println("[WIFI] Connection attempt timed out — will retry later");
  }
}

void reconnectWiFiIfNeeded() {
  if (WiFi.status() != WL_CONNECTED) {
    if (millis() - lastWifiReconnect >= WIFI_RECONNECT_INTERVAL) {
      lastWifiReconnect = millis();
      Serial.println("[WIFI] Attempting reconnection...");
      WiFi.disconnect();
      WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    }
  }
}

// =============================================================================
// HTTPS Communication Helpers
// =============================================================================

// Build a full URL from a path, e.g. "/api/device/telemetry"
String buildUrl(const char* path) {
  return String(SERVER_URL) + path;
}

// POST JSON to the backend over HTTP or HTTPS. Returns the HTTP status code, or -1 on failure.
int httpPost(const char* path, const String& jsonBody) {
  if (WiFi.status() != WL_CONNECTED) return -1;

  String fullUrl = buildUrl(path);
  HTTPClient http;
  http.setTimeout(HTTP_TIMEOUT_MS);
  bool started = false;

  WiFiClientSecure secureClient;
  WiFiClient plainClient;

  if (fullUrl.startsWith("https://")) {
    secureClient.setInsecure(); // Bypass CA validation for HTTPS communication
    started = http.begin(secureClient, fullUrl);
  } else {
    started = http.begin(plainClient, fullUrl);
  }

  if (!started) {
    Serial.printf("[HTTP] POST %s begin failed\n", path);
    return -1;
  }

  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-device-token", DEVICE_API_TOKEN);

  int status = http.POST(jsonBody);
  if (status < 0) {
    Serial.printf("[HTTP] POST %s failed: %s\n", path, http.errorToString(status).c_str());
  }
  http.end();
  return status;
}

// GET from the backend over HTTP or HTTPS. Writes the response body into `responseBody`.
// Returns the HTTP status code, or -1 on failure.
int httpGet(const char* path, String& responseBody) {
  if (WiFi.status() != WL_CONNECTED) return -1;

  String fullUrl = buildUrl(path);
  HTTPClient http;
  http.setTimeout(HTTP_TIMEOUT_MS);
  bool started = false;

  WiFiClientSecure secureClient;
  WiFiClient plainClient;

  if (fullUrl.startsWith("https://")) {
    secureClient.setInsecure(); // Bypass CA validation for HTTPS communication
    started = http.begin(secureClient, fullUrl);
  } else {
    started = http.begin(plainClient, fullUrl);
  }

  if (!started) {
    Serial.printf("[HTTP] GET %s begin failed\n", path);
    return -1;
  }

  http.addHeader("x-device-token", DEVICE_API_TOKEN);

  int status = http.GET();
  if (status > 0) {
    responseBody = http.getString();
  } else {
    Serial.printf("[HTTP] GET %s failed: %s\n", path, http.errorToString(status).c_str());
  }
  http.end();
  return status;
}

// =============================================================================
// Telemetry Upload
// =============================================================================
void sendTelemetry() {
  JsonDocument doc;
  doc["deviceId"]     = DEVICE_ID;
  doc["sensor1Flow"]  = flowRate1;
  doc["sensor2Flow"]  = flowRate2;
  doc["sensor3Flow"]  = flowRate3;
  doc["leakDetected"] = leakDetected;
  doc["leakLocation"] = leakLocation;
  doc["pumpState"]    = pumpState;
  doc["uptime"]       = millis() / 1000;

  String body;
  serializeJson(doc, body);

  int status = httpPost("/api/device/telemetry", body);
  if (status == 200 || status == 201) {
    Serial.println("[TELEMETRY] Sent successfully");
  } else {
    Serial.printf("[TELEMETRY] Failed (HTTP %d)\n", status);
  }
}

// =============================================================================
// Heartbeat
// =============================================================================
void sendHeartbeat() {
  JsonDocument doc;
  doc["deviceId"]  = DEVICE_ID;
  doc["uptime"]    = millis() / 1000;
  doc["pumpState"] = pumpState;
  doc["leakDetected"] = leakDetected;

  String body;
  serializeJson(doc, body);

  int status = httpPost("/api/device/heartbeat", body);
  if (status == 200) {
    Serial.println("[HEARTBEAT] OK");
  }
}

// =============================================================================
// Command Polling
// =============================================================================
// The ESP32 polls the backend for pending pump commands.
// If a leak is confirmed, ON commands are REJECTED locally.
// OFF commands are always executed.
// After executing, the pump does NOT auto-restart even if the leak clears.

void pollCommands() {
  String response;
  String path = String("/api/device/command?deviceId=") + DEVICE_ID;
  int status = httpGet(path.c_str(), response);

  if (status != 200 || response.length() == 0) return;

  JsonDocument doc;
  DeserializationError err = deserializeJson(doc, response);
  if (err) {
    Serial.printf("[CMD] JSON parse error: %s\n", err.c_str());
    return;
  }

  JsonObject obj = doc.as<JsonObject>();
  if (doc.containsKey("data") && doc["data"].is<JsonObject>()) {
    obj = doc["data"].as<JsonObject>();
  }

  if (!obj.containsKey("command") || obj["command"].isNull()) {
    // No pending command
    return;
  }

  const char* command   = obj["command"];
  const char* commandId = obj["id"] | "";

  Serial.printf("[CMD] Received: %s (id: %s)\n", command, commandId);

  if (strcmp(command, "ON") == 0) {
    if (leakDetected) {
      Serial.println("[CMD] ⚠ ON command REJECTED — leak is active!");
      // Acknowledge rejection to backend
      acknowledgeCommand(commandId, "rejected");
    } else {
      setPumpOn();
      acknowledgeCommand(commandId, "executed");
    }
  } else if (strcmp(command, "OFF") == 0) {
    setPumpOff();
    acknowledgeCommand(commandId, "executed");
  } else {
    Serial.printf("[CMD] Unknown command: %s\n", command);
  }
}

void acknowledgeCommand(const char* commandId, const char* result) {
  JsonDocument doc;
  doc["id"]       = commandId;
  doc["status"]   = result;
  doc["deviceId"] = DEVICE_ID;

  String body;
  serializeJson(doc, body);

  httpPost("/api/device/command", body);
}

// =============================================================================
// Setup
// =============================================================================
void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println();
  Serial.println("==========================================");
  Serial.println("  Smart Water Leak Detection System");
  Serial.println("  ESP32 Local Safety Controller");
  Serial.println("==========================================");

  bootTime = millis();

  // ── SAFETY: Relay OFF at boot ─────────────────────────────────────────────
  // Active-LOW relay: HIGH = de-energised = pump OFF.
  // This ensures the pump NEVER starts automatically at power-on.
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, HIGH);
  pumpState = false;
  Serial.println("[INIT] Relay initialised — pump OFF");

  // ── Built-in LED ──────────────────────────────────────────────────────────
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);
  Serial.println("[INIT] Built-in LED initialised");

  // ── Flow sensor pins with internal pull-ups ───────────────────────────────
  pinMode(SENSOR1_PIN, INPUT_PULLUP);
  pinMode(SENSOR2_PIN, INPUT_PULLUP);
  pinMode(SENSOR3_PIN, INPUT_PULLUP);

  // ── Attach interrupts (FALLING edge, same as original firmware) ───────────
  attachInterrupt(digitalPinToInterrupt(SENSOR1_PIN), pulseCounter1, FALLING);
  attachInterrupt(digitalPinToInterrupt(SENSOR2_PIN), pulseCounter2, FALLING);
  attachInterrupt(digitalPinToInterrupt(SENSOR3_PIN), pulseCounter3, FALLING);
  Serial.println("[INIT] Sensors configured with interrupts");

  // ── Wi-Fi ─────────────────────────────────────────────────────────────────
  WiFi.mode(WIFI_STA);
  connectWiFi();

  Serial.println("[INIT] Setup complete — entering main loop");
  Serial.printf("[INIT] Startup grace period: %d ms\n", STARTUP_GRACE_PERIOD);
}

// =============================================================================
// Main Loop — millis()-based, non-blocking
// =============================================================================
void loop() {
  unsigned long now = millis();

  // ── Flow calculation every FLOW_CALC_INTERVAL ─────────────────────────────
  if (now - lastFlowCalc >= FLOW_CALC_INTERVAL) {
    lastFlowCalc = now;
    calculateFlow();
    checkForLeak();     // Leak check runs on every flow calculation
  }

  // ── Wi-Fi reconnection ────────────────────────────────────────────────────
  reconnectWiFiIfNeeded();

  // ── LED blink: blink when WiFi connected, OFF when disconnected ──────────
  if (WiFi.status() == WL_CONNECTED) {
    if (now - lastLedToggle >= LED_BLINK_INTERVAL) {
      lastLedToggle = now;
      ledState = !ledState;
      digitalWrite(LED_PIN, ledState ? HIGH : LOW);
    }
  } else {
    digitalWrite(LED_PIN, LOW);
    ledState = false;
  }

  // The following network tasks only run when Wi-Fi is connected.
  // If Wi-Fi is down, the ESP32 continues local safety operation.
  if (WiFi.status() == WL_CONNECTED) {

    // ── Telemetry ─────────────────────────────────────────────────────────
    if (now - lastTelemetry >= TELEMETRY_INTERVAL) {
      lastTelemetry = now;
      sendTelemetry();
    }

    // ── Command polling ───────────────────────────────────────────────────
    if (now - lastCommandPoll >= COMMAND_POLL_INTERVAL) {
      lastCommandPoll = now;
      pollCommands();
    }

    // ── Heartbeat ─────────────────────────────────────────────────────────
    if (now - lastHeartbeat >= HEARTBEAT_INTERVAL) {
      lastHeartbeat = now;
      sendHeartbeat();
    }
  }
}