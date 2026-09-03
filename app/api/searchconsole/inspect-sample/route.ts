import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { isAdminEmail } from '@/lib/supabase/admin';
import { refreshAccessToken, inspectUrl } from '@/lib/google/searchconsole';

// Temporary sanity-check route (see chat 03.09.26) — inspects a handful of specific
// URLs to see their REAL Google index status, to validate (or debunk) the "0 indexed"
// pattern the sitemap scan found almost everywhere.
const SAMPLE: { siteUrl: string; url: string }[] = [
  { siteUrl: 'sc-domain:pan21.com', url: 'https://www.pan21.com/' },
  { siteUrl: 'sc-domain:4utrust.de', url: 'https://4utrust.de/' },
  { siteUrl: 'sc-domain:4utrust.de', url: 'https://4utrust.de/blog/domain-und-hosting-guenstig-kaufen/' },
  { siteUrl: 'sc-domain:1euro-hosting.de', url: 'https://1euro-hosting.de/' },
  { siteUrl: 'sc-domain:firmenabwicklung.de', url: 'https://firmenabwicklung.de/' },
  { siteUrl: 'sc-domain:turnkey-companies.com', url: 'https://turnkey-companies.com/' },
];

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: 'Nicht berechtigt.' }, { status: 403 });
  }

  const service = createServiceClient();
  const { data: tokenRow } = await service.from('sq_admin_tokens').select('refresh_token').eq('key', 'search_console').single();
  if (!tokenRow?.refresh_token) return NextResponse.json({ error: 'Search Console nicht verbunden.' }, { status: 400 });

  try {
    const accessToken = await refreshAccessToken(tokenRow.refresh_token);
    const results = [];
    for (const s of SAMPLE) {
      try {
        const r = await inspectUrl(accessToken, s.siteUrl, s.url);
        results.push({
          url: s.url,
          coverageState: r?.indexStatusResult?.coverageState,
          verdict: r?.indexStatusResult?.verdict,
          lastCrawlTime: r?.indexStatusResult?.lastCrawlTime,
          indexingState: r?.indexStatusResult?.indexingState,
          robotsTxtState: r?.indexStatusResult?.robotsTxtState,
        });
      } catch (e) {
        results.push({ url: s.url, error: e instanceof Error ? e.message : String(e) });
      }
      await new Promise(r => setTimeout(r, 300));
    }
    return NextResponse.json({ results });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
