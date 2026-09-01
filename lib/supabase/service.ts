import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Bypasses Row Level Security. Only ever use in trusted server-side contexts
// (e.g. the cron auto-publish job), never expose to the browser.
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createSupabaseClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
