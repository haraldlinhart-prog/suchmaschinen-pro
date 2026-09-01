import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

function escapeHtml(str: string): string {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });

    const { articleId } = await req.json();
    if (!articleId) {
      return NextResponse.json({ error: 'articleId ist erforderlich.' }, { status: 400 });
    }

    const { data: article, error: articleError } = await supabase
      .from('sq_articles')
      .select('*, sq_websites!inner(*)')
      .eq('id', articleId)
      .eq('user_id', user.id)
      .single();

    if (articleError || !article) return NextResponse.json({ error: 'Artikel nicht gefunden.' }, { status: 404 });

    const website = Array.isArray(article.sq_websites) ? article.sq_websites[0] : article.sq_websites;

    // Path A: website has a linked GitHub repo (network sites) — commit directly, "zuhause bei Mutti".
    if (website?.github_repo) {
      const githubToken = process.env.GITHUB_TOKEN;
      if (!githubToken) {
        return NextResponse.json({ error: 'Serverkonfiguration unvollständig (GITHUB_TOKEN fehlt).' }, { status: 500 });
      }

      const [owner, repo] = website.github_repo.split('/');
      const cleanPublishPath = (website.publish_path || '/blog/').replace(/^\/|\/$/g, '');
      const path = `${cleanPublishPath}/${article.slug}/index.html`;
      const html = buildHtmlPage(article.title, article.meta_description || '', article.content_html, website.domain);
      const contentBase64 = Buffer.from(html, 'utf-8').toString('base64');

      const ghUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
      const ghRes = await fetch(ghUrl, {
        method: 'PUT',
        headers: {
          Authorization: `token ${githubToken}`,
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `suchmaschinen.pro: publish article "${article.title}"`,
          content: contentBase64,
        }),
      });

      if (!ghRes.ok) {
        const errText = await ghRes.text();
        console.error('GitHub publish error:', errText);
        return NextResponse.json({ error: `GitHub-Veröffentlichung fehlgeschlagen (${ghRes.status}). Bitte Token und Repo-Zugriff prüfen.` }, { status: 500 });
      }

      const { error: updateError } = await supabase
        .from('sq_articles')
        .update({ status: 'published', github_path: path, published_at: new Date().toISOString() })
        .eq('id', articleId);

      if (updateError) return NextResponse.json({ error: 'Veröffentlicht, aber Status konnte nicht aktualisiert werden.' }, { status: 500 });

      return NextResponse.json({ success: true, mode: 'github', path, url: `https://${website.domain}/${cleanPublishPath}/${article.slug}/` });
    }

    // Path B: no repo linked — host the article ourselves; it's already servable at /b/[slug]/[articleSlug].
    // The customer routes their own publish_path to us via a one-time rewrite rule (see dashboard instructions).
    const { error: updateError } = await supabase
      .from('sq_articles')
      .update({ status: 'published', published_at: new Date().toISOString() })
      .eq('id', articleId);

    if (updateError) return NextResponse.json({ error: 'Fehler beim Veröffentlichen.' }, { status: 500 });

    return NextResponse.json({
      success: true,
      mode: 'hosted',
      url: `https://suchmaschinen.pro/b/${website.public_slug}/${article.slug}`,
    });
  } catch (err) {
    console.error('Publish-article route error:', err);
    return NextResponse.json({ error: 'Ein unerwarteter Fehler ist aufgetreten.' }, { status: 500 });
  }
}
