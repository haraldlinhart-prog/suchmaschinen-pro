import { escapeHtml } from '@/lib/ai/generateArticle';
import { resolveOrigin } from '@/lib/publish/origin';
import { commitFiles } from '@/lib/publish/githubCommit';

// Intentionally untyped (not matched structurally against the real generated Supabase
// client) — that structural match is what caused "Type instantiation is excessively deep"
// in the Next.js build. See chat 02.09.26.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseLike = any;

export interface PublishedArticle {
  title: string;
  slug: string;
  meta_description: string | null;
  published_at: string;
  language?: string | null;
}

function buildIndexHtml(domain: string, origin: string, canonical: string, publishPath: string, articles: PublishedArticle[], lang: string = 'de'): string {
  const items = articles
    .map(
      a => `  <li>
    <a href="${origin}/${publishPath}/${a.slug}/">${escapeHtml(a.title)}</a>
    ${a.meta_description ? `<p>${escapeHtml(a.meta_description)}</p>` : ''}
  </li>`
    )
    .join('\n');

  const title = lang === 'en' ? 'News' : 'News';
  const backLabel = lang === 'en' ? `Back to ${escapeHtml(domain)}` : `Zurück zu ${escapeHtml(domain)}`;

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} – ${escapeHtml(domain)}</title>
<meta name="robots" content="index, follow">
<link rel="canonical" href="${canonical}">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; max-width: 720px; margin: 0 auto; padding: 40px 20px; line-height: 1.7; color: #1a1a1a; }
  h1 { font-size: 1.8rem; margin-bottom: 1.5rem; }
  ul { list-style: none; padding: 0; }
  li { margin-bottom: 1.5rem; padding-bottom: 1.5rem; border-bottom: 1px solid #eee; }
  li a { font-size: 1.15rem; font-weight: 600; color: #1a1a1a; text-decoration: none; }
  li a:hover { text-decoration: underline; }
  li p { margin: 0.4rem 0 0; color: #555; font-size: 0.92rem; }
  a.back { display: inline-block; margin-bottom: 24px; color: #666; text-decoration: none; font-size: 0.9rem; }
</style>
</head>
<body>
<a class="back" href="${origin}/">&larr; ${backLabel}</a>
<h1>${title}</h1>
<ul>
${items}
</ul>
</body>
</html>
`;
}

/**
 * Regenerates the <publish_path>/index.html listing page after each publish,
 * so there's something to link a "News" menu entry to (see chat 02.09.26).
 */
export interface PublishNewsIndexOptions {
  /** Restricts the index to articles in this language. Omit for legacy (unfiltered)
   *  behavior. */
  language?: string;
  /** Overrides website.publish_path — used to regenerate a secondary-language index
   *  under its own path (e.g. /en/blog/). */
  publishPath?: string;
  /** When filtering by language, also include legacy rows where `language` is NULL
   *  (articles published before the bilingual feature existed). Only meaningful for
   *  the primary-language index, so old articles don't disappear from it. */
  includeLegacyNullLanguage?: boolean;
}

type IndexWebsite = { id: string; domain: string; github_repo: string | null; publish_path: string };

/**
 * Builds the index file (path relative to the repo root + HTML) without writing it.
 * `extra` is an article that is being published right now and is not yet marked
 * 'published' in the database — publishArticle() uses this to put the article and the
 * updated index into the same commit. A row with the same slug is replaced by it.
 */
export async function buildNewsIndexFile(
  website: IndexWebsite,
  supabase: SupabaseLike,
  options: PublishNewsIndexOptions | undefined,
  ctx: { isNextJs: boolean; origin: string },
  extra?: PublishedArticle
): Promise<{ path: string; content: string } | null> {
  let query = supabase
    .from('sq_articles')
    .select('title, slug, meta_description, published_at, language')
    .eq('website_id', website.id)
    .eq('status', 'published');

  if (options?.language) {
    query = options.includeLegacyNullLanguage
      ? query.or(`language.eq.${options.language},language.is.null`)
      : query.eq('language', options.language);
  }

  const { data } = await query.order('published_at', { ascending: false });

  let articles = (data || []) as unknown as PublishedArticle[];
  if (extra) {
    const rest = articles.filter(a => a.slug !== extra.slug);
    articles = [extra, ...rest].sort((a, b) => (b.published_at || '').localeCompare(a.published_at || ''));
  }
  if (articles.length === 0) return null;

  const cleanPublishPath = (options?.publishPath || website.publish_path || '/blog/').replace(/^\/|\/$/g, '');
  const publishPrefix = ctx.isNextJs ? `public/${cleanPublishPath}` : cleanPublishPath;
  const html = buildIndexHtml(website.domain, ctx.origin, `${ctx.origin}/${cleanPublishPath}/`, cleanPublishPath, articles, options?.language || 'de');
  return { path: `${publishPrefix}/index.html`, content: html };
}

export async function publishNewsIndex(
  website: IndexWebsite,
  supabase: SupabaseLike,
  options?: PublishNewsIndexOptions
): Promise<void> {
  if (!website.github_repo) return;
  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken) return;

  const [owner, repo] = website.github_repo.split('/');
  const rootRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/`, {
    headers: { Authorization: `token ${githubToken}`, Accept: 'application/vnd.github+json' },
  });
  const rootEntries: Array<{ name: string }> = rootRes.ok ? await rootRes.json() : [];
  const isNextJs = rootEntries.some(e => /^next\.config\.(js|mjs|ts)$/.test(e.name));
  const origin = await resolveOrigin(website.domain);

  const file = await buildNewsIndexFile(website, supabase, options, { isNextJs, origin });
  if (!file) return;
  // commitFiles skips the commit when the index is already up to date — which is the
  // normal case now that publishArticle() commits it together with the article.
  await commitFiles(owner, repo, githubToken, [file], 'suchmaschinen.pro: update news index')
    .catch(err => console.error('publishNewsIndex: failed to write index', err));
}
