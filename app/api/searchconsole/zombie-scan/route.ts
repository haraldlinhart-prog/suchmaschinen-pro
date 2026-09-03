import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { isAdminEmail } from '@/lib/supabase/admin';
import { refreshAccessToken, listSites, listSitemaps } from '@/lib/google/searchconsole';

export const maxDuration = 300;

// Network-wide zombie-sitemap scan (see chat 03.09.26). A "zombie" sitemap is an old
// entry (submitted before 2020, or still on http://) that Google keeps re-checking
// against long-dead URLs, producing errors that never resolve on their own — the fix
// is deleting the registration itself, not "waiting for it to normalize".
const CUTOFF = new Date('2020-01-01T00:00:00Z');

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
    const sites = await listSites(accessToken);

    const zombies: { siteUrl: string; path: string; lastSubmitted?: string; errors?: string; warnings?: string }[] = [];

    const CONCURRENCY = 3;
    let cursor = 0;
    async function worker() {
      while (cursor < sites.length) {
        const site = sites[cursor++];
        try {
          const sitemaps = await listSitemaps(accessToken, site.siteUrl);
          for (const s of sitemaps) {
            const isHttp = s.path.startsWith('http://');
            const isOld = s.lastSubmitted ? new Date(s.lastSubmitted) < CUTOFF : false;
            if (isHttp || isOld) {
              zombies.push({ siteUrl: site.siteUrl, path: s.path, lastSubmitted: s.lastSubmitted, errors: s.errors, warnings: s.warnings });
            }
          }
        } catch (e) {
          console.error(`Zombie scan failed for ${site.siteUrl}:`, e);
        }
        await new Promise(r => setTimeout(r, 150));
      }
    }
    await Promise.all(Array.from({ length: CONCURRENCY }, worker));

    return NextResponse.json({ totalSites: sites.length, zombieCount: zombies.length, zombies });
  } catch (e) {
    console.error('zombie-scan error:', e);
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
