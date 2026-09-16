// =============================================================================
// Smart Water Leakage Detection System — Configuration
// =============================================================================
// All configurable constants in one place. No magic numbers in the main sketch.
// =============================================================================

#ifndef CONFIG_H
#define CONFIG_H

// ── GPIO Pin Assignments ─────────────────────────────────────────────────────
// Matching the existing hardware wiring. Change only if physically re-wired.
#define SENSOR1_PIN   13    // YF-S401 Sensor 1 signal (yellow wire)
#define SENSOR2_PIN   25    // YF-S401 Sensor 2 signal (yellow wire)
#define SENSOR3_PIN   14    // YF-S401 Sensor 3 signal (yellow wire)
#define RELAY_PIN     27    // Relay module IN signal

// ── YF-S401 Calibration ─────────────────────────────────────────────────────
// The YF-S401 outputs pulses proportional to flow.
// Flow rate (L/min) = pulseCount / FLOW_CALIBRATION  (per 1-second window)
//
// ⚠ WARNING: 98.0 is a commonly cited value but is NOT universally accurate.
//   You MUST calibrate against your actual sensor by measuring a known volume
//   and adjusting this constant until the reported flow matches reality.
//
// ⚠ ELECTRICAL SAFETY: The YF-S401 is often a 5V sensor.  ESP32 GPIOs are
//   3.3V tolerant.  If your sensor outputs 5V logic pulses, you MUST use a
//   voltage divider or level-shifter to avoid damaging the ESP32.  Some
//   YF-S401 modules (especially those sold for 3.3V MCUs) output 3.3V
//   signals — verify the datasheet for YOUR specific module.
#define FLOW_CALIBRATION          98.0

// ── Leak Detection Parameters ────────────────────────────────────────────────
// LEAK_DIFFERENCE_THRESHOLD: Minimum flow difference (L/min) between adjacent
//   sensors to consider it a potential leak.  Must be tuned for your pipe
//   diameter, pressure, and sensor tolerances.
#define LEAK_DIFFERENCE_THRESHOLD 0.5

// LEAK_CONFIRMATION_TIME_MS: How long (ms) the threshold must be continuously
//   exceeded before a leak is confirmed.  Prevents false alarms from transient
//   flow surges (e.g., pump startup, valve changes).
#define LEAK_CONFIRMATION_TIME_MS 3000

// Minimum flow (L/min) on S1 required before leak comparison is meaningful.
// Prevents false positives when the pump is off and flow is near-zero.
#define MIN_FLOW_FOR_LEAK_CHECK   0.3

// ── Timing Intervals (milliseconds) ─────────────────────────────────────────
#define FLOW_CALC_INTERVAL        1000    // Flow rate calculation period
#define TELEMETRY_INTERVAL        5000    // Send telemetry to server
#define COMMAND_POLL_INTERVAL     3000    // Poll server for pump commands
#define HEARTBEAT_INTERVAL        30000   // Send heartbeat to server
#define WIFI_RECONNECT_INTERVAL   10000   // Retry Wi-Fi if disconnected
#define STARTUP_GRACE_PERIOD      10000   // Ignore leak checks after boot

// ── ISR Debounce ─────────────────────────────────────────────────────────────
#define PULSE_DEBOUNCE_MS         2       // Milliseconds for ISR debounce

// ── HTTP Configuration ───────────────────────────────────────────────────────
#define HTTP_TIMEOUT_MS           5000    // HTTP request timeout

// ── Device Identity ──────────────────────────────────────────────────────────
#define DEVICE_ID                 "water-leak-device-01"

#endif // CONFIG_H
