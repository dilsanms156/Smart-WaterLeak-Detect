// =============================================================================
// Supabase Server Client
// =============================================================================
// Uses the SERVICE_ROLE key — bypasses RLS. ONLY for server-side API routes.
// NEVER import this from client components.
// =============================================================================

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export function createServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables'
    );
  }

  return createSupabaseClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
