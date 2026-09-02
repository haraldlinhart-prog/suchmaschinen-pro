import { escapeHtml } from '@/lib/ai/generateArticle';

// Intentionally untyped (not matched structurally against the real generated Supabase
// client) — that structural match is what caused "Type instantiation is excessively deep"
// in the Next.js build. See chat 02.09.26.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseLike = any;

interface PublishedArticle {
  title: string;
  slug: string;
  meta_description: string | null;
  published_at: string;
}

function buildIndexHtml(domain: string, articles: PublishedArticle[]): string {
  const items = articles
    .map(
      a => `  <li>
    <a href="./${a.slug}/">${escapeHtml(a.title)}</a>
    ${a.meta_description ? `<p>${escapeHtml(a.meta_description)}</p>` : ''}
  </li>`
    )
    .join('\n');

  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>News – ${escapeHtml(domain)}</title>
<meta name="robots" content="index, follow">
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
<a class="back" href="https://${domain}/">&larr; Zurück zu ${escapeHtml(domain)}</a>
<h1>News</h1>
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
export async function publishNewsIndex(
  website: { id: string; domain: string; github_repo: string | null; publish_path: string },
  supabase: SupabaseLike
): Promise<void> {
  if (!website.github_repo) return;
  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken) return;

  const { data } = await supabase
    .from('sq_articles')
    .select('title, slug, meta_description, published_at')
    .eq('website_id', website.id)
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  const articles = (data || []) as unknown as PublishedArticle[];
  if (articles.length === 0) return;

  const [owner, repo] = website.github_repo.split('/');
  const cleanPublishPath = (website.publish_path || '/blog/').replace(/^\/|\/$/g, '');

  const rootRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/`, {
    headers: { Authorization: `token ${githubToken}`, Accept: 'application/vnd.github+json' },
  });
  const rootEntries: Array<{ name: string }> = rootRes.ok ? await rootRes.json() : [];
  const isNextJs = rootEntries.some(e => /^next\.config\.(js|mjs|ts)$/.test(e.name));
  const publishPrefix = isNextJs ? `public/${cleanPublishPath}` : cleanPublishPath;
  const indexPath = `${publishPrefix}/index.html`;

  const html = buildIndexHtml(website.domain, articles);
  const contentBase64 = Buffer.from(html, 'utf-8').toString('base64');

  // Need the current sha if the file already exists, otherwise GitHub rejects the PUT.
  let sha: string | undefined;
  const existingRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${indexPath}`, {
    headers: { Authorization: `token ${githubToken}`, Accept: 'application/vnd.github+json' },
  });
  if (existingRes.ok) {
    const existing = await existingRes.json();
    sha = existing.sha;
  }

  await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${indexPath}`, {
    method: 'PUT',
    headers: {
      Authorization: `token ${githubToken}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: 'suchmaschinen.pro: update news index',
      content: contentBase64,
      ...(sha ? { sha } : {}),
    }),
  }).catch(err => console.error('publishNewsIndex: failed to write index', err));
}
