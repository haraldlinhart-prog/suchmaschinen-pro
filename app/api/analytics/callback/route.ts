import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { exchangeCodeForTokens } from '@/lib/google/analytics';
import { exchangeCodeForTokens as exchangeSearchConsoleCode } from '@/lib/google/searchconsole';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const state = req.nextUrl.searchParams.get('state');
  const origin = req.nextUrl.origin;

  if (!code || !state) {
    return NextResponse.redirect(`${origin}/dashboard?ga_error=missing_params`);
  }

  let parsed: { websiteId?: string; uid?: string; purpose?: string };
  try {
    parsed = JSON.parse(Buffer.from(state, 'base64url').toString('utf-8'));
  } catch {
    return NextResponse.redirect(`${origin}/dashboard?ga_error=bad_state`);
  }

  // Admin-only Search Console connect flow (see chat 03.09.26) — shares this callback's
  // registered redirect URI with the customer GA flow below, distinguished by purpose.
  if (parsed.purpose === 'searchconsole') {
    try {
      const tokens = await exchangeSearchConsoleCode(code);
      if (!tokens.refresh_token) {
        return NextResponse.redirect(`${origin}/dashboard?sc_error=no_refresh_token`);
      }
      const supabase = createServiceClient();
      await supabase
        .from('sq_admin_tokens')
        .upsert({ key: 'search_console', refresh_token: tokens.refresh_token, connected_at: new Date().toISOString() });
      return NextResponse.redirect(`${origin}/dashboard?sc_connected=1`);
    } catch (e) {
      console.error('Search Console OAuth callback error:', e);
      return NextResponse.redirect(`${origin}/dashboard?sc_error=exchange_failed`);
    }
  }

  const websiteId = parsed.websiteId;
  if (!websiteId) {
    return NextResponse.redirect(`${origin}/dashboard?ga_error=bad_state`);
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    if (!tokens.refresh_token) {
      // Google only issues a refresh_token on first consent for this account+client.
      // If the person already granted access before, re-consent is needed (prompt=consent
      // in buildAuthUrl already forces this, but keep the guard).
      return NextResponse.redirect(`${origin}/dashboard/${websiteId}?ga_error=no_refresh_token`);
    }

    const supabase = createServiceClient();
    await supabase
      .from('sq_websites')
      .update({ ga_refresh_token: tokens.refresh_token, ga_connected_at: new Date().toISOString(), ga_property_id: null, ga_property_name: null })
      .eq('id', websiteId);

    return NextResponse.redirect(`${origin}/dashboard/${websiteId}?ga_connected=1`);
  } catch (e) {
    console.error('GA OAuth callback error:', e);
    return NextResponse.redirect(`${origin}/dashboard/${websiteId}?ga_error=exchange_failed`);
  }
}
