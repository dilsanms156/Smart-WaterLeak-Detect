// =============================================================================
// Supabase Database Types
// =============================================================================
// Manually defined types matching the database schema.
// In production, generate these with: npx supabase gen types typescript
// =============================================================================

export type DeviceStatus = 'online' | 'offline' | 'error';
export type LeakEventStatus = 'active' | 'resolved' | 'acknowledged';
export type PumpAction = 'ON' | 'OFF';
export type PumpSource = 'MANUAL' | 'AUTOMATIC_SAFETY' | 'SYSTEM';
export type CommandStatus = 'pending' | 'executed' | 'rejected' | 'expired';

export interface Device {
  id: string;
  device_id: string;
  name: string;
  status: DeviceStatus;
  last_seen: string | null;
  created_at: string;
  updated_at: string;
}

export interface SensorReading {
  id: string;
  device_id: string;
  sensor1_flow: number;
  sensor2_flow: number;
  sensor3_flow: number;
  recorded_at: string;
}

export interface LeakEvent {
  id: string;
  device_id: string;
  location: string;
  sensor1_flow: number;
  sensor2_flow: number;
  sensor3_flow: number;
  flow_difference: number;
  started_at: string;
  ended_at: string | null;
  status: LeakEventStatus;
}

export interface PumpEvent {
  id: string;
  device_id: string;
  action: PumpAction;
  source: PumpSource;
  previous_state: boolean | null;
  new_state: boolean;
  created_at: string;
}

export interface PumpCommand {
  id: string;
  device_id: string;
  command: PumpAction;
  status: CommandStatus;
  created_at: string;
  executed_at: string | null;
}

// =============================================================================
// API Types
// =============================================================================

export interface TelemetryPayload {
  deviceId: string;
  sensor1Flow: number;
  sensor2Flow: number;
  sensor3Flow: number;
  leakDetected: boolean;
  leakLocation: string;
  pumpState: boolean;
  uptime: number;
}

export interface HeartbeatPayload {
  deviceId: string;
  uptime: number;
  pumpState: boolean;
  leakDetected: boolean;
}

export interface CommandAckPayload {
  id: string;
  status: 'executed' | 'rejected';
  deviceId: string;
}

export interface PumpCommandRequest {
  deviceId: string;
  command: PumpAction;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// =============================================================================
// Dashboard State Types
// =============================================================================

export interface DeviceState {
  device: Device | null;
  latestReading: SensorReading | null;
  leakDetected: boolean;
  leakLocation: string;
  pumpState: boolean;
  isOnline: boolean;
}

export type TimePeriod = '1h' | '6h' | '24h' | '7d';
