import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isAdminEmail } from '@/lib/supabase/admin';
import { buildSearchConsoleAuthUrl } from '@/lib/google/searchconsole';

// Admin-only, one-off connect flow for Harry's own Google Search Console account (see
// chat 03.09.26) — separate from the customer-facing GA connect flow in /api/analytics.
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: 'Nicht berechtigt.' }, { status: 403 });
  }

  const state = Buffer.from(JSON.stringify({ purpose: 'searchconsole' })).toString('base64url');

  try {
    return NextResponse.redirect(buildSearchConsoleAuthUrl(state));
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Google-OAuth ist nicht konfiguriert.' }, { status: 500 });
  }
}
