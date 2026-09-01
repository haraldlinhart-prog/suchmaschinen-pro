import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const PIXABAY_API_KEY = process.env.PIXABAY_API_KEY;

function escapeHtml(str: string): string {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 70);
}

async function findPixabayImage(query: string): Promise<{ url: string; alt: string } | null> {
  if (!PIXABAY_API_KEY) return null;
  try {
    const res = await fetch(
      `https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(query)}&image_type=photo&orientation=horizontal&safesearch=true&per_page=6`,
      { signal: AbortSignal.timeout(10000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const hit = data.hits?.[0];
    if (!hit) return null;
    return { url: hit.webformatURL as string, alt: (hit.tags as string).split(',')[0].trim() };
  } catch {
    return null;
  }
}

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

    if (!ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'Serverkonfiguration unvollständig (ANTHROPIC_API_KEY fehlt).' }, { status: 500 });
    }

    const prompt = `You are an expert German-language SEO content writer. Write a high-quality, genuinely useful blog article targeting the keyword "${keyword}" for the website ${website.domain}${website.notes ? ` (context: ${website.notes})` : ''}.
${rationale ? `Why this keyword matters for this site: ${rationale}` : ''}
${intent ? `Search intent: ${intent}` : ''}

Requirements:
- Write in German
- 700-1000 words, genuinely informative (not generic filler)
- Use a clear H1 title, then structured with H2/H3 subheadings
- Natural, non-spammy use of the keyword and closely related terms
- Include a short concluding paragraph
- Output as clean semantic HTML body content only (h1, h2, h3, p, ul/li as needed) — no <html>, <head>, or <body> tags, no inline styles, no markdown

Respond ONLY with a JSON object, no other text, in this exact shape:
{"title": "the H1 text as plain string", "meta_description": "a compelling 140-160 char meta description", "content_html": "the full HTML body content as a single string", "image_query": "2-4 English keywords describing a fitting stock photo for this article, e.g. \"business handshake office\""}`;

    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!claudeRes.ok) {
      const errText = await claudeRes.text();
      console.error('Claude API error:', errText);
      return NextResponse.json({ error: 'Artikel-Generierung fehlgeschlagen.' }, { status: 500 });
    }

    const claudeData = await claudeRes.json();
    const textBlock = claudeData.content?.find((c: { type: string }) => c.type === 'text');
    let article;
    try {
      const raw = textBlock.text.trim().replace(/^```json\s*/i, '').replace(/```$/, '');
      article = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: 'KI-Antwort konnte nicht verarbeitet werden.' }, { status: 500 });
    }

    const slug = slugify(article.title);

    let imageUrl: string | null = null;
    let imageAlt: string | null = null;
    let contentHtml: string = article.content_html;

    const image = article.image_query ? await findPixabayImage(article.image_query) : null;
    if (image) {
      imageUrl = image.url;
      imageAlt = image.alt;
      const figure = `<figure style="margin:0 0 1.5rem;"><img src="${image.url}" alt="${escapeHtml(article.title)}" style="width:100%;height:auto;border-radius:8px;" loading="lazy"><figcaption style="font-size:0.78rem;color:#8a9a94;margin-top:0.4rem;">Bild: Pixabay</figcaption></figure>`;
      // Insert right after the leading <h1>...</h1>
      if (/^\s*<h1[^>]*>.*?<\/h1>/i.test(contentHtml)) {
        contentHtml = contentHtml.replace(/(^\s*<h1[^>]*>.*?<\/h1>)/i, `$1\n${figure}`);
      } else {
        contentHtml = `${figure}\n${contentHtml}`;
      }
    }

    const { data: inserted, error: insertError } = await supabase
      .from('sq_articles')
      .insert({
        website_id: websiteId,
        user_id: user.id,
        keyword,
        title: article.title,
        slug,
        meta_description: article.meta_description,
        content_html: contentHtml,
        image_url: imageUrl,
        image_alt: imageAlt,
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
