// =============================================================================
// GET /api/devices — Fetch registered devices
// =============================================================================

import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
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

  const supabase = createServerClient();

  try {
    const { data, error } = await supabase
      .from('devices')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[DEVICES] Query error:', error.message);
      return errorResponse('Database error', 500);
    }

    return successResponse(data);
  } catch (err) {
    console.error('[DEVICES] Unexpected error:', err);
    return errorResponse('Internal server error', 500);
  }
}
