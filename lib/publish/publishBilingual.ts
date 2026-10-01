import { generateArticleContent } from '@/lib/ai/generateArticle';
import { publishArticle, type PublishResult } from '@/lib/publish/publishArticle';
import { publishNewsIndex } from '@/lib/publish/publishNewsIndex';

// Intentionally untyped — see publishNewsIndex.ts for why (structural match against the
// generated Supabase client blew up TS build times / "excessively deep" errors).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseLike = any;

interface WebsiteRow {
  id: string;
  user_id: string;
  domain: string;
  notes: string | null;
  github_repo: string | null;
  publish_path: string;
  public_slug: string;
  hosting_platform: string;
  wp_url: string | null;
  wp_username: string | null;
  wp_app_password: string | null;
  facebook_page_id: string | null;
  facebook_page_token: string | null;
  facebook_post_language?: string | null;
  article_language?: string | null;
  secondary_language?: string | null;
  secondary_publish_path?: string | null;
}

interface ArticleRow {
  id: string;
  keyword?: string | null;
  slug: string;
  title: string;
  meta_description: string | null;
  content_html: string;
  image_url: string | null;
  image_alt: string | null;
  status?: string | null;
  language?: string | null;
}

/**
 * Publishes an article in the site's primary language, then — for bilingual sites
 * (secondary_language + secondary_publish_path both set) — generates and publishes a
 * translation of the same keyword under its own path (e.g. /en/blog/ next to the
 * German /blog/), as a separate sq_articles row linked via translation_of.
 *
 * Harry's decision (01.10.2026, turnkey-companies.com): the German blog at /blog/
 * stays untouched (existing 18 articles keep living there); English translations are
 * new articles under /en/blog/; Facebook only posts the English version, matching the
 * US/UK/Canada ad audience — handled by publishArticle()'s facebook_post_language gate.
 *
 * The translation step is best-effort: any failure (generation, insert, or publish) is
 * only logged — the primary-language publish above must never be undone by it.
 */
export async function publishArticleAndTranslation(
  website: WebsiteRow,
  article: ArticleRow,
  supabase: SupabaseLike
): Promise<PublishResult> {
  const primaryLanguage = website.article_language ?? 'de';
  const primaryResult = await publishArticle(website, article, { language: primaryLanguage });

  if (website.secondary_language && website.secondary_publish_path && article.keyword) {
    // Must be awaited, not fire-and-forget: a Vercel serverless function's execution
    // environment is frozen/torn down as soon as the HTTP response is sent, so a
    // detached (un-awaited) promise is not reliably given the chance to finish — it was
    // silently never completing (no error logged, the code just never got far enough).
    // The primary publish above has already succeeded and must stand regardless of what
    // happens here — hence the try/catch, not the missing await.
    try {
      await publishSecondaryLanguage(website, article, primaryLanguage, supabase);
    } catch (err) {
      console.error(`publishArticleAndTranslation: secondary-language publish failed for ${website.domain}/${article.slug}:`, err);
    }
  }

  return primaryResult;
}

async function publishSecondaryLanguage(
  website: WebsiteRow,
  article: ArticleRow,
  primaryLanguage: string,
  supabase: SupabaseLike
): Promise<void> {
  const secondaryLanguage = website.secondary_language as string;
  const secondaryPublishPath = website.secondary_publish_path as string;

  if (secondaryLanguage === primaryLanguage) return; // nothing to translate into

  const generated = await generateArticleContent(
    website.domain,
    website.notes,
    article.keyword as string,
    undefined,
    undefined,
    [],
    secondaryLanguage
  );

  const { data: translationRow, error: insertError } = await supabase
    .from('sq_articles')
    .insert({
      website_id: website.id,
      user_id: website.user_id,
      keyword: article.keyword,
      title: generated.title,
      slug: generated.slug,
      meta_description: generated.meta_description,
      content_html: generated.content_html,
      image_url: generated.image_url,
      image_alt: generated.image_alt,
      language: secondaryLanguage,
      translation_of: article.id,
      status: 'draft',
    })
    .select()
    .single();

  if (insertError || !translationRow) {
    throw new Error(`insert failed: ${insertError?.message}`);
  }

  const result = await publishArticle(website, translationRow, {
    language: secondaryLanguage,
    publishPath: secondaryPublishPath,
  });

  await supabase
    .from('sq_articles')
    .update({
      status: 'published',
      published_at: new Date().toISOString(),
      published_url: result.url,
      ...(result.githubPath ? { github_path: result.githubPath } : {}),
    })
    .eq('id', translationRow.id);

  await publishNewsIndex(website, supabase, {
    language: secondaryLanguage,
    publishPath: secondaryPublishPath,
  }).catch(e => console.error(`publishNewsIndex (secondary language) failed for ${website.domain}`, e));
}
