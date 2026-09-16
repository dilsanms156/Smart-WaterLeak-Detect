// =============================================================================
// POST /api/pump — User sends a pump ON/OFF command
// =============================================================================

import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { pumpCommandSchema } from '@/lib/api/validation';
import {
  validateUserSession,
  errorResponse,
  successResponse,
  checkRateLimit,
} from '@/lib/api/middleware';

export async function POST(request: NextRequest) {
  if (!checkRateLimit(request)) {
    return errorResponse('Rate limit exceeded', 429);
  }

  // Validate user authentication
  const user = await validateUserSession(request);
  if (!user) {
    return errorResponse('Unauthorized — please log in', 401);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid JSON', 400);
  }

  const parsed = pumpCommandSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(`Validation error: ${parsed.error.message}`, 400);
  }

  const data = parsed.data;
  const supabase = createServerClient();

  try {
    // Check for active leaks if trying to turn pump ON
    if (data.command === 'ON') {
      const { data: activeLeaks } = await supabase
        .from('leak_events')
        .select('id, location')
        .eq('device_id', data.deviceId)
        .eq('status', 'active')
        .limit(1);

      if (activeLeaks && activeLeaks.length > 0) {
        return errorResponse(
          `Pump ON blocked: Active leak detected at ${activeLeaks[0].location}`,
          409
        );
      }
    }

    // Expire any existing pending commands for this device
    await supabase
      .from('pump_commands')
      .update({ status: 'expired' })
      .eq('device_id', data.deviceId)
      .eq('status', 'pending');

    // Insert the new command
    const { data: command, error } = await supabase
      .from('pump_commands')
      .insert({
        device_id: data.deviceId,
        command: data.command,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('[PUMP] Insert error:', error.message);
      return errorResponse('Database error', 500);
    }

    return successResponse({
      id: command.id,
      command: command.command,
      status: command.status,
    });
  } catch (err) {
    console.error('[PUMP] Unexpected error:', err);
    return errorResponse('Internal server error', 500);
  }
}
