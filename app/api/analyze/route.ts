import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { fetchSiteText, suggestKeywords } from '@/lib/ai/analyzeWebsite';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });

    const { websiteId } = await req.json();
    if (!websiteId) return NextResponse.json({ error: 'websiteId fehlt.' }, { status: 400 });

    const { data: website, error: fetchError } = await supabase
      .from('sq_websites')
      .select('*')
      .eq('id', websiteId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !website) return NextResponse.json({ error: 'Website nicht gefunden.' }, { status: 404 });

    let pageText = '';
    let pageTitle = '';
    try {
      const site = await fetchSiteText(website.domain);
      pageText = site.pageText;
      pageTitle = site.pageTitle;
    } catch {
      return NextResponse.json({ error: 'Website konnte nicht erreicht werden. Bitte Domain prüfen.' }, { status: 400 });
    }

    if (!pageText || pageText.length < 50) {
      return NextResponse.json({ error: 'Auf der Website wurde kein auswertbarer Inhalt gefunden (evtl. JavaScript-only Seite).' }, { status: 400 });
    }

    let keywords;
    try {
      keywords = await suggestKeywords(website.domain, pageTitle, pageText);
    } catch (e) {
      console.error('suggestKeywords error:', e);
      return NextResponse.json({ error: 'KI-Analyse fehlgeschlagen.' }, { status: 500 });
    }

    const { error: updateError } = await supabase
      .from('sq_websites')
      .update({ suggested_keywords: keywords, last_analyzed_at: new Date().toISOString(), status: 'active' })
      .eq('id', websiteId);

    if (updateError) return NextResponse.json({ error: 'Fehler beim Speichern der Analyse.' }, { status: 500 });

    return NextResponse.json({ success: true, keywords });
  } catch (err) {
    console.error('Analyze route error:', err);
    return NextResponse.json({ error: 'Ein unerwarteter Fehler ist aufgetreten.' }, { status: 500 });
  }
}
