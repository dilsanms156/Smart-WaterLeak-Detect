-- =============================================================================
-- Row Level Security Policies
-- =============================================================================
-- Service role (used by Next.js API routes) bypasses RLS automatically.
-- Authenticated users can read data. Device writes go through API routes only.
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE devices          ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensor_readings  ENABLE ROW LEVEL SECURITY;
ALTER TABLE leak_events      ENABLE ROW LEVEL SECURITY;
ALTER TABLE pump_events      ENABLE ROW LEVEL SECURITY;
ALTER TABLE pump_commands    ENABLE ROW LEVEL SECURITY;

-- ── Devices ──────────────────────────────────────────────────────────────────
-- Authenticated users can read devices
CREATE POLICY "Authenticated users can read devices"
  ON devices FOR SELECT
  TO authenticated
  USING (true);

-- Service role can do everything (auto-bypasses RLS, but explicit for clarity)
CREATE POLICY "Service role full access on devices"
  ON devices FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── Sensor Readings ──────────────────────────────────────────────────────────
CREATE POLICY "Authenticated users can read sensor_readings"
  ON sensor_readings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role full access on sensor_readings"
  ON sensor_readings FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── Leak Events ──────────────────────────────────────────────────────────────
CREATE POLICY "Authenticated users can read leak_events"
  ON leak_events FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role full access on leak_events"
  ON leak_events FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── Pump Events ──────────────────────────────────────────────────────────────
CREATE POLICY "Authenticated users can read pump_events"
  ON pump_events FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role full access on pump_events"
  ON pump_events FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── Pump Commands ────────────────────────────────────────────────────────────
CREATE POLICY "Authenticated users can read pump_commands"
  ON pump_commands FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can insert pump commands (manual pump control)
CREATE POLICY "Authenticated users can insert pump_commands"
  ON pump_commands FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Service role full access on pump_commands"
  ON pump_commands FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
