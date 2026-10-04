import { escapeHtml } from '@/lib/ai/generateArticle';
import { resolveOrigin } from '@/lib/publish/origin';
import { postToFacebook } from '@/lib/publish/postToFacebook';
import { postToInstagram } from '@/lib/publish/postToInstagram';
import { commitFiles } from '@/lib/publish/githubCommit';
import { buildNewsIndexFile } from '@/lib/publish/publishNewsIndex';
import { buildSitemapFile } from '@/lib/publish/ensureDiscoverability';
import { buildArticleJsonLd } from '@/lib/publish/jsonLd';

interface WebsiteRow {
  id?: string;
  domain: string;
  secondary_language?: string | null;
  secondary_publish_path?: string | null;
  github_repo: string | null;
  publish_path: string;
  public_slug: string;
  hosting_platform: string;
  wp_url: string | null;
  wp_username: string | null;
  wp_app_password: string | null;
  facebook_page_id: string | null;
  facebook_page_token: string | null;
  /** Null/undefined = post every published article to Facebook (legacy behavior).
   *  Set (e.g. 'en') on bilingual sites whose Facebook ad audience only speaks one
   *  language — then only articles published in that language get posted. */
  facebook_post_language?: string | null;
  /** Instagram account linked to facebook_page_id (posted with the same page token).
   *  Null/undefined = no Instagram posting. Follows the same language gate as Facebook. */
  instagram_account_id?: string | null;
}

export interface PublishOptions {
  /** Overrides <html lang="..."> in the generated page. Defaults to 'de'. */
  language?: string;
  /** Overrides website.publish_path for this call — used to publish a secondary-
   *  language translation under its own path (e.g. /en/blog/) instead of the
   *  site's primary publish_path. */
  publishPath?: string;
  /** When given (with website.id), the news index and the article sitemap are written
   *  in the same commit as the article. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase?: any;
}

interface ArticleRow {
  id: string;
  slug: string;
  title: string;
  meta_description: string | null;
  content_html: string;
  image_url: string | null;
  image_alt: string | null;
  /** Used for the Instagram hashtags. */
  keyword?: string | null;
  /** Set on republish (premium refresh/backlinks) — keeps the index/sitemap order. */
  published_at?: string | null;
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

function buildHtmlPage(title: string, metaDescription: string, contentHtml: string, domain: string, origin: string, canonical: string, publishPath: string, imageUrl?: string | null, lang: string = 'de', jsonLd: string = ''): string {
  return `<!DOCTYPE html>
<html lang="${lang}">
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
${jsonLd}
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
<a class="back" href="${origin}/">&larr; ${lang === 'en' ? `Back to ${escapeHtml(domain)}` : `Zurück zu ${escapeHtml(domain)}`}</a>
${contentHtml}
<p style="margin-top:3rem;padding-top:1.5rem;border-top:1px solid #eee"><a href="${origin}/${publishPath}/">${lang === 'en' ? 'More articles' : 'Weitere Artikel'} &rarr;</a></p>
</body>
</html>
`;
}

/** HEAD-checks whether an image URL is actually reachable (not just that a prior
 *  upload call reported success). Falls back to a ranged GET for servers that don't
 *  implement HEAD correctly. Used before publishing a URL as og:image/twitter:image,
 *  since the video.pan21.com mirror upload has been seen to report success while the
 *  mirrored file 404s, and Pixabay's own CDN links eventually expire too.
 */
async function verifyImageReachable(url: string, timeoutMs = 8_000): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const headRes = await fetch(url, { method: 'HEAD', signal: controller.signal });
    if (headRes.ok) return true;
    // Some servers (including video.pan21.com) don't implement HEAD properly —
    // fall back to a ranged GET that only pulls the first byte.
    const getRes = await fetch(url, {
      method: 'GET',
      headers: { Range: 'bytes=0-0' },
      signal: controller.signal,
    });
    return getRes.ok;
  } catch (err) {
    console.error(`verifyImageReachable: ${url} unreachable:`, err);
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/** Picks the image URL to publish as og:image/twitter:image, verifying reachability
 *  first so a dead mirror link never gets published. Only ever returns the mirrored
 *  article.image_url (on video.pan21.com) or null.
 *
 *  IMPORTANT: this must never fall back to the raw inline Pixabay <img> URL from the
 *  article body (an off-domain pixabay.com/fbcdn.net URL). That used to be the
 *  fallback here, which meant that whenever the video.pan21.com mirror was down,
 *  Facebook's link-preview scraper would pick up the off-domain Pixabay og:image —
 *  so clicking the preview image on Facebook opened Pixabay/fbcdn instead of staying
 *  on the article page. The article's own <img> tag can still show the raw Pixabay
 *  URL inline on the page itself (that's a separate, acceptable use) — it just must
 *  never become og:image. If the mirror isn't reachable, we omit og:image entirely
 *  rather than risk any off-domain URL going out as the preview image.
 */
async function resolveOgImageUrl(article: ArticleRow): Promise<string | null> {
  if (article.image_url && (await verifyImageReachable(article.image_url))) {
    return article.image_url;
  }
  console.error(`resolveOgImageUrl: no reachable mirrored image for article "${article.title}" — omitting og:image (never falling back to the off-domain source image).`);
  return null;
}

/** Strips HTML tags from a fragment and collapses whitespace, for building a
 *  plain-text excerpt from article.content_html. */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/** Builds a Facebook-post teaser excerpt from the article body when no curated
 *  meta_description is available, so the post never ends up title-only. Strips
 *  HTML, takes ~200-280 chars, and breaks on a word boundary with a trailing "…". */
function buildExcerptFromHtml(html: string, maxLen = 280): string {
  const text = stripHtml(html);
  if (text.length <= maxLen) return text;
  const slice = text.slice(0, maxLen);
  const lastSpace = slice.lastIndexOf(' ');
  const truncated = lastSpace > 0 ? slice.slice(0, lastSpace) : slice;
  return `${truncated.trim()}…`;
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

/** Fire-and-forget: post to Facebook (and Instagram, if linked) when the website has
 *  credentials configured. Only fires on the FIRST publish (article.status !== 'published')
 *  to prevent duplicate posts when an article is re-published after a partial failure.
 *  imageUrl: the verified og:image if the caller already resolved it (otherwise it is
 *  resolved here, and only when Instagram needs it).
 */
async function maybeFacebookPost(website: WebsiteRow, article: ArticleRow, url: string, language?: string, imageUrl?: string | null): Promise<void> {
  if (!website.facebook_page_id || !website.facebook_page_token) return;
  if (article.status === 'published') {
    console.log(`Facebook post skipped for ${website.domain} — article already published.`);
    return;
  }
  // Bilingual sites can restrict Facebook posting to a single language (the one the
  // Facebook ad audience actually speaks). Null/undefined keeps legacy behavior —
  // post every first-publish regardless of language.
  if (website.facebook_post_language && language && website.facebook_post_language !== language) {
    console.log(`Facebook post skipped for ${website.domain} — article language "${language}" does not match facebook_post_language "${website.facebook_post_language}".`);
    return;
  }
  // meta_description is intentionally curated SEO text — prefer it. Otherwise fall
  // back to a real excerpt of the article body, never just the bare title.
  const teaser = (article.meta_description && article.meta_description.trim())
    ? article.meta_description
    : buildExcerptFromHtml(article.content_html);
  // No `picture` field: Facebook's Graph API rejects the ENTIRE /feed post with
  // error #100 ("Only owners of the URL have the ability to specify the picture,
  // name, thumbnail or description params") unless the domain is verified as an
  // Owned Domain in Facebook Business settings — confirmed live on himassage.net.
  // The preview image comes purely from Facebook's own scraper reading the
  // article page's og:image meta tag (see resolveOgImageUrl / buildHtmlPage).
  const result = await postToFacebook({
    pageId: website.facebook_page_id,
    pageToken: website.facebook_page_token,
    articleTitle: article.title,
    articleUrl: url,
    teaser,
  });
  if (!result.success) {
    console.error(`Facebook post failed for ${website.domain}:`, result.error);
  } else {
    console.log(`Facebook post created for ${website.domain}: ${result.postId}`);
  }

  // Instagram (04.10.2026): image post with the same page token. Instagram has no
  // text-only posts, so without a reachable mirrored image it is skipped.
  if (website.instagram_account_id) {
    const igImage = imageUrl !== undefined ? imageUrl : await resolveOgImageUrl(article);
    if (!igImage) {
      console.warn(`Instagram post skipped for ${website.domain} — no reachable article image.`);
      return;
    }
    const ig = await postToInstagram({
      igUserId: website.instagram_account_id,
      pageToken: website.facebook_page_token,
      imageUrl: igImage,
      articleTitle: article.title,
      articleUrl: url,
      teaser,
      keyword: article.keyword,
      domain: website.domain,
      language,
    });
    if (!ig.success) {
      console.error(`Instagram post failed for ${website.domain}:`, ig.error);
    } else {
      console.log(`Instagram post created for ${website.domain}: ${ig.mediaId}`);
    }
  }
}

export async function publishArticle(website: WebsiteRow, article: ArticleRow, options?: PublishOptions): Promise<PublishResult> {
  const language = options?.language || 'de';

  // Path A: network sites with a linked GitHub repo — commit directly.
  if (website.github_repo) {
    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) throw new Error('Serverkonfiguration unvollständig (GITHUB_TOKEN fehlt).');

    const [owner, repo] = website.github_repo.split('/');
    const cleanPublishPath = (options?.publishPath || website.publish_path || '/blog/').replace(/^\/|\/$/g, '');

    // Next.js projects only serve files that live under public/ (or go through the
    // Next build) — a root-level path like `news/slug/index.html` is silently dropped
    // and 404s. Plain static-HTML network sites serve any root-level file directly.
    // Detect which kind of repo this is before deciding where to commit.
    const isNextJs = await repoIsNextJs(owner, repo, githubToken);
    const publishPrefix = isNextJs ? `public/${cleanPublishPath}` : cleanPublishPath;
    const path = `${publishPrefix}/${article.slug}/index.html`;
    const origin = await resolveOrigin(website.domain);
    const articleUrl = `${origin}/${cleanPublishPath}/${article.slug}/`;
    const ogImageUrl = await resolveOgImageUrl(article);
    // JSON-LD (04.10.2026): BlogPosting + BreadcrumbList. A republish (refresh/backlink)
    // keeps the original published_at and moves dateModified to now.
    const now = new Date().toISOString();
    const jsonLd = buildArticleJsonLd({
      title: article.title,
      metaDescription: article.meta_description || '',
      lang: language,
      canonical: articleUrl,
      origin,
      siteName: website.domain,
      indexUrl: `${origin}/${cleanPublishPath}/`,
      datePublished: article.published_at || now,
      dateModified: now,
      imageUrl: ogImageUrl,
    });
    const html = buildHtmlPage(article.title, article.meta_description || '', article.content_html, website.domain, origin, articleUrl, cleanPublishPath, ogImageUrl, language, jsonLd);

    // Article, news index and article sitemap go into ONE commit (04.10.2026) — before,
    // these were three commits, i.e. three Vercel builds and three GitHub mails per
    // article. Index and sitemap are only included when the caller passes `supabase`
    // (and website.id); the later publishNewsIndex/ensureDiscoverability calls then find
    // them up to date and commit nothing.
    const files = [{ path, content: html }];
    if (options?.supabase && website.id) {
      const site = { ...website, id: website.id };
      const ctx = { isNextJs, origin };
      const publishedAt = article.published_at || new Date().toISOString();
      const indexOptions = options.publishPath
        ? { language, publishPath: options.publishPath }
        : { language, includeLegacyNullLanguage: true };
      try {
        const [indexFile, sitemapFile] = await Promise.all([
          buildNewsIndexFile(site, options.supabase, indexOptions, ctx, {
            title: article.title, slug: article.slug, meta_description: article.meta_description, published_at: publishedAt, language,
          }),
          buildSitemapFile(site, options.supabase, ctx, { slug: article.slug, published_at: publishedAt, language }),
        ]);
        if (indexFile) files.push(indexFile);
        if (sitemapFile) files.push(sitemapFile);
      } catch (err) {
        // Index/sitemap are best-effort here; the follow-up calls still write them.
        console.error(`publishArticle: building index/sitemap failed for ${website.domain}`, err);
      }
    }

    try {
      await commitFiles(owner, repo, githubToken, files, `suchmaschinen.pro: publish article "${article.title}"`);
    } catch (err) {
      console.error('GitHub publish error:', err);
      throw new Error(`GitHub-Veröffentlichung fehlgeschlagen (${err instanceof Error ? err.message : String(err)}).`);
    }

    // Facebook's link scraper fetches the URL as soon as we call the Graph API. On the
    // GitHub path the commit lands seconds to ~2 minutes before Vercel's deploy makes the
    // page actually live, so posting right after the commit makes Facebook scrape a 404
    // and cache a headline-only post with no image. Wait for the page to go live first.
    await waitForArticleLive(articleUrl);
    await maybeFacebookPost(website, article, articleUrl, language, ogImageUrl);
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
    await maybeFacebookPost(website, article, wpData.link, language);
    return { mode: 'wordpress', url: wpData.link };
  }

  // Path C: no repo/WP credentials — host ourselves at /b/[slug]/[articleSlug].
  const hostedUrl = `https://suchmaschinen.pro/b/${website.public_slug}/${article.slug}`;
  await maybeFacebookPost(website, article, hostedUrl, language);
  return { mode: 'hosted', url: hostedUrl };
}
