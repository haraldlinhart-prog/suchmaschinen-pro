const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const PIXABAY_API_KEY = process.env.PIXABAY_API_KEY;

export interface GeneratedArticle {
  title: string;
  slug: string;
  meta_description: string;
  content_html: string;
  image_url: string | null;
  image_alt: string | null;
}

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 70);
}

export function escapeHtml(str: string): string {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
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

export async function generateArticleContent(
  domain: string,
  notes: string | null,
  keyword: string,
  rationale?: string,
  intent?: string,
  relatedLinks?: { title: string; url: string }[]
): Promise<GeneratedArticle> {
  if (!ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY fehlt.');

  const prompt = `You are an expert German-language SEO content writer. Write a high-quality, genuinely useful blog article targeting the keyword "${keyword}" for the website ${domain}${notes ? ` (context: ${notes})` : ''}.
${rationale ? `Why this keyword matters for this site: ${rationale}` : ''}
${intent ? `Search intent: ${intent}` : ''}

Requirements:
- Write in German
- 700-1000 words, genuinely informative (not generic filler)
- Use a clear H1 title, then structured with H2/H3 subheadings
- Natural, non-spammy use of the keyword and closely related terms
- Include a short concluding paragraph
${relatedLinks && relatedLinks.length ? `- Where it genuinely fits the text, link 1–3 times to these related articles on the same site (use exactly these URLs, natural anchor text, no link list):\n${relatedLinks.map(r => `  - ${r.title}: ${r.url}`).join('\n')}\n` : ''}- Output as clean semantic HTML body content only (h1, h2, h3, p, ul/li as needed) — no <html>, <head>, or <body> tags, no inline styles, no markdown

Call the output_article tool with the finished article.`;

  // Use tool-use (structured output) instead of asking the model to hand-write an
  // escaped JSON string: when content_html contains quotes/backslashes (common in
  // <a href="..."> attributes or quoted text), a model-authored JSON string
  // occasionally comes out mis-escaped and JSON.parse throws. The Anthropic API
  // encodes tool_use.input itself, so this failure mode goes away entirely.
  // See recurring "SyntaxError ... in JSON" cron failures from 2026-09-12.
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
      tools: [
        {
          name: 'output_article',
          description: 'Submit the finished article.',
          input_schema: {
            type: 'object',
            properties: {
              title: { type: 'string', description: 'The H1 text as plain string' },
              meta_description: { type: 'string', description: 'A compelling 140-160 char meta description' },
              content_html: { type: 'string', description: 'The full HTML body content as a single string' },
              image_query: {
                type: 'string',
                description: '2-4 English keywords describing a fitting stock photo for this article, e.g. "business handshake office"',
              },
            },
            required: ['title', 'meta_description', 'content_html', 'image_query'],
          },
        },
      ],
      tool_choice: { type: 'tool', name: 'output_article' },
    }),
  });

  if (!claudeRes.ok) {
    const errText = await claudeRes.text();
    console.error('Claude API error (generateArticleContent):', errText);
    throw new Error('Artikel-Generierung fehlgeschlagen.');
  }

  const claudeData = await claudeRes.json();
  const toolBlock = claudeData.content?.find((c: { type: string }) => c.type === 'tool_use');
  if (!toolBlock) {
    console.error('Claude API error (generateArticleContent): no tool_use block in response', JSON.stringify(claudeData));
    throw new Error('Artikel-Generierung fehlgeschlagen.');
  }
  const article = toolBlock.input as { title: string; meta_description: string; content_html: string; image_query?: string };

  const slug = slugify(article.title);
  let imageUrl: string | null = null;
  let imageAlt: string | null = null;
  let contentHtml: string = article.content_html;

  const image = article.image_query ? await findPixabayImage(article.image_query) : null;
  if (image) {
    imageUrl = image.url;
    imageAlt = image.alt;
    const figure = `<figure style="margin:0 0 1.5rem;"><img src="${image.url}" alt="${escapeHtml(article.title)}" style="width:100%;height:auto;border-radius:8px;" loading="lazy"><figcaption style="font-size:0.78rem;color:#8a9a94;margin-top:0.4rem;">Bild: Pixabay</figcaption></figure>`;
    if (/^\s*<h1[^>]*>.*?<\/h1>/i.test(contentHtml)) {
      contentHtml = contentHtml.replace(/(^\s*<h1[^>]*>.*?<\/h1>)/i, `$1\n${figure}`);
    } else {
      contentHtml = `${figure}\n${contentHtml}`;
    }
  }

  return {
    title: article.title,
    slug,
    meta_description: article.meta_description,
    content_html: contentHtml,
    image_url: imageUrl,
    image_alt: imageAlt,
  };
}
