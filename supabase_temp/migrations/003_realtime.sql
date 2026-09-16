-- =============================================================================
-- Enable Supabase Realtime for dashboard live updates
-- =============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE sensor_readings;
ALTER PUBLICATION supabase_realtime ADD TABLE leak_events;
ALTER PUBLICATION supabase_realtime ADD TABLE pump_events;
ALTER PUBLICATION supabase_realtime ADD TABLE pump_commands;
ALTER PUBLICATION supabase_realtime ADD TABLE devices;
