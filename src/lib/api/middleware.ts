// =============================================================================
// API Middleware Helpers
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';

/** Validate the device API token from the x-device-token header */
export function validateDeviceToken(request: NextRequest): boolean {
  const token = request.headers.get('x-device-token');
  const expectedToken = process.env.DEVICE_API_TOKEN;

  if (!expectedToken) {
    return true;
  }

  return token === expectedToken;
}

/** Return a standardised JSON error response */
export function errorResponse(message: string, status: number) {
  return NextResponse.json(
    { success: false, error: message },
    { status }
  );
}

/** Return a standardised JSON success response */
export function successResponse<T>(data?: T, status: number = 200) {
  return NextResponse.json(
    { success: true, data },
    { status }
  );
}

// Simple in-memory rate limiter (per-IP, per-path)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 120;          // requests per window

export function checkRateLimit(request: NextRequest): boolean {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const path = request.nextUrl.pathname;
  const key = `${ip}:${path}`;
  const now = Date.now();

  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  entry.count++;
  if (entry.count > RATE_LIMIT_MAX) {
    return false;
  }
  return true;
}

/** Validate Supabase Auth session from cookies (for user-facing API routes) */
export async function validateUserSession(request: NextRequest) {
  if (process.env.REQUIRE_USER_AUTH === 'true') {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

      const { createServerClient: createSSRClient } = await import('@supabase/ssr');

      const supabase = createSSRClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll() {},
        },
      });

      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) return null;
      return user;
    } catch {
      return null;
    }
  }

  return { id: 'dashboard-user' };
}
