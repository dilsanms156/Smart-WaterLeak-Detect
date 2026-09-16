// =============================================================================
// POST /api/device/telemetry — ESP32 sends sensor data
// =============================================================================

import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { telemetrySchema } from '@/lib/api/validation';
import {
  validateDeviceToken,
  errorResponse,
  successResponse,
  checkRateLimit,
} from '@/lib/api/middleware';

export async function POST(request: NextRequest) {
  // Rate limit
  if (!checkRateLimit(request)) {
    return errorResponse('Rate limit exceeded', 429);
  }

  // Authenticate device
  if (!validateDeviceToken(request)) {
    return errorResponse('Unauthorized', 401);
  }

  // Parse and validate body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid JSON', 400);
  }

  const parsed = telemetrySchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(`Validation error: ${parsed.error.message}`, 400);
  }

  const data = parsed.data;
  const supabase = createServerClient();

  try {
    // 1. Upsert device (create if first time, update last_seen)
    const { error: upsertError } = await supabase
      .from('devices')
      .upsert(
        {
          device_id: data.deviceId,
          name: `Water Leak Device`,
          status: 'online',
          last_seen: new Date().toISOString(),
        },
        { onConflict: 'device_id' }
      );

    if (upsertError) {
      console.error('[TELEMETRY] Device upsert error:', upsertError.message, upsertError.details, upsertError.hint);
      return errorResponse(`Device upsert failed: ${upsertError.message}`, 500);
    }

    // 2. Insert sensor reading
    const { error: readingError } = await supabase
      .from('sensor_readings')
      .insert({
        device_id: data.deviceId,
        sensor1_flow: data.sensor1Flow,
        sensor2_flow: data.sensor2Flow,
        sensor3_flow: data.sensor3Flow,
      });

    if (readingError) {
      console.error('[TELEMETRY] Insert reading error:', readingError.message, readingError.details, readingError.hint);
      return errorResponse(`Reading insert failed: ${readingError.message}`, 500);
    }

    // 3. Handle leak events
    const locationStr = data.leakLocation || 'NONE';
    if (data.leakDetected && locationStr !== 'NONE') {
      // Check if there's already an active leak event for this location
      const { data: existingLeak } = await supabase
        .from('leak_events')
        .select('id')
        .eq('device_id', data.deviceId)
        .eq('status', 'active')
        .eq('location', locationStr)
        .limit(1)
        .maybeSingle();

      if (!existingLeak) {
        // Determine flow difference based on location
        let flowDiff = 0;
        if (locationStr.includes('S1 AND S2')) {
          flowDiff = data.sensor1Flow - data.sensor2Flow;
        } else if (locationStr.includes('S2 AND S3')) {
          flowDiff = data.sensor2Flow - data.sensor3Flow;
        }

        await supabase.from('leak_events').insert({
          device_id: data.deviceId,
          location: locationStr,
          sensor1_flow: data.sensor1Flow,
          sensor2_flow: data.sensor2Flow,
          sensor3_flow: data.sensor3Flow,
          flow_difference: flowDiff,
          status: 'active',
        });

        // Log the pump-off event from automatic safety
        await supabase.from('pump_events').insert({
          device_id: data.deviceId,
          action: 'OFF',
          source: 'AUTOMATIC_SAFETY',
          previous_state: true,
          new_state: false,
        });
      }
    } else {
      // If no leak detected, resolve any active leak events
      const { data: activeLeaks } = await supabase
        .from('leak_events')
        .select('id')
        .eq('device_id', data.deviceId)
        .eq('status', 'active');

      if (activeLeaks && activeLeaks.length > 0) {
        await supabase
          .from('leak_events')
          .update({
            status: 'resolved',
            ended_at: new Date().toISOString(),
          })
          .eq('device_id', data.deviceId)
          .eq('status', 'active');
      }
    }

    return successResponse({ received: true });
  } catch (err) {
    console.error('[TELEMETRY] Unexpected error:', err);
    return errorResponse('Internal server error', 500);
  }
}
