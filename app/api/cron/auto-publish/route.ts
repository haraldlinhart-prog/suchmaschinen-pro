import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { fetchSiteText, suggestKeywords, type SuggestedKeyword } from '@/lib/ai/analyzeWebsite';
import { generateArticleContent } from '@/lib/ai/generateArticle';
import { publishArticleAndTranslation } from '@/lib/publish/publishBilingual';
import { publishNewsIndex } from '@/lib/publish/publishNewsIndex';
import { featuresFor } from '@/lib/content/planFeatures';
import { linkTargets, backlinkOlderArticles, maybeRefreshOne } from '@/lib/content/premiumJobs';
import { relatedArticles } from '@/lib/content/internalLinks';
import { getKeywordVolumes } from '@/lib/keywords/volume';
import { ensureDiscoverability } from '@/lib/publish/ensureDiscoverability';

export const maxDuration = 800; // Vercel Pro/Fluid Compute ceiling - was 300s, raised as the number of sites grew

const PLAN_INTERVAL_DAYS: Record<string, number> = { free: 14, basic: 7, pro: 2, premium: 1 };

function isDue(lastAutoPublishedAt: string | null, plan: string): boolean {
  if (!lastAutoPublishedAt) return true;
  const intervalDays = PLAN_INTERVAL_DAYS[plan] ?? 7;
  const elapsedMs = Date.now() - new Date(lastAutoPublishedAt).getTime();
  return elapsedMs >= intervalDays * 24 * 60 * 60 * 1000;
}

type SiteResult = { domain: string; status: string; detail?: string };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyWebsite = any;

// Fan-out (04.10.2026): the old version handled all sites one after another in ONE
// invocation. With 58 sites (+ Premium refresh jobs) it hit the 800 s limit every day
// (504), so the sites at the end of the loop were never published — 28 sites overdue,
// some since 23.09. Now the cron call only dispatches: every site runs in its own
// invocation (?site=<id>) with its own 800 s budget, a few at a time, most overdue first.
const DISPATCH_CONCURRENCY = 8;
// Stop starting new sites before the dispatcher itself hits maxDuration; sites already
// started run to completion in their own invocations, the rest are first in line tomorrow.
const DISPATCH_BUDGET_MS = 700_000;

function authorized(req: NextRequest): boolean {
  // Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` automatically when the
  // CRON_SECRET env var is set on the project. Reject anything else.
  const authHeader = req.headers.get('authorization');
  return !!process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();
  const siteId = req.nextUrl.searchParams.get('site');

  // Worker: one site.
  if (siteId) {
    const { data: website, error } = await supabase
      .from('sq_websites')
      .select('*')
      .eq('id', siteId)
      .eq('auto_publish', true)
      .eq('status', 'active')
      .maybeSingle();
    if (error || !website) {
      return NextResponse.json({ error: 'Website not found or not active' }, { status: 404 });
    }
    const results = await processWebsite(website, supabase);
    return NextResponse.json({ ranAt: new Date().toISOString(), results });
  }

  // Dispatcher: all sites.
  const { data: websites, error } = await supabase
    .from('sq_websites')
    .select('id, domain, plan, last_auto_published_at')
    .eq('auto_publish', true)
    .eq('status', 'active');

  if (error) {
    console.error('Cron: failed to load websites', error);
    return NextResponse.json({ error: 'Failed to load websites' }, { status: 500 });
  }

  // Due sites first, longest-waiting first; then the rest (they still need the daily
  // discoverability check and Premium refresh).
  const ts = (w: { last_auto_published_at: string | null }) => (w.last_auto_published_at ? new Date(w.last_auto_published_at).getTime() : 0);
  const queue = [...(websites || [])].sort((a, b) => {
    const dueA = isDue(a.last_auto_published_at, a.plan), dueB = isDue(b.last_auto_published_at, b.plan);
    if (dueA !== dueB) return dueA ? -1 : 1;
    return ts(a) - ts(b);
  });

  const started = Date.now();
  const results: SiteResult[] = [];
  const auth = req.headers.get('authorization')!;

  async function lane() {
    while (queue.length) {
      const site = queue.shift()!;
      if (Date.now() - started > DISPATCH_BUDGET_MS) {
        results.push({ domain: site.domain, status: 'deferred-time-budget' });
        continue;
      }
      try {
        const res = await fetch(`${req.nextUrl.origin}/api/cron/auto-publish?site=${encodeURIComponent(site.id)}`, {
          headers: { Authorization: auth },
          cache: 'no-store',
        });
        const data = await res.json().catch(() => null);
        if (res.ok && Array.isArray(data?.results)) results.push(...data.results);
        else results.push({ domain: site.domain, status: 'error', detail: `worker HTTP ${res.status}` });
      } catch (err) {
        results.push({ domain: site.domain, status: 'error', detail: err instanceof Error ? err.message : String(err) });
      }
    }
  }
  await Promise.all(Array.from({ length: DISPATCH_CONCURRENCY }, lane));

  return NextResponse.json({ ranAt: new Date().toISOString(), results });
}

async function processWebsite(website: AnyWebsite, supabase: ReturnType<typeof createServiceClient>): Promise<SiteResult[]> {
  const results: SiteResult[] = [];
  {
    try {
      // Runs every day for every site, not just on publish days, so sites that already
      // have articles get their sitemap/robots/homepage link fixed (idempotent).
      await ensureDiscoverability(website, supabase).catch(e => console.error(`ensureDiscoverability failed for ${website.domain}`, e));

      // Premium: refresh one article that lost positions or stalls on page 2–4 (chat 26.09.26).
      if (featuresFor(website.plan).refresh) {
        try {
          const refreshed = await maybeRefreshOne(website, supabase);
          if (refreshed) results.push({ domain: website.domain, status: 'refreshed', detail: refreshed });
        } catch (e) {
          console.error(`Cron: refresh failed for ${website.domain}`, e);
        }
      }

      if (!isDue(website.last_auto_published_at, website.plan)) {
        results.push({ domain: website.domain, status: 'skipped-not-due' });
        return results;
      }

      // Free tier only runs while the badge is embedded (see chat 02.09.26 pricing model).
      if (website.badge_required && website.badge_status !== 'active') {
        results.push({ domain: website.domain, status: 'skipped-badge-missing' });
        return results;
      }

      // Prefer publishing an existing unpublished draft (e.g. one generated manually and
      // never confirmed) over writing a brand new article — otherwise that draft's keyword
      // silently counts as "used" forever and the draft never goes live (see chat 03.09.26).
      const { data: pendingDrafts } = await supabase
        .from('sq_articles')
        .select('*')
        .eq('website_id', website.id)
        .eq('status', 'draft')
        .order('created_at', { ascending: true })
        .limit(1);
      const pendingDraft = pendingDrafts?.[0];

      if (pendingDraft) {
        const publishResult = await publishArticleAndTranslation(website, pendingDraft, supabase);

        await supabase
          .from('sq_articles')
          .update({
            status: 'published',
            published_at: new Date().toISOString(),
            published_url: publishResult.url,
            ...(publishResult.githubPath ? { github_path: publishResult.githubPath } : {}),
          })
          .eq('id', pendingDraft.id);

        await supabase.from('sq_websites').update({ last_auto_published_at: new Date().toISOString() }).eq('id', website.id);
        await publishNewsIndex(website, supabase, { language: website.article_language ?? 'de', includeLegacyNullLanguage: true }).catch(e => console.error('publishNewsIndex failed', e));
        await ensureDiscoverability(website, supabase).catch(e => console.error('ensureDiscoverability failed', e));

        results.push({ domain: website.domain, status: 'published-pending-draft', detail: publishResult.url });
        return results;
      }

      // Determine which suggested keywords are still unused.
      const { data: existingArticles } = await supabase
        .from('sq_articles')
        .select('keyword')
        .eq('website_id', website.id);
      const usedKeywords = new Set((existingArticles || []).map(a => a.keyword));

      let pool: SuggestedKeyword[] = (website.suggested_keywords || []).filter(
        (k: SuggestedKeyword) => !usedKeywords.has(k.keyword)
      );

      // Refill: if the pool is running low, ask for a fresh batch avoiding used keywords.
      if (pool.length < 3) {
        try {
          const { pageText, pageTitle } = await fetchSiteText(website.domain);
          const fresh = await suggestKeywords(website.domain, pageTitle, pageText, Array.from(usedKeywords));
          const merged: SuggestedKeyword[] = [
            ...(website.suggested_keywords || []),
            ...fresh.filter(f => !(website.suggested_keywords || []).some((e: SuggestedKeyword) => e.keyword === f.keyword)),
          ];
          await supabase.from('sq_websites').update({ suggested_keywords: merged, last_analyzed_at: new Date().toISOString() }).eq('id', website.id);
          pool = merged.filter((k: SuggestedKeyword) => !usedKeywords.has(k.keyword));
        } catch (refillErr) {
          console.error(`Cron: keyword refill failed for ${website.domain}`, refillErr);
        }
      }

      // Don't write filler: skip suggested keywords that Google data shows nobody searches
      // for. Keywords the customer picked or queued themselves are always kept (chat 26.09.26).
      try {
        const vols = await getKeywordVolumes(pool.slice(0, 30).map(k => k.keyword));
        pool = pool.filter((k: SuggestedKeyword & { source?: string }) => {
          if (k.source === 'manual' || k.source === 'search_console') return true;
          const v = vols[k.keyword.trim().toLowerCase().replace(/\s+/g, ' ')];
          return !v || v.volume === null || v.volume > 0;
        });
      } catch (volErr) {
        console.error(`Cron: volume check failed for ${website.domain}`, volErr);
      }

      if (pool.length === 0) {
        results.push({ domain: website.domain, status: 'no-worthwhile-keywords' });
        return results;
      }

      const next = pool[0];
      const features = featuresFor(website.plan);
      const related = features.internalLinks
        ? relatedArticles(next.keyword, next.keyword, await linkTargets(website.id, supabase), 3).map(t => ({ title: t.title, url: t.url }))
        : [];
      const generated = await generateArticleContent(website.domain, website.notes, next.keyword, next.rationale, next.intent, related, website.article_language ?? 'de');

      const { data: articleRow, error: insertError } = await supabase
        .from('sq_articles')
        .insert({
          website_id: website.id,
          user_id: website.user_id,
          keyword: next.keyword,
          title: generated.title,
          slug: generated.slug,
          meta_description: generated.meta_description,
          content_html: generated.content_html,
          image_url: generated.image_url,
          image_alt: generated.image_alt,
          language: website.article_language ?? 'de',
          status: 'draft',
        })
        .select()
        .single();

      if (insertError || !articleRow) throw new Error(`insert failed: ${insertError?.message}`);

      const publishResult = await publishArticleAndTranslation(website, articleRow, supabase);

      await supabase
        .from('sq_articles')
        .update({
          status: 'published',
          published_at: new Date().toISOString(),
          published_url: publishResult.url,
          ...(publishResult.githubPath ? { github_path: publishResult.githubPath } : {}),
        })
        .eq('id', articleRow.id);

      await supabase.from('sq_websites').update({ last_auto_published_at: new Date().toISOString() }).eq('id', website.id);

      await publishNewsIndex(website, supabase, { language: website.article_language ?? 'de', includeLegacyNullLanguage: true }).catch(e => console.error('publishNewsIndex failed', e));
      await ensureDiscoverability(website, supabase).catch(e => console.error('ensureDiscoverability failed', e));

      if (features.backlinkOlder) {
        await backlinkOlderArticles(website, { id: articleRow.id, title: generated.title, keyword: next.keyword, url: publishResult.url }, supabase)
          .catch(e => console.error('backlinkOlderArticles failed', e));
      }

      results.push({ domain: website.domain, status: 'published', detail: publishResult.url });
    } catch (siteErr) {
      console.error(`Cron: failed for ${website.domain}`, siteErr);
      results.push({ domain: website.domain, status: 'error', detail: siteErr instanceof Error ? siteErr.message : String(siteErr) });
    }
  }

  return results;
}
