// =============================================================================
// GET /api/leaks — Fetch leak events
// =============================================================================

import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { leaksQuerySchema } from '@/lib/api/validation';
import {
  validateUserSession,
  errorResponse,
  successResponse,
} from '@/lib/api/middleware';

export async function GET(request: NextRequest) {
  const user = await validateUserSession(request);
  if (!user) {
    return errorResponse('Unauthorized', 401);
  }

  const params = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsed = leaksQuerySchema.safeParse(params);
  if (!parsed.success) {
    return errorResponse(`Validation error: ${parsed.error.message}`, 400);
  }

  const { deviceId, status, limit } = parsed.data;
  const supabase = createServerClient();

  try {
    let query = supabase
      .from('leak_events')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(limit);

    if (deviceId) query = query.eq('device_id', deviceId);
    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) {
      console.error('[LEAKS] Query error:', error.message);
      return errorResponse('Database error', 500);
    }

    return successResponse(data);
  } catch (err) {
    console.error('[LEAKS] Unexpected error:', err);
    return errorResponse('Internal server error', 500);
  }
}
