// =============================================================================
// Supabase Browser Client
// =============================================================================
// Uses the PUBLIC anon key — safe for client-side code.
// This client respects RLS policies.
// =============================================================================

import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
