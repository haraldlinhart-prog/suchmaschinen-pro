import { escapeHtml } from '@/lib/ai/generateArticle';

interface WebsiteRow {
  domain: string;
  github_repo: string | null;
  publish_path: string;
  public_slug: string;
  hosting_platform: string;
  wp_url: string | null;
  wp_username: string | null;
  wp_app_password: string | null;
}

interface ArticleRow {
  id: string;
  slug: string;
  title: string;
  meta_description: string | null;
  content_html: string;
  image_url: string | null;
  image_alt: string | null;
}

export interface PublishResult {
  mode: 'github' | 'wordpress' | 'hosted';
  url: string;
  githubPath?: string;
}

function buildHtmlPage(title: string, metaDescription: string, contentHtml: string, domain: string): string {
  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(metaDescription)}">
<meta name="robots" content="index, follow">
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
<a class="back" href="https://${domain}/">&larr; Zurück zu ${escapeHtml(domain)}</a>
${contentHtml}
</body>
</html>
`;
}

export async function publishArticle(website: WebsiteRow, article: ArticleRow): Promise<PublishResult> {
  // Path A: network sites with a linked GitHub repo — commit directly.
  if (website.github_repo) {
    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) throw new Error('Serverkonfiguration unvollständig (GITHUB_TOKEN fehlt).');

    const [owner, repo] = website.github_repo.split('/');
    const cleanPublishPath = (website.publish_path || '/blog/').replace(/^\/|\/$/g, '');
    const path = `${cleanPublishPath}/${article.slug}/index.html`;
    const html = buildHtmlPage(article.title, article.meta_description || '', article.content_html, website.domain);
    const contentBase64 = Buffer.from(html, 'utf-8').toString('base64');

    const ghRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
      method: 'PUT',
      headers: {
        Authorization: `token ${githubToken}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: `suchmaschinen.pro: publish article "${article.title}"`, content: contentBase64 }),
    });

    if (!ghRes.ok) {
      const errText = await ghRes.text();
      console.error('GitHub publish error:', errText);
      throw new Error(`GitHub-Veröffentlichung fehlgeschlagen (${ghRes.status}).`);
    }

    return { mode: 'github', url: `https://${website.domain}/${cleanPublishPath}/${article.slug}/`, githubPath: path };
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
    return { mode: 'wordpress', url: wpData.link };
  }

  // Path C: no repo/WP credentials — host ourselves at /b/[slug]/[articleSlug].
  return { mode: 'hosted', url: `https://suchmaschinen.pro/b/${website.public_slug}/${article.slug}` };
}
