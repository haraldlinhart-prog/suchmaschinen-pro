import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { publishArticleAndTranslation } from '@/lib/publish/publishBilingual';
import { publishNewsIndex } from '@/lib/publish/publishNewsIndex';
import { ensureDiscoverability } from '@/lib/publish/ensureDiscoverability';
import { featuresFor } from '@/lib/content/planFeatures';
import { backlinkOlderArticles } from '@/lib/content/premiumJobs';

// GitHub-path publishes wait (up to 90s) for the deploy to go live before posting to
// Facebook. Bilingual sites now reliably await the full primary + secondary-language
// publish sequence in this same request (see publishBilingual.ts) — each half can hit
// that 90s wait on its own, so 120s was too tight once the secondary publish was no
// longer a detached, unreliable background promise.
export const maxDuration = 240;

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });

    const { articleId } = await req.json();
    if (!articleId) return NextResponse.json({ error: 'articleId ist erforderlich.' }, { status: 400 });

    const { data: article, error: articleError } = await supabase
      .from('sq_articles')
      .select('*, sq_websites!inner(id, user_id, domain, notes, github_repo, publish_path, public_slug, hosting_platform, wp_url, wp_username, wp_app_password, facebook_page_id, facebook_page_token, facebook_post_language, article_language, secondary_language, secondary_publish_path, plan, status)')
      .eq('id', articleId)
      .eq('user_id', user.id)
      .single();

    if (articleError || !article) return NextResponse.json({ error: 'Artikel nicht gefunden.' }, { status: 404 });

    const website = Array.isArray(article.sq_websites) ? article.sq_websites[0] : article.sq_websites;

    let result;
    try {
      result = await publishArticleAndTranslation(website, article, supabase);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Veröffentlichung fehlgeschlagen.';
      return NextResponse.json({ error: message }, { status: 500 });
    }

    const { error: updateError } = await supabase
      .from('sq_articles')
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
        published_url: result.url,
        ...(result.githubPath ? { github_path: result.githubPath } : {}),
      })
      .eq('id', articleId);

    if (updateError) return NextResponse.json({ error: 'Veröffentlicht, aber Status konnte nicht aktualisiert werden.' }, { status: 500 });

    await publishNewsIndex(website, supabase, { language: website.article_language ?? 'de', includeLegacyNullLanguage: true }).catch(e => console.error('publishNewsIndex failed', e));
    await ensureDiscoverability(website, supabase).catch(e => console.error('ensureDiscoverability failed', e));
    if (featuresFor(website.plan).backlinkOlder) {
      await backlinkOlderArticles(website, { id: articleId, title: article.title, keyword: article.keyword, url: result.url }, supabase)
        .catch(e => console.error('backlinkOlderArticles failed', e));
    }

    return NextResponse.json({ success: true, mode: result.mode, url: result.url });
  } catch (err) {
    console.error('Publish-article route error:', err);
    return NextResponse.json({ error: 'Ein unerwarteter Fehler ist aufgetreten.' }, { status: 500 });
  }
}
