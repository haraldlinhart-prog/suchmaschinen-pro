import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { isAdminEmail } from '@/lib/supabase/admin';
import { refreshAccessToken, deleteSitemap } from '@/lib/google/searchconsole';

// One-off cleanup (see chat 03.09.26): deletes the 7 confirmed zombie sitemap
// registrations (old http:// entries from 2012-2015) network-wide.
const ZOMBIES: { siteUrl: string; path: string }[] = [
  { siteUrl: 'sc-domain:gmbh-verkauf.com', path: 'http://www.gmbh-verkauf.com/sitemap.xml' },
  { siteUrl: 'sc-domain:einfach-limited.de', path: 'http://einfach-limited.de/sitemap.xml' },
  { siteUrl: 'sc-domain:companieshouse.info', path: 'http://companieshouse.info/sitemap.xml' },
  { siteUrl: 'sc-domain:pan-office.de', path: 'http://pan-office.de/sitemap.xml' },
  { siteUrl: 'sc-domain:eurocor.net', path: 'http://eurocor.net/sitemap.xml' },
  { siteUrl: 'sc-domain:pan21.de', path: 'http://pan21.de/sitemap.xml' },
  { siteUrl: 'sc-domain:4utrust.de', path: 'http://4utrust.de/sitemap.xml' },
];

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: 'Nicht berechtigt.' }, { status: 403 });
  }

  const service = createServiceClient();
  const { data: tokenRow } = await service.from('sq_admin_tokens').select('refresh_token').eq('key', 'search_console').single();
  if (!tokenRow?.refresh_token) return NextResponse.json({ error: 'Search Console nicht verbunden.' }, { status: 400 });

  const accessToken = await refreshAccessToken(tokenRow.refresh_token);

  const results = [];
  for (const z of ZOMBIES) {
    try {
      await deleteSitemap(accessToken, z.siteUrl, z.path);
      results.push({ ...z, status: 'deleted' });
    } catch (e) {
      results.push({ ...z, status: 'error', detail: e instanceof Error ? e.message : String(e) });
    }
    await new Promise(r => setTimeout(r, 300));
  }

  return NextResponse.json({ results });
}
