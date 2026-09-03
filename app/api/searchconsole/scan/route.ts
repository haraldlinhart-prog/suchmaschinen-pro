import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { isAdminEmail } from '@/lib/supabase/admin';
import { refreshAccessToken, listSites, listSitemaps } from '@/lib/google/searchconsole';

export const maxDuration = 300;

// One-off network-wide sitemap health scan (see chat 03.09.26). Flags sites with no
// sitemap submitted, or a submitted sitemap with errors / zero indexed pages.
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: 'Nicht berechtigt.' }, { status: 403 });
  }

  const service = createServiceClient();
  const { data: tokenRow } = await service.from('sq_admin_tokens').select('refresh_token').eq('key', 'search_console').single();
  if (!tokenRow?.refresh_token) {
    return NextResponse.json({ error: 'Search Console nicht verbunden. Erst /api/searchconsole/connect aufrufen.' }, { status: 400 });
  }

  try {
    const accessToken = await refreshAccessToken(tokenRow.refresh_token);
    const sites = await listSites(accessToken);

    const results: {
      siteUrl: string;
      status: 'no-sitemap' | 'has-errors' | 'zero-indexed' | 'ok';
      sitemaps: { path: string; lastSubmitted?: string; errors?: string; warnings?: string; indexed: number }[];
    }[] = [];

    const CONCURRENCY = 3;
    let cursor = 0;
    async function worker() {
      while (cursor < sites.length) {
        const site = sites[cursor++];
        try {
          const sitemaps = await listSitemaps(accessToken, site.siteUrl);
          const mapped = sitemaps.map(s => ({
            path: s.path,
            lastSubmitted: s.lastSubmitted,
            errors: s.errors,
            warnings: s.warnings,
            indexed: (s.contents || []).reduce((sum, c) => sum + (parseInt(c.indexed || '0', 10) || 0), 0),
          }));

          let status: 'no-sitemap' | 'has-errors' | 'zero-indexed' | 'ok' = 'ok';
          if (mapped.length === 0) status = 'no-sitemap';
          else if (mapped.some(m => m.errors && m.errors !== '0')) status = 'has-errors';
          else if (mapped.every(m => m.indexed === 0)) status = 'zero-indexed';

          results.push({ siteUrl: site.siteUrl, status, sitemaps: mapped });
        } catch (e) {
          results.push({ siteUrl: site.siteUrl, status: 'no-sitemap', sitemaps: [] });
          console.error(`Sitemap check failed for ${site.siteUrl}:`, e);
        }
        await new Promise(r => setTimeout(r, 150));
      }
    }
    await Promise.all(Array.from({ length: CONCURRENCY }, worker));

    const problems = results.filter(r => r.status !== 'ok');
    return NextResponse.json({
      totalSites: sites.length,
      problemCount: problems.length,
      problems,
      ok: results.filter(r => r.status === 'ok').map(r => r.siteUrl),
    });
  } catch (e) {
    console.error('searchconsole scan error:', e);
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
