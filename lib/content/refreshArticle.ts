// Premium: refresh articles that lost positions or stall on page 2–4 (chat 26.09.26).
// Same URL and slug; content is revised, updated and extended — Google treats it as
// an improved page, not a new one.

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

export interface RefreshInput {
  domain: string;
  notes: string | null;
  keyword: string;
  title: string;
  contentHtml: string;
  position: number | null;
  bestPosition: number | null;
  related: { title: string; url: string }[];
}

export async function refreshArticleContent(input: RefreshInput): Promise<{ title: string; meta_description: string; content_html: string }> {
  if (!ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY fehlt.');

  // Keep the lead image exactly as it is; the model only rewrites the text.
  const figureMatch = input.contentHtml.match(/<figure[\s\S]*?<\/figure>/i);
  const figure = figureMatch ? figureMatch[0] : '';
  const body = input.contentHtml.replace(figure, '').replace(/<!-- sp:related -->[\s\S]*?<!-- \/sp:related -->/, '');

  const situation = input.bestPosition && input.position && input.position > input.bestPosition + 5
    ? `It used to rank at position ${input.bestPosition} on Google and has dropped to ${input.position}.`
    : input.position ? `It currently ranks around position ${input.position} on Google (page ${Math.ceil(input.position / 10)}) and should reach page 1.` : '';

  const prompt = `You are an expert German-language SEO editor. Improve the existing article below for the website ${input.domain}${input.notes ? ` (context: ${input.notes})` : ''}, targeting the search term "${input.keyword}". ${situation}

Revise it so it answers the searcher's question better than competing pages:
- Keep the topic, the H1 meaning and everything that is correct; fix anything outdated and bring facts, figures and legal references up to date (current year 2026)
- Add missing sub-questions searchers typically have, concrete examples, and a short FAQ section (3–5 questions as H2 "Häufige Fragen" with H3 questions)
- Put a direct 2–3 sentence answer to the main question right after the H1
- 900–1400 words in total, no filler, no keyword stuffing
${input.related.length ? `- Where it genuinely fits, link 1–3 times to these related articles on the same site (use exactly these URLs):\n${input.related.map(r => `  - ${r.title}: ${r.url}`).join('\n')}` : ''}
- Output clean semantic HTML body content only (h1, h2, h3, p, ul/li, a) — no html/head/body tags, no inline styles, no markdown

Existing article:
${body}

Call the output_article tool with the revised article.`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: 6000,
      messages: [{ role: 'user', content: prompt }],
      tools: [{
        name: 'output_article',
        description: 'Submit the revised article.',
        input_schema: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'The H1 text as plain string' },
            meta_description: { type: 'string', description: 'A compelling 140-160 char meta description' },
            content_html: { type: 'string', description: 'The full revised HTML body content' },
          },
          required: ['title', 'meta_description', 'content_html'],
        },
      }],
      tool_choice: { type: 'tool', name: 'output_article' },
    }),
  });
  if (!res.ok) {
    console.error('Claude API error (refreshArticleContent):', await res.text());
    throw new Error('Auffrischen fehlgeschlagen.');
  }
  const data = await res.json();
  const tool = data.content?.find((c: { type: string }) => c.type === 'tool_use');
  if (!tool) throw new Error('Auffrischen fehlgeschlagen (keine Antwort).');
  const out = tool.input as { title: string; meta_description: string; content_html: string };

  let html = out.content_html;
  if (figure) html = /^\s*<h1[^>]*>.*?<\/h1>/i.test(html) ? html.replace(/(^\s*<h1[^>]*>.*?<\/h1>)/i, `$1\n${figure}`) : `${figure}\n${html}`;
  const stamp = new Date().toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
  html += `\n<p style="font-size:0.85rem;color:#6b7b76;margin-top:2rem"><em>Aktualisiert im ${stamp}.</em></p>`;
  return { title: out.title, meta_description: out.meta_description, content_html: html };
}
