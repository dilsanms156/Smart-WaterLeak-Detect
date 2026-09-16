-- =============================================================================
-- Smart Water Leakage Detection System — Database Schema
-- =============================================================================
-- Run this migration against your Supabase project's SQL editor.
-- Tables: devices, sensor_readings, leak_events, pump_events, pump_commands
-- =============================================================================

-- 1. devices — Device registry
CREATE TABLE IF NOT EXISTS devices (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id     TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL DEFAULT 'Water Leak Device',
  status        TEXT NOT NULL DEFAULT 'offline'
                  CHECK (status IN ('online', 'offline', 'error')),
  last_seen     TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_devices_device_id ON devices (device_id);
CREATE INDEX idx_devices_status    ON devices (status);

-- 2. sensor_readings — Time-series flow data from the three YF-S401 sensors
CREATE TABLE IF NOT EXISTS sensor_readings (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id     TEXT NOT NULL REFERENCES devices (device_id) ON DELETE CASCADE,
  sensor1_flow  REAL NOT NULL DEFAULT 0,
  sensor2_flow  REAL NOT NULL DEFAULT 0,
  sensor3_flow  REAL NOT NULL DEFAULT 0,
  recorded_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sensor_readings_device_time
  ON sensor_readings (device_id, recorded_at DESC);

-- 3. leak_events — Leak detection history
CREATE TABLE IF NOT EXISTS leak_events (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id       TEXT NOT NULL REFERENCES devices (device_id) ON DELETE CASCADE,
  location        TEXT NOT NULL,
  sensor1_flow    REAL NOT NULL DEFAULT 0,
  sensor2_flow    REAL NOT NULL DEFAULT 0,
  sensor3_flow    REAL NOT NULL DEFAULT 0,
  flow_difference REAL NOT NULL DEFAULT 0,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at        TIMESTAMPTZ,
  status          TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'resolved', 'acknowledged'))
);

CREATE INDEX idx_leak_events_device_time
  ON leak_events (device_id, started_at DESC);
CREATE INDEX idx_leak_events_status
  ON leak_events (status);

-- 4. pump_events — Pump state-change audit log
CREATE TABLE IF NOT EXISTS pump_events (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id       TEXT NOT NULL REFERENCES devices (device_id) ON DELETE CASCADE,
  action          TEXT NOT NULL CHECK (action IN ('ON', 'OFF')),
  source          TEXT NOT NULL CHECK (source IN ('MANUAL', 'AUTOMATIC_SAFETY', 'SYSTEM')),
  previous_state  BOOLEAN,
  new_state       BOOLEAN NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pump_events_device_time
  ON pump_events (device_id, created_at DESC);

-- 5. pump_commands — Pending command queue for ESP32 polling
CREATE TABLE IF NOT EXISTS pump_commands (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id     TEXT NOT NULL REFERENCES devices (device_id) ON DELETE CASCADE,
  command       TEXT NOT NULL CHECK (command IN ('ON', 'OFF')),
  status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'executed', 'rejected', 'expired')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  executed_at   TIMESTAMPTZ
);

CREATE INDEX idx_pump_commands_device_status
  ON pump_commands (device_id, status);
CREATE INDEX idx_pump_commands_created
  ON pump_commands (created_at DESC);

-- Auto-update the updated_at column on devices
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_devices_updated_at
  BEFORE UPDATE ON devices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
