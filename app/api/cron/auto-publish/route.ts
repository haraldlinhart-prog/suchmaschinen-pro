import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { fetchSiteText, suggestKeywords, type SuggestedKeyword } from '@/lib/ai/analyzeWebsite';
import { generateArticleContent } from '@/lib/ai/generateArticle';
import { publishArticle } from '@/lib/publish/publishArticle';

export const maxDuration = 300; // allow up to 5 minutes for multiple sites in one run

const PLAN_INTERVAL_DAYS: Record<string, number> = { basic: 7, plus: 1 };

function isDue(lastAutoPublishedAt: string | null, plan: string): boolean {
  if (!lastAutoPublishedAt) return true;
  const intervalDays = PLAN_INTERVAL_DAYS[plan] ?? 7;
  const elapsedMs = Date.now() - new Date(lastAutoPublishedAt).getTime();
  return elapsedMs >= intervalDays * 24 * 60 * 60 * 1000;
}

export async function GET(req: NextRequest) {
  // Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` automatically when the
  // CRON_SECRET env var is set on the project. Reject anything else.
  const authHeader = req.headers.get('authorization');
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();
  const results: Array<{ domain: string; status: string; detail?: string }> = [];

  const { data: websites, error } = await supabase
    .from('sq_websites')
    .select('*')
    .eq('auto_publish', true)
    .eq('status', 'active');

  if (error) {
    console.error('Cron: failed to load websites', error);
    return NextResponse.json({ error: 'Failed to load websites' }, { status: 500 });
  }

  for (const website of websites || []) {
    try {
      if (!isDue(website.last_auto_published_at, website.plan)) {
        results.push({ domain: website.domain, status: 'skipped-not-due' });
        continue;
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

      if (pool.length === 0) {
        results.push({ domain: website.domain, status: 'no-keywords-available' });
        continue;
      }

      const next = pool[0];
      const generated = await generateArticleContent(website.domain, website.notes, next.keyword, next.rationale, next.intent);

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
          status: 'draft',
        })
        .select()
        .single();

      if (insertError || !articleRow) throw new Error(`insert failed: ${insertError?.message}`);

      const publishResult = await publishArticle(website, articleRow);

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

      results.push({ domain: website.domain, status: 'published', detail: publishResult.url });
    } catch (siteErr) {
      console.error(`Cron: failed for ${website.domain}`, siteErr);
      results.push({ domain: website.domain, status: 'error', detail: siteErr instanceof Error ? siteErr.message : String(siteErr) });
    }
  }

  return NextResponse.json({ ranAt: new Date().toISOString(), results });
}
