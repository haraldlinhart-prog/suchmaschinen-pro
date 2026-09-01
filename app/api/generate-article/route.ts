import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateArticleContent } from '@/lib/ai/generateArticle';

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

    let generated;
    try {
      generated = await generateArticleContent(website.domain, website.notes, keyword, rationale, intent);
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
