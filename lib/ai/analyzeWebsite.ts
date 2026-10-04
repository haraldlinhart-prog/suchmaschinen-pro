const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

export interface SuggestedKeyword {
  keyword: string;
  rationale: string;
  intent: 'informational' | 'commercial' | 'transactional';
}

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

export async function fetchSiteText(domain: string): Promise<{ pageText: string; pageTitle: string }> {
  const siteRes = await fetch(`https://${domain}`, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; suchmaschinen.pro-analyzer/1.0)' },
    signal: AbortSignal.timeout(15000),
  });
  const html = await siteRes.text();
  const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
  const pageTitle = titleMatch ? titleMatch[1].trim() : '';
  const pageText = stripHtml(html).replace(/[\uD800-\uDFFF]/g, '').slice(0, 6000);
  return { pageText, pageTitle };
}

const LANGUAGE_NAMES: Record<string, string> = { de: 'German', en: 'English' };

/**
 * Translates a search keyword into the search term people actually use in the target
 * language (not a word-for-word translation), e.g. "Gesellschaft kaufen statt gründen"
 * → "buy a company instead of starting one". Used for secondary-language articles.
 */
export async function translateKeyword(keyword: string, language: string): Promise<string> {
  if (!ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY fehlt.');
  const lang = LANGUAGE_NAMES[language] ?? language;
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: 100,
      messages: [{
        role: 'user',
        content: `Give the ${lang} search phrase that people would type into Google for the same topic as this keyword: "${keyword}". Keep brand and product names (e.g. bank names, "GmbH", "LLC") as they are. Answer with the phrase only, no quotes, no explanation.`,
      }],
    }),
  });
  if (!res.ok) throw new Error(`translateKeyword: Claude API ${res.status}`);
  const data = await res.json();
  const text = (data.content?.find((c: { type: string }) => c.type === 'text')?.text ?? '').trim().replace(/^["']|["']$/g, '');
  if (!text || text.length > 120) throw new Error('translateKeyword: unusable answer');
  return text;
}

/**
 * Suggests a large batch of keywords for a site in its article language (German by
 * default). When `avoidKeywords` is passed (e.g. every keyword already turned into an
 * article), the model is asked to avoid repeating them and dig into further long-tail /
 * adjacent-topic territory instead — this is what lets a site "refill" its keyword
 * pipeline for ongoing automated publishing.
 * `language` (04.10.2026): English sites such as american-llc.org used to get German
 * keywords, so their articles ended up German or half-German.
 */
export async function suggestKeywords(
  domain: string,
  pageTitle: string,
  pageText: string,
  avoidKeywords: string[] = [],
  language: string = 'de'
): Promise<SuggestedKeyword[]> {
  if (!ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY fehlt.');
  const lang = LANGUAGE_NAMES[language] ?? 'German';

  const avoidBlock = avoidKeywords.length
    ? `\nThese keywords have already been used — suggest DIFFERENT ones (deeper long-tail variants, adjacent subtopics, related questions), do not repeat them:\n${avoidKeywords.map(k => `- ${k}`).join('\n')}\n`
    : '';

  const prompt = `You are a ${lang}-language SEO analyst. Analyze the following website content and identify the 50 most valuable ${lang}-language search keywords/phrases this site should target for organic traffic, ranging from core commercial terms to specific long-tail questions. For each, give a short rationale (why it fits this site) and the likely search intent (informational, commercial, or transactional).

Website: ${domain}
Page title: ${pageTitle}
Content excerpt:
${pageText}
${avoidBlock}
IMPORTANT: Write the "keyword" and "rationale" fields entirely in ${lang}. Only the "intent" value stays in English (one of: informational, commercial, transactional).

Respond ONLY with a JSON array of exactly 50 items, no other text, in this exact shape:
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
      max_tokens: 6000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!claudeRes.ok) {
    const errText = await claudeRes.text();
    console.error('Claude API error (suggestKeywords):', errText);
    throw new Error('KI-Analyse fehlgeschlagen.');
  }

  const claudeData = await claudeRes.json();
  const textBlock = claudeData.content?.find((c: { type: string }) => c.type === 'text');
  const raw = textBlock.text.trim().replace(/^```json\s*/i, '').replace(/```$/, '');
  return JSON.parse(raw);
}
