// =============================================================================
// GET  /api/device/command?deviceId=... — ESP32 polls for pending commands
// POST /api/device/command             — ESP32 acknowledges a command
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { commandAckSchema } from '@/lib/api/validation';
import {
  validateDeviceToken,
  errorResponse,
  successResponse,
  checkRateLimit,
} from '@/lib/api/middleware';

// ESP32 polls for the next pending command
export async function GET(request: NextRequest) {
  if (!checkRateLimit(request)) {
    return errorResponse('Rate limit exceeded', 429);
  }
  if (!validateDeviceToken(request)) {
    return errorResponse('Unauthorized', 401);
  }

  const deviceId = request.nextUrl.searchParams.get('deviceId');
  if (!deviceId) {
    return errorResponse('Missing deviceId parameter', 400);
  }

  const supabase = createServerClient();

  try {
    // Get the oldest valid pending command for this device (created within last 60s)
    const cutoff = new Date(Date.now() - 60_000).toISOString();
    const { data: command, error } = await supabase
      .from('pump_commands')
      .select('id, command, created_at')
      .eq('device_id', deviceId)
      .eq('status', 'pending')
      .gte('created_at', cutoff)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('[COMMAND] Query error:', error.message, error.details, error.hint);
      return errorResponse(`Command query failed: ${error.message}`, 500);
    }

    if (!command) {
      return NextResponse.json({ success: true, command: null });
    }

    return NextResponse.json({
      success: true,
      command: command.command,
      id: command.id,
      createdAt: command.created_at,
    });
  } catch (err) {
    console.error('[COMMAND] Unexpected error:', err);
    return errorResponse('Internal server error', 500);
  }
}

// ESP32 acknowledges a command execution
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

  const parsed = commandAckSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(`Validation error: ${parsed.error.message}`, 400);
  }

  const data = parsed.data;
  const supabase = createServerClient();

  try {
    const { error } = await supabase
      .from('pump_commands')
      .update({
        status: data.status,
        executed_at: new Date().toISOString(),
      })
      .eq('id', data.id);

    if (error) {
      console.error('[COMMAND] Ack error:', error.message);
      return errorResponse('Database error', 500);
    }

    // If the command was executed, log a pump event
    if (data.status === 'executed') {
      // Fetch the command to know what action was taken
      const { data: cmd } = await supabase
        .from('pump_commands')
        .select('command')
        .eq('id', data.id)
        .maybeSingle();

      if (cmd) {
        await supabase.from('pump_events').insert({
          device_id: data.deviceId,
          action: cmd.command,
          source: 'MANUAL',
          new_state: cmd.command === 'ON',
        });
      }
    }

    return successResponse({ acknowledged: true });
  } catch (err) {
    console.error('[COMMAND] Unexpected error:', err);
    return errorResponse('Internal server error', 500);
  }
}
