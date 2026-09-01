import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

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

    if (!ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'Serverkonfiguration unvollständig (ANTHROPIC_API_KEY fehlt).' }, { status: 500 });
    }

    // Fetch the site's homepage
    let pageText = '';
    let pageTitle = '';
    try {
      const siteRes = await fetch(`https://${website.domain}`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; suchmaschinen.pro-analyzer/1.0)' },
        signal: AbortSignal.timeout(15000),
      });
      const html = await siteRes.text();
      const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
      pageTitle = titleMatch ? titleMatch[1].trim() : '';
      pageText = stripHtml(html).slice(0, 6000);
    } catch {
      return NextResponse.json({ error: 'Website konnte nicht erreicht werden. Bitte Domain prüfen.' }, { status: 400 });
    }

    if (!pageText || pageText.length < 50) {
      return NextResponse.json({ error: 'Auf der Website wurde kein auswertbarer Inhalt gefunden (evtl. JavaScript-only Seite).' }, { status: 400 });
    }

    const prompt = `You are an SEO analyst. Analyze the following website content and identify the 6 most valuable German-language search keywords/phrases this site should target for organic traffic. For each, give a short rationale (why it fits this site) and the likely search intent (informational, commercial, or transactional).

Website: ${website.domain}
Page title: ${pageTitle}
Content excerpt:
${pageText}

Respond ONLY with a JSON array, no other text, in this exact shape:
[{"keyword": "...", "rationale": "...", "intent": "informational|commercial|transactional"}]`;

    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!claudeRes.ok) {
      const errText = await claudeRes.text();
      console.error('Claude API error:', errText);
      return NextResponse.json({ error: 'KI-Analyse fehlgeschlagen.' }, { status: 500 });
    }

    const claudeData = await claudeRes.json();
    const textBlock = claudeData.content?.find((c: { type: string }) => c.type === 'text');
    let keywords;
    try {
      const raw = textBlock.text.trim().replace(/^```json\s*/i, '').replace(/```$/, '');
      keywords = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: 'KI-Antwort konnte nicht verarbeitet werden.' }, { status: 500 });
    }

    const { error: updateError } = await supabase
      .from('sq_websites')
      .update({
        suggested_keywords: keywords,
        last_analyzed_at: new Date().toISOString(),
        status: 'active',
      })
      .eq('id', websiteId);

    if (updateError) return NextResponse.json({ error: 'Fehler beim Speichern der Analyse.' }, { status: 500 });

    return NextResponse.json({ success: true, keywords });
  } catch (err) {
    console.error('Analyze route error:', err);
    return NextResponse.json({ error: 'Ein unerwarteter Fehler ist aufgetreten.' }, { status: 500 });
  }
}
