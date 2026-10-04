import { publishArticle } from '@/lib/publish/publishArticle';
import { relatedArticles, addRelatedLink, type LinkTarget } from '@/lib/content/internalLinks';
import { refreshArticleContent } from '@/lib/content/refreshArticle';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseLike = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type WebsiteRow = any;

/** Bilingual sites keep the secondary-language articles under their own publish_path
 *  (e.g. /en/blog/) — republishing (backlink injection, content refresh) must target
 *  the same path and <html lang> the article was originally published with, not the
 *  site's primary publish_path. */
function publishOptionsFor(website: WebsiteRow, row: { language?: string | null }) {
  if (website.secondary_language && row.language === website.secondary_language) {
    return { language: website.secondary_language, publishPath: website.secondary_publish_path };
  }
  return { language: website.article_language ?? 'de' };
}

const REFRESH_EVERY_DAYS_PER_SITE = 3;
const REFRESH_SAME_ARTICLE_AFTER_DAYS = 60;
const MIN_AGE_DAYS = 28;

/** Republishing only makes sense where we own the URL: GitHub repos and hosted pages. */
export function canRepublish(website: WebsiteRow): boolean {
  if (website.github_repo) return true;
  return !(website.hosting_platform === 'wordpress' && website.wp_url);
}

/** The language an article row is published in (legacy rows without one = primary). */
export function rowLanguage(website: WebsiteRow, row: { language?: string | null }): string {
  return row.language || website.article_language || 'de';
}

/**
 * Link candidates of one site. With `language`, only articles in that language
 * (04.10.2026: turnkey-companies.com's English articles got a German "Passend zum
 * Thema" block linking to the German originals).
 */
export async function linkTargets(website: WebsiteRow, supabase: SupabaseLike, excludeId?: string, language?: string): Promise<LinkTarget[]> {
  const { data } = await supabase
    .from('sq_articles')
    .select('id, title, keyword, published_url, language')
    .eq('website_id', website.id)
    .eq('status', 'published')
    .not('published_url', 'is', null);
  return (data || [])
    .filter((a: { id: string; language?: string | null }) => a.id !== excludeId && (!language || rowLanguage(website, a) === language))
    .map((a: { id: string; title: string; keyword: string; published_url: string }) => ({ id: a.id, title: a.title, keyword: a.keyword, url: a.published_url }));
}

/** Premium: give the two most related older articles (same language) a link to the newly published one. */
export async function backlinkOlderArticles(website: WebsiteRow, newArticle: { id: string; title: string; keyword: string; url: string; language?: string | null }, supabase: SupabaseLike): Promise<number> {
  if (!canRepublish(website)) return 0;
  const language = rowLanguage(website, newArticle);
  const targets = await linkTargets(website, supabase, newArticle.id, language);
  const best = relatedArticles(newArticle.keyword, newArticle.title, targets, 2);
  let done = 0;
  for (const t of best) {
    const { data: row } = await supabase.from('sq_articles').select('*').eq('id', t.id).single();
    if (!row) continue;
    const updated = addRelatedLink(row.content_html, { title: newArticle.title, url: newArticle.url }, language);
    if (updated === row.content_html) continue;
    await publishArticle(website, { ...row, content_html: updated }, { ...publishOptionsFor(website, row), supabase });
    await supabase.from('sq_articles').update({ content_html: updated }).eq('id', row.id);
    done++;
  }
  return done;
}

/**
 * Premium: pick one article that lost positions or stalls on page 2–4 and refresh it.
 * At most one refresh per site every few days, and the same article at most every 60 days.
 */
export async function maybeRefreshOne(website: WebsiteRow, supabase: SupabaseLike): Promise<string | null> {
  if (!canRepublish(website)) return null;
  if (website.last_refreshed_at && Date.now() - new Date(website.last_refreshed_at).getTime() < REFRESH_EVERY_DAYS_PER_SITE * 86400000) return null;

  const { data } = await supabase
    .from('sq_articles')
    .select('*')
    .eq('website_id', website.id)
    .eq('status', 'published')
    .not('gsc_position', 'is', null);
  const now = Date.now();
  const candidates = (data || [])
    .filter((a: WebsiteRow) => a.published_at && now - new Date(a.published_at).getTime() >= MIN_AGE_DAYS * 86400000)
    .filter((a: WebsiteRow) => !a.refreshed_at || now - new Date(a.refreshed_at).getTime() >= REFRESH_SAME_ARTICLE_AFTER_DAYS * 86400000)
    .map((a: WebsiteRow) => {
      const pos = Number(a.gsc_position);
      const best = a.gsc_best_position !== null ? Number(a.gsc_best_position) : null;
      const dropped = best !== null && pos > best + 5;
      const stalling = pos > 8 && pos <= 40 && (a.gsc_impressions || 0) >= 5;
      return { a, pos, best, dropped, stalling, potential: (a.gsc_impressions || 0) * (dropped ? 2 : 1) };
    })
    .filter((c: { dropped: boolean; stalling: boolean }) => c.dropped || c.stalling)
    .sort((x: { potential: number }, y: { potential: number }) => y.potential - x.potential);

  const pick = candidates[0];
  if (!pick) return null;

  const targets = await linkTargets(website, supabase, pick.a.id, rowLanguage(website, pick.a));
  const related = relatedArticles(pick.a.keyword, pick.a.title, targets, 3).map(t => ({ title: t.title, url: t.url }));
  const revised = await refreshArticleContent({
    domain: website.domain,
    notes: website.notes,
    keyword: pick.a.keyword,
    title: pick.a.title,
    contentHtml: pick.a.content_html,
    position: pick.pos,
    bestPosition: pick.best,
    related,
  });

  // Keep the existing "Passend zum Thema" links the article already had.
  const keptBlock = (pick.a.content_html.match(/<!-- sp:related -->[\s\S]*?<!-- \/sp:related -->/) || [''])[0];
  const content = keptBlock ? `${revised.content_html}\n${keptBlock}` : revised.content_html;
  const reason = pick.dropped ? `Position verschlechtert (${pick.best} → ${pick.pos})` : `Seite ${Math.ceil(pick.pos / 10)} (Position ${pick.pos})`;

  await publishArticle(website, { ...pick.a, title: revised.title, meta_description: revised.meta_description, content_html: content }, { ...publishOptionsFor(website, pick.a), supabase });
  await supabase.from('sq_articles').update({
    title: revised.title,
    meta_description: revised.meta_description,
    content_html: content,
    refreshed_at: new Date().toISOString(),
    refresh_count: (pick.a.refresh_count || 0) + 1,
    refresh_reason: reason,
  }).eq('id', pick.a.id);
  await supabase.from('sq_websites').update({ last_refreshed_at: new Date().toISOString() }).eq('id', website.id);
  return `${pick.a.title} – ${reason}`;
}
