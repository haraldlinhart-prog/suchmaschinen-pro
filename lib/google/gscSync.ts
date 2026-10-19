import { createServiceClient } from '@/lib/supabase/service';
import { getScAccessToken } from '@/lib/google/scToken';
import { resolveOrigin } from '@/lib/publish/origin';
import { searchAnalyticsByPage, inspectUrlIndex } from '@/lib/google/searchconsole';

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


function indexStatusFrom(verdict: string, coverage?: string): string {
  if (verdict === 'PASS') return 'indexed';
  if (coverage && /unknown to google|unbekannt|nicht bekannt/i.test(coverage)) return 'unknown';
  return 'not_indexed';
}

// Fan-out (19.10.2026): one invocation for all sites ran into the 800 s limit every day,
// so sites late in the list were never synced. The cron call now only dispatches; every
// site runs in its own invocation (?site=<id>) with its own time budget, like auto-publish.
const DISPATCH_CONCURRENCY = 6;
const DISPATCH_BUDGET_MS = 700_000;
// The URL Inspection quota is per property, so each site gets its own budget.
const INSPECT_BUDGET_PER_SITE = 60;
// Explicit www host: the apex 308-redirects and fetch drops the Authorization header.
const WORKER_ORIGIN = process.env.CRON_WORKER_ORIGIN || 'https://www.suchmaschinen.pro';

export async function dispatchGscSync() {
  const supabase = createServiceClient();
  const { data: sites, error } = await supabase.from('sq_websites').select('id, domain');
  if (error) throw new Error(`failed to load websites: ${error.message}`);

  const queue = [...(sites || [])];
  const started = Date.now();
  const results: Array<{ domain: string; articles?: number; withData?: number; inspected?: number; indexed?: number; error?: string }> = [];

  async function lane() {
    while (queue.length) {
      const site = queue.shift()!;
      if (Date.now() - started > DISPATCH_BUDGET_MS) {
        results.push({ domain: site.domain, error: 'deferred-time-budget' });
        continue;
      }
      try {
        const res = await fetch(`${WORKER_ORIGIN}/api/cron/gsc-sync?site=${encodeURIComponent(site.id)}`, {
          headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
          cache: 'no-store',
        });
        const data = await res.json().catch(() => null);
        if (res.ok && Array.isArray(data?.results)) results.push(...data.results);
        else results.push({ domain: site.domain, error: `worker HTTP ${res.status}` });
      } catch (err) {
        results.push({ domain: site.domain, error: err instanceof Error ? err.message : String(err) });
      }
    }
  }
  await Promise.all(Array.from({ length: DISPATCH_CONCURRENCY }, lane));
  return { ranAt: new Date().toISOString(), results: results.filter(r => r.error || r.articles) };
}

export async function runGscSync(siteId?: string) {
  const supabase = createServiceClient();
  // Each site is read with its owner's own Search Console connection.
  const tokenCache = new Map<string, string | null>();
  const tokenFor = async (userId: string) => {
    if (!tokenCache.has(userId)) tokenCache.set(userId, await getScAccessToken(userId).catch(() => null));
    return tokenCache.get(userId) || null;
  };

  let query = supabase
    .from('sq_articles')
    .select('id, website_id, published_url, index_status, index_checked_at, gsc_best_position, sq_websites!inner(domain, user_id)')
    .eq('status', 'published')
    .not('published_url', 'is', null);
  if (siteId) query = query.eq('website_id', siteId);
  const { data: articles } = await query;

  // Group by website.
  type Row = { id: string; website_id: string; published_url: string; index_status: string | null; index_checked_at: string | null; gsc_best_position: number | null; sq_websites: { domain: string; user_id: string } | { domain: string; user_id: string }[] };
  const bySite = new Map<string, { domain: string; userId: string; items: Row[] }>();
  for (const a of (articles || []) as Row[]) {
    const site = Array.isArray(a.sq_websites) ? a.sq_websites[0] : a.sq_websites;
    if (!bySite.has(a.website_id)) bySite.set(a.website_id, { domain: site.domain, userId: site.user_id, items: [] });
    bySite.get(a.website_id)!.items.push(a);
  }

  let inspectBudget = siteId ? INSPECT_BUDGET_PER_SITE : INSPECT_BUDGET_PER_RUN;
  const results: Array<{ domain: string; articles: number; withData: number; inspected: number; indexed: number; error?: string }> = [];
  const now = new Date().toISOString();

  for (const { domain, userId, items } of bySite.values()) {
    const accessToken = await tokenFor(userId);
    if (!accessToken) {
      results.push({ domain, articles: items.length, withData: 0, inspected: 0, indexed: 0, error: 'Search Console des Inhabers nicht verbunden' });
      continue;
    }
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
        const pos = r ? Math.round(r.position * 10) / 10 : null;
        const best = pos === null ? a.gsc_best_position : a.gsc_best_position === null ? pos : Math.min(Number(a.gsc_best_position), pos);
        await supabase.from('sq_articles').update({
          gsc_impressions: r ? Math.round(r.impressions) : 0,
          gsc_clicks: r ? Math.round(r.clicks) : 0,
          gsc_position: pos,
          gsc_best_position: best,
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
