// =============================================================================
// GET /api/readings — Fetch sensor readings for a time period
// =============================================================================

import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { readingsQuerySchema } from '@/lib/api/validation';
import { getTimeRangeStart } from '@/lib/utils';
import {
  validateUserSession,
  errorResponse,
  successResponse,
} from '@/lib/api/middleware';
import { TimePeriod } from '@/types';

export async function GET(request: NextRequest) {
  const user = await validateUserSession(request);
  if (!user) {
    return errorResponse('Unauthorized', 401);
  }

  const params = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsed = readingsQuerySchema.safeParse(params);
  if (!parsed.success) {
    return errorResponse(`Validation error: ${parsed.error.message}`, 400);
  }

  const { deviceId, period, limit } = parsed.data;
  const supabase = createServerClient();

  try {
    const rangeStart = getTimeRangeStart(period as TimePeriod);

    const { data, error } = await supabase
      .from('sensor_readings')
      .select('*')
      .eq('device_id', deviceId)
      .gte('recorded_at', rangeStart.toISOString())
      .order('recorded_at', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('[READINGS] Query error:', error.message);
      return errorResponse('Database error', 500);
    }

    return successResponse(data);
  } catch (err) {
    console.error('[READINGS] Unexpected error:', err);
    return errorResponse('Internal server error', 500);
  }
}
