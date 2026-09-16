// =============================================================================
// POST /api/device/heartbeat — ESP32 heartbeat + status update
// =============================================================================

import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { heartbeatSchema } from '@/lib/api/validation';
import {
  validateDeviceToken,
  errorResponse,
  successResponse,
  checkRateLimit,
} from '@/lib/api/middleware';

export async function POST(request: NextRequest) {
  if (!checkRateLimit(request)) {
    return errorResponse('Rate limit exceeded', 429);
  }
  if (!validateDeviceToken(request)) {
    return errorResponse('Unauthorized', 401);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid JSON', 400);
  }

  const parsed = heartbeatSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(`Validation error: ${parsed.error.message}`, 400);
  }

  const data = parsed.data;
  const supabase = createServerClient();

  try {
    const { error } = await supabase
      .from('devices')
      .upsert(
        {
          device_id: data.deviceId,
          status: 'online',
          last_seen: new Date().toISOString(),
        },
        { onConflict: 'device_id' }
      );

    if (error) {
      console.error('[HEARTBEAT] Upsert error:', error.message);
      return errorResponse('Database error', 500);
    }

    return successResponse({ ok: true });
  } catch (err) {
    console.error('[HEARTBEAT] Unexpected error:', err);
    return errorResponse('Internal server error', 500);
  }
}
