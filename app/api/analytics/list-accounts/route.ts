import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { isAdminEmail } from '@/lib/supabase/admin';
import { refreshAccessToken } from '@/lib/google/analytics';

const GA_ADMIN_API = 'https://analyticsadmin.googleapis.com/v1beta';

// Temporary diagnostic route (see chat 03.09.26) — lists the distinct GA4
// "accounts" (top-level containers) visible via any one already-connected
// website's refresh token, so Harry can pick which one to consolidate on.
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: 'Nicht berechtigt.' }, { status: 403 });
  }

  const service = createServiceClient();
  const { data: website } = await service
    .from('sq_websites')
    .select('domain, ga_refresh_token')
    .not('ga_refresh_token', 'is', null)
    .limit(1)
    .single();

  if (!website?.ga_refresh_token) {
    return NextResponse.json({ error: 'Keine verbundene Website mit GA-Zugang gefunden.' }, { status: 404 });
  }

  try {
    const accessToken = await refreshAccessToken(website.ga_refresh_token);

    const accounts: Record<string, { name: string; displayName: string; propertyCount: number }> = {};
    let pageToken: string | undefined;
    do {
      const url = new URL(`${GA_ADMIN_API}/accountSummaries`);
      url.searchParams.set('pageSize', '200');
      if (pageToken) url.searchParams.set('pageToken', pageToken);
      const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${accessToken}` } });
      const data = await res.json();
      if (!res.ok) return NextResponse.json({ error: data.error?.message || 'GA4-Konten konnten nicht geladen werden.' }, { status: 502 });

      for (const acc of data.accountSummaries || []) {
        accounts[acc.account] = {
          name: acc.account,
          displayName: acc.displayName,
          propertyCount: (acc.propertySummaries || []).length,
        };
      }
      pageToken = data.nextPageToken;
    } while (pageToken);

    return NextResponse.json({ viaWebsite: website.domain, accounts: Object.values(accounts) });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Fehler.' }, { status: 500 });
  }
}
