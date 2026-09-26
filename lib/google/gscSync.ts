import { createServiceClient } from '@/lib/supabase/service';
import { refreshAccessToken, searchAnalyticsByPage, inspectUrlIndex } from '@/lib/google/searchconsole';

// Daily: pull Search Console performance per published article and check whether Google
// has indexed it (chat 26.09.26 — proof that the articles actually pay off, and an early
// warning like the firmenabwicklung.de case where six live articles were never found).
// Uses the admin Search Console connection, so it covers every domain in Harry's Search
// Console; customer domains without access are marked "no_access" and skipped.

const INSPECT_BUDGET_PER_RUN = 400; // URL Inspection quota is ~2000/day per property; stay well below
const RECHECK_INDEXED_AFTER_DAYS = 14;
const RECHECK_OTHER_AFTER_DAYS = 2;

function norm(url: string): string {
  try {
    const u = new URL(url);
    return `${u.hostname.replace(/^www\./, '')}${u.pathname.replace(/\/+$/, '')}`.toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

function isoDay(offsetDays: number): string {
  return new Date(Date.now() - offsetDays * 86400000).toISOString().slice(0, 10);
}

async function resolveOrigin(domain: string): Promise<string> {
  try {
    const res = await fetch(`https://${domain}/`, { redirect: 'follow' });
    return new URL(res.url).origin;
  } catch {
    return `https://${domain}`;
  }
}

function indexStatusFrom(verdict: string, coverage?: string): string {
  if (verdict === 'PASS') return 'indexed';
  if (coverage && /unknown to google|unbekannt|nicht bekannt/i.test(coverage)) return 'unknown';
  return 'not_indexed';
}

export async function runGscSync() {
  const supabase = createServiceClient();
  const { data: tokenRow } = await supabase.from('sq_admin_tokens').select('refresh_token').eq('key', 'search_console').single();
  if (!tokenRow?.refresh_token) throw new Error('Search Console nicht verbunden.');
  const accessToken = await refreshAccessToken(tokenRow.refresh_token);

  const { data: articles } = await supabase
    .from('sq_articles')
    .select('id, website_id, published_url, index_status, index_checked_at, sq_websites!inner(domain)')
    .eq('status', 'published')
    .not('published_url', 'is', null);

  // Group by website.
  type Row = { id: string; website_id: string; published_url: string; index_status: string | null; index_checked_at: string | null; sq_websites: { domain: string } | { domain: string }[] };
  const bySite = new Map<string, { domain: string; items: Row[] }>();
  for (const a of (articles || []) as Row[]) {
    const site = Array.isArray(a.sq_websites) ? a.sq_websites[0] : a.sq_websites;
    if (!bySite.has(a.website_id)) bySite.set(a.website_id, { domain: site.domain, items: [] });
    bySite.get(a.website_id)!.items.push(a);
  }

  let inspectBudget = INSPECT_BUDGET_PER_RUN;
  const results: Array<{ domain: string; articles: number; withData: number; inspected: number; indexed: number; error?: string }> = [];
  const now = new Date().toISOString();

  for (const { domain, items } of bySite.values()) {
    const siteUrl = `sc-domain:${domain.replace(/^www\./, '')}`;
    const summary = { domain, articles: items.length, withData: 0, inspected: 0, indexed: 0 } as (typeof results)[number];
    try {
      // 1. Performance, last 28 days (Search Console data lags ~2 days).
      let rows: Awaited<ReturnType<typeof searchAnalyticsByPage>> = [];
      try {
        rows = await searchAnalyticsByPage(accessToken, siteUrl, isoDay(30), isoDay(2));
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (/permission|not.*verified|403/i.test(msg)) {
          await supabase.from('sq_articles').update({ index_status: 'no_access', index_checked_at: now }).in('id', items.map(i => i.id));
          summary.error = 'kein Search-Console-Zugriff';
          results.push(summary);
          continue;
        }
        throw e;
      }
      const perf = new Map(rows.map(r => [norm(r.page), r]));
      for (const a of items) {
        const r = perf.get(norm(a.published_url));
        if (r) summary.withData++;
        await supabase.from('sq_articles').update({
          gsc_impressions: r ? Math.round(r.impressions) : 0,
          gsc_clicks: r ? Math.round(r.clicks) : 0,
          gsc_position: r ? Math.round(r.position * 10) / 10 : null,
          gsc_updated_at: now,
        }).eq('id', a.id);
      }

      // 2. Index status — oldest checks first, indexed articles only re-checked occasionally.
      const origin = await resolveOrigin(domain);
      const due = items
        .filter(a => {
          if (!a.index_checked_at || a.index_status === 'no_access') return true;
          const age = (Date.now() - new Date(a.index_checked_at).getTime()) / 86400000;
          return age >= (a.index_status === 'indexed' ? RECHECK_INDEXED_AFTER_DAYS : RECHECK_OTHER_AFTER_DAYS);
        })
        .sort((x, y) => (x.index_checked_at || '').localeCompare(y.index_checked_at || ''));

      for (const a of due) {
        if (inspectBudget <= 0) break;
        inspectBudget--;
        // Inspect the URL the site actually serves (apex vs. www), not a redirecting one.
        const u = new URL(a.published_url);
        const target = `${origin}${u.pathname}`;
        try {
          const r = await inspectUrlIndex(accessToken, siteUrl, target);
          const status = indexStatusFrom(r.verdict, r.coverageState);
          if (status === 'indexed') summary.indexed++;
          summary.inspected++;
          await supabase.from('sq_articles').update({
            index_status: status,
            index_coverage: r.coverageState || null,
            index_last_crawl: r.lastCrawlTime || null,
            index_checked_at: now,
          }).eq('id', a.id);
        } catch (e) {
          const status = (e as { status?: number }).status;
          if (status === 429) { inspectBudget = 0; break; }
          if (status === 403) {
            await supabase.from('sq_articles').update({ index_status: 'no_access', index_checked_at: now }).eq('id', a.id);
            break;
          }
          console.error(`gsc-sync: inspect failed for ${target}`, e);
        }
      }
    } catch (e) {
      summary.error = e instanceof Error ? e.message : String(e);
      console.error(`gsc-sync failed for ${domain}`, e);
    }
    results.push(summary);
  }

  return { ranAt: now, inspectBudgetLeft: inspectBudget, results };
}
