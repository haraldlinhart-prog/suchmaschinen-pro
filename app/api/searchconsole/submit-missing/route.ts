import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { isAdminEmail } from '@/lib/supabase/admin';
import { refreshAccessToken, submitSitemap } from '@/lib/google/searchconsole';

export const maxDuration = 120;

// One-off: for domains with no sitemap ever submitted (see chat 03.09.26), probe the
// two standard paths and submit whichever actually exists (200 response). Never submits
// a guessed URL blindly — a nonexistent sitemap would just create a new error.
const NO_SITEMAP_DOMAINS = [
  'euro-pan.net', 'llc-gruenden.de', 'pan21.net', 'pan21.org', 'formular-abzocke.de',
  'turnkey-companies.com', 'kanzlei-boersenplatz.de', 'bgc-invest.com', 'keksstrasse4.de',
  'pagespeed-plus.de', 'webmaster.plus', 'suchmaschinen.pro', 'telefon-termin.com',
  'urne-zuhause.info', 'abmahnschutz.pro', 'ug-miete.de', 'apexcor.de', 'gmbh-kauf.com',
  'eurys.org', 'rentyourcompany.com', '10cor.de', 'pan21.africa', 'euroschutz.com',
  'anti-spam.info', 'pan21.info',
];

const CANDIDATE_PATHS = ['/sitemap.xml', '/sitemap_index.xml'];

async function findExistingSitemap(domain: string): Promise<string | null> {
  for (const path of CANDIDATE_PATHS) {
    const url = `https://${domain}${path}`;
    try {
      const res = await fetch(url, { method: 'GET', redirect: 'follow' });
      if (res.ok) {
        const text = await res.text();
        if (text.includes('<urlset') || text.includes('<sitemapindex')) return url;
      }
    } catch {
      // try next candidate
    }
  }
  return null;
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: 'Nicht berechtigt.' }, { status: 403 });
  }

  const service = createServiceClient();
  const { data: tokenRow } = await service.from('sq_admin_tokens').select('refresh_token').eq('key', 'search_console').single();
  if (!tokenRow?.refresh_token) return NextResponse.json({ error: 'Search Console nicht verbunden.' }, { status: 400 });

  const accessToken = await refreshAccessToken(tokenRow.refresh_token);

  const results: { domain: string; status: 'submitted' | 'not-found' | 'error'; sitemapUrl?: string; detail?: string }[] = [];

  const CONCURRENCY = 4;
  let cursor = 0;
  async function worker() {
    while (cursor < NO_SITEMAP_DOMAINS.length) {
      const domain = NO_SITEMAP_DOMAINS[cursor++];
      try {
        const found = await findExistingSitemap(domain);
        if (!found) {
          results.push({ domain, status: 'not-found' });
        } else {
          await submitSitemap(accessToken, `sc-domain:${domain}`, found);
          results.push({ domain, status: 'submitted', sitemapUrl: found });
        }
      } catch (e) {
        results.push({ domain, status: 'error', detail: e instanceof Error ? e.message : String(e) });
      }
      await new Promise(r => setTimeout(r, 200));
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  return NextResponse.json({ results });
}
