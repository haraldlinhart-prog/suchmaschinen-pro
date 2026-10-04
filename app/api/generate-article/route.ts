import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateArticleContent } from '@/lib/ai/generateArticle';
import { featuresFor } from '@/lib/content/planFeatures';
import { linkTargets } from '@/lib/content/premiumJobs';
import { relatedArticles } from '@/lib/content/internalLinks';
import { networkUsage, titlesNear } from '@/lib/content/networkUsage';

// This route calls the Claude API, looks up a Pixabay image, and (since the
// video.pan21.com image mirror now downloads the Pixabay bytes itself and
// re-uploads them, rather than asking that server to fetch the URL) can take
// noticeably longer than Vercel's default function timeout. Without an
// explicit maxDuration, a timeout here silently kills the whole request with
// no error logged anywhere — the article/Facebook post then simply never
// appears, which looked like a mysterious intermittent failure before this
// was traced back to the missing timeout config.
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });

    const { websiteId, keyword, rationale, intent } = await req.json();
    if (!websiteId || !keyword) return NextResponse.json({ error: 'websiteId und keyword sind erforderlich.' }, { status: 400 });

    const { data: website, error: fetchError } = await supabase
      .from('sq_websites')
      .select('*')
      .eq('id', websiteId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !website) return NextResponse.json({ error: 'Website nicht gefunden.' }, { status: 404 });

    // Free tier: at most one manually generated article per website.
    if (website.plan === 'free') {
      const { count } = await supabase
        .from('sq_articles')
        .select('id', { count: 'exact', head: true })
        .eq('website_id', websiteId);
      if ((count || 0) >= 1) {
        return NextResponse.json(
          { error: 'Im Free-Tarif ist nur ein Artikel möglich. Für weitere Artikel auf Basic oder Pro upgraden.' },
          { status: 403 }
        );
      }
    }

    let generated;
    try {
      const related = featuresFor(website.plan).internalLinks
        ? relatedArticles(keyword, keyword, await linkTargets(website, supabase, undefined, website.article_language ?? 'de'), 3).map(t => ({ title: t.title, url: t.url }))
        : [];
      const network = await networkUsage(supabase, user.id, website.id);
      generated = await generateArticleContent(website.domain, website.notes, keyword, rationale, intent, related, website.article_language ?? 'de', titlesNear(keyword, network.titles));
    } catch (e) {
      console.error('generateArticleContent error:', e);
      return NextResponse.json({ error: 'Artikel-Generierung fehlgeschlagen.' }, { status: 500 });
    }

    const { data: inserted, error: insertError } = await supabase
      .from('sq_articles')
      .insert({
        website_id: websiteId,
        user_id: user.id,
        keyword,
        title: generated.title,
        slug: generated.slug,
        meta_description: generated.meta_description,
        content_html: generated.content_html,
        image_url: generated.image_url,
        image_alt: generated.image_alt,
        language: website.article_language ?? 'de',
        status: 'draft',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert article error:', insertError);
      return NextResponse.json({ error: 'Fehler beim Speichern des Artikels.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, article: inserted });
  } catch (err) {
    console.error('Generate-article route error:', err);
    return NextResponse.json({ error: 'Ein unerwarteter Fehler ist aufgetreten.' }, { status: 500 });
  }
}
