// =============================================================================
// API Validation Schemas (Zod)
// =============================================================================

import { z } from 'zod';

export const telemetrySchema = z.object({
  deviceId: z.string().min(1),
  sensor1Flow: z.number().min(0),
  sensor2Flow: z.number().min(0),
  sensor3Flow: z.number().min(0),
  leakDetected: z.boolean(),
  leakLocation: z.string().nullable().optional(),
  pumpState: z.boolean(),
  uptime: z.number().int().min(0),
});

export const heartbeatSchema = z.object({
  deviceId: z.string().min(1),
  uptime: z.number().int().min(0).optional(),
  pumpState: z.boolean().optional(),
  leakDetected: z.boolean().optional(),
});

export const commandAckSchema = z.object({
  id: z.string().min(1),
  status: z.enum(['executed', 'rejected']),
  deviceId: z.string().min(1),
});

export const pumpCommandSchema = z.object({
  deviceId: z.string().optional().default('water-leak-device-01'),
  command: z.enum(['ON', 'OFF']),
});

export const readingsQuerySchema = z.object({
  deviceId: z.string().optional().default('water-leak-device-01'),
  period: z.enum(['1h', '6h', '24h', '7d']).optional().default('1h'),
  limit: z.coerce.number().int().min(1).max(1000).optional().default(500),
});

export const leaksQuerySchema = z.object({
  deviceId: z.string().optional().default('water-leak-device-01'),
  status: z.enum(['active', 'resolved', 'acknowledged']).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional().default(50),
});
