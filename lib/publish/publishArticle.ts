import { escapeHtml } from '@/lib/ai/generateArticle';
import { resolveOrigin } from '@/lib/publish/origin';
import { postToFacebook } from '@/lib/publish/postToFacebook';

interface WebsiteRow {
  domain: string;
  github_repo: string | null;
  publish_path: string;
  public_slug: string;
  hosting_platform: string;
  wp_url: string | null;
  wp_username: string | null;
  wp_app_password: string | null;
  facebook_page_id: string | null;
  facebook_page_token: string | null;
}

interface ArticleRow {
  id: string;
  slug: string;
  title: string;
  meta_description: string | null;
  content_html: string;
  image_url: string | null;
  image_alt: string | null;
  /** Supabase status value — used to skip duplicate Facebook posts on republish. */
  status?: string | null;
}

export interface PublishResult {
  mode: 'github' | 'wordpress' | 'hosted';
  url: string;
  githubPath?: string;
}

async function repoIsNextJs(owner: string, repo: string, githubToken: string): Promise<boolean> {
  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/`, {
      headers: { Authorization: `token ${githubToken}`, Accept: 'application/vnd.github+json' },
    });
    if (!res.ok) return false;
    const entries: Array<{ name: string; type: string }> = await res.json();
    return entries.some(e => /^next\.config\.(js|mjs|ts)$/.test(e.name));
  } catch (err) {
    console.error('repoIsNextJs detection failed, defaulting to static-HTML layout:', err);
    return false;
  }
}

function buildHtmlPage(title: string, metaDescription: string, contentHtml: string, domain: string, origin: string, canonical: string, publishPath: string, imageUrl?: string | null): string {
  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(metaDescription)}">
<meta name="robots" content="index, follow">
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="article">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(metaDescription)}">
<meta property="og:url" content="${canonical}">
<meta property="og:site_name" content="${escapeHtml(domain)}">
${imageUrl ? `<meta property="og:image" content="${imageUrl}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${imageUrl}">` : ''}
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; max-width: 720px; margin: 0 auto; padding: 40px 20px; line-height: 1.7; color: #1a1a1a; }
  h1 { font-size: 2rem; margin-bottom: 0.5rem; }
  h2 { font-size: 1.4rem; margin-top: 2rem; }
  h3 { font-size: 1.15rem; margin-top: 1.5rem; }
  p { margin: 1rem 0; }
  a.back { display: inline-block; margin-bottom: 24px; color: #666; text-decoration: none; font-size: 0.9rem; }
</style>
</head>
<body>
<a class="back" href="${origin}/">&larr; Zurück zu ${escapeHtml(domain)}</a>
${contentHtml}
<p style="margin-top:3rem;padding-top:1.5rem;border-top:1px solid #eee"><a href="${origin}/${publishPath}/">Weitere Artikel &rarr;</a></p>
</body>
</html>
`;
}

/** Polls a freshly-published article URL until it returns HTTP 200, so Facebook's
 *  link scraper doesn't hit the page mid-deploy and cache it as a 404 with no image.
 *  Used only for the GitHub publish path, where the page goes live seconds to ~2
 *  minutes after the commit (Vercel build time). WordPress/hosted paths are live
 *  immediately and don't need this.
 */
async function waitForArticleLive(url: string, timeoutMs = 90_000, intervalMs = 3_000): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url, { method: 'GET', cache: 'no-store' });
      if (res.ok) return true;
    } catch {
      // network hiccup during deploy — keep polling until the deadline
    }
    await new Promise(r => setTimeout(r, intervalMs));
  }
  console.error(`waitForArticleLive: timed out waiting for ${url} to return 200 after ${timeoutMs}ms.`);
  return false;
}

/** Fire-and-forget: post to Facebook if the website has credentials configured.
 *  Only fires on the FIRST publish (article.status !== 'published') to prevent
 *  duplicate posts when an article is re-published after a partial failure.
 */
async function maybeFacebookPost(website: WebsiteRow, article: ArticleRow, url: string): Promise<void> {
  if (!website.facebook_page_id || !website.facebook_page_token) return;
  if (article.status === 'published') {
    console.log(`Facebook post skipped for ${website.domain} — article already published.`);
    return;
  }
  const result = await postToFacebook({
    pageId: website.facebook_page_id,
    pageToken: website.facebook_page_token,
    articleTitle: article.title,
    articleUrl: url,
    teaser: article.meta_description,
  });
  if (!result.success) {
    console.error(`Facebook post failed for ${website.domain}:`, result.error);
  } else {
    console.log(`Facebook post created for ${website.domain}: ${result.postId}`);
  }
}

export async function publishArticle(website: WebsiteRow, article: ArticleRow): Promise<PublishResult> {
  // Path A: network sites with a linked GitHub repo — commit directly.
  if (website.github_repo) {
    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) throw new Error('Serverkonfiguration unvollständig (GITHUB_TOKEN fehlt).');

    const [owner, repo] = website.github_repo.split('/');
    const cleanPublishPath = (website.publish_path || '/blog/').replace(/^\/|\/$/g, '');

    // Next.js projects only serve files that live under public/ (or go through the
    // Next build) — a root-level path like `news/slug/index.html` is silently dropped
    // and 404s. Plain static-HTML network sites serve any root-level file directly.
    // Detect which kind of repo this is before deciding where to commit.
    const isNextJs = await repoIsNextJs(owner, repo, githubToken);
    const publishPrefix = isNextJs ? `public/${cleanPublishPath}` : cleanPublishPath;
    const path = `${publishPrefix}/${article.slug}/index.html`;
    const origin = await resolveOrigin(website.domain);
    const articleUrl = `${origin}/${cleanPublishPath}/${article.slug}/`;
    const html = buildHtmlPage(article.title, article.meta_description || '', article.content_html, website.domain, origin, articleUrl, cleanPublishPath, article.image_url);
    const contentBase64 = Buffer.from(html, 'utf-8').toString('base64');

    // GitHub rejects a PUT to an already-existing path with 422 "sha wasn't supplied"
    // unless the current sha is included. This happens whenever the same article gets
    // republished (e.g. a prior run wrote the file but failed to mark it published in
    // Supabase, so the next cron run retries the same slug). See publishNewsIndex.ts,
    // which already does this correctly. Recurring failure for ug-miete.de since 2026-09-04.
    let sha: string | undefined;
    const existingRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
      headers: { Authorization: `token ${githubToken}`, Accept: 'application/vnd.github+json' },
    });
    if (existingRes.ok) {
      const existing = await existingRes.json();
      sha = existing.sha;
    }

    const ghRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
      method: 'PUT',
      headers: {
        Authorization: `token ${githubToken}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `suchmaschinen.pro: publish article "${article.title}"`,
        content: contentBase64,
        ...(sha ? { sha } : {}),
      }),
    });

    if (!ghRes.ok) {
      const errText = await ghRes.text();
      console.error('GitHub publish error:', errText);
      throw new Error(`GitHub-Veröffentlichung fehlgeschlagen (${ghRes.status}).`);
    }

    // Facebook's link scraper fetches the URL as soon as we call the Graph API. On the
    // GitHub path the commit lands seconds to ~2 minutes before Vercel's deploy makes the
    // page actually live, so posting right after the commit makes Facebook scrape a 404
    // and cache a headline-only post with no image. Wait for the page to go live first.
    await waitForArticleLive(articleUrl);
    await maybeFacebookPost(website, article, articleUrl);
    return { mode: 'github', url: articleUrl, githubPath: path };
  }

  // Path B: WordPress via Application Password.
  if (website.hosting_platform === 'wordpress' && website.wp_url && website.wp_username && website.wp_app_password) {
    const wpAuth = Buffer.from(`${website.wp_username}:${website.wp_app_password}`).toString('base64');
    let wpContent = article.content_html.replace(/^\s*<h1[^>]*>.*?<\/h1>\s*/i, '');
    wpContent = wpContent.replace(/^\s*<figure[^>]*>[\s\S]*?<\/figure>\s*/i, '');

    let featuredMediaId: number | undefined;
    if (article.image_url) {
      try {
        const imgRes = await fetch(article.image_url);
        if (imgRes.ok) {
          const imgBuffer = Buffer.from(await imgRes.arrayBuffer());
          const mediaRes = await fetch(`${website.wp_url}/wp-json/wp/v2/media`, {
            method: 'POST',
            headers: {
              Authorization: `Basic ${wpAuth}`,
              'Content-Type': 'image/jpeg',
              'Content-Disposition': `attachment; filename="${article.slug}.jpg"`,
            },
            body: imgBuffer,
          });
          if (mediaRes.ok) {
            const mediaData = await mediaRes.json();
            featuredMediaId = mediaData.id;
            if (article.image_alt) {
              await fetch(`${website.wp_url}/wp-json/wp/v2/media/${featuredMediaId}`, {
                method: 'POST',
                headers: { Authorization: `Basic ${wpAuth}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ alt_text: article.image_alt }),
              }).catch(() => {});
            }
          } else {
            console.error('WP media upload failed:', await mediaRes.text());
          }
        }
      } catch (imgErr) {
        console.error('WP featured image upload error:', imgErr);
      }
    }

    const wpRes = await fetch(`${website.wp_url}/wp-json/wp/v2/posts`, {
      method: 'POST',
      headers: { Authorization: `Basic ${wpAuth}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: article.title,
        content: wpContent,
        excerpt: article.meta_description || '',
        status: 'publish',
        ...(featuredMediaId ? { featured_media: featuredMediaId } : {}),
      }),
    });

    if (!wpRes.ok) {
      const errText = await wpRes.text();
      console.error('WordPress publish error:', errText);
      throw new Error(`WordPress-Veröffentlichung fehlgeschlagen (${wpRes.status}).`);
    }

    const wpData = await wpRes.json();
    await maybeFacebookPost(website, article, wpData.link);
    return { mode: 'wordpress', url: wpData.link };
  }

  // Path C: no repo/WP credentials — host ourselves at /b/[slug]/[articleSlug].
  const hostedUrl = `https://suchmaschinen.pro/b/${website.public_slug}/${article.slug}`;
  await maybeFacebookPost(website, article, hostedUrl);
  return { mode: 'hosted', url: hostedUrl };
}
