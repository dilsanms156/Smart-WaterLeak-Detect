-- Migration 004: Ensure sensor_readings table has created_at column for backwards compatibility
ALTER TABLE sensor_readings 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Create index for created_at queries
CREATE INDEX IF NOT EXISTS idx_sensor_readings_created_at 
ON sensor_readings (device_id, created_at DESC);
