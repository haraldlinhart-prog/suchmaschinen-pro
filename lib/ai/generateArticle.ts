const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const PIXABAY_API_KEY = process.env.PIXABAY_API_KEY;
// upload-image.php accepts raw image bytes (multipart) instead of a source URL,
// because the Plesk server itself is IP-blocked by Pixabay's CDN (confirmed via
// direct curl test from the server: even a static pixabay.com/favicon.ico fetch
// gets a 403 regardless of User-Agent). This app's own runtime (Vercel) is not
// blocked, so we download the Pixabay bytes here and upload the finished file.
const VIDEO_UPLOAD_URL = 'https://video.pan21.com/upload-image.php';
const VIDEO_UPLOAD_KEY = process.env.VIDEO_UPLOAD_KEY ?? '';

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

async function mirrorToVideoCdn(pixabayUrl: string, articleRef?: string): Promise<string | null> {
  // Download the Pixabay image bytes ourselves (this runtime can reach Pixabay;
  // the video.pan21.com Plesk server cannot — it is IP-blocked by Pixabay's CDN,
  // confirmed by a direct server-side curl test returning 403 even for a static
  // favicon.ico regardless of User-Agent) and upload the bytes to video.pan21.com
  // as a multipart file, instead of asking that server to fetch the URL itself.
  //
  // IMPORTANT: on failure this must return null, not the raw Pixabay URL. An
  // off-domain fallback here previously ended up stored as article.image_url and
  // used as og:image, which made Facebook's link-preview image open on Pixabay/
  // fbcdn instead of staying on the article page.
  if (!VIDEO_UPLOAD_KEY) {
    console.error(`mirrorToVideoCdn: VIDEO_UPLOAD_KEY not set, cannot mirror image${articleRef ? ` for article "${articleRef}"` : ''} (source: ${pixabayUrl})`);
    return null;
  }
  try {
    const imgRes = await fetch(pixabayUrl, { signal: AbortSignal.timeout(15000) });
    if (!imgRes.ok) {
      console.error(`mirrorToVideoCdn: failed to download source image, status ${imgRes.status}${articleRef ? ` for article "${articleRef}"` : ''} (source: ${pixabayUrl})`);
      return null;
    }
    const contentType = imgRes.headers.get('content-type') ?? 'image/jpeg';
    const extFromType = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : contentType.includes('gif') ? 'gif' : 'jpg';
    const bytes = await imgRes.arrayBuffer();

    const form = new FormData();
    form.append('api_key', VIDEO_UPLOAD_KEY);
    form.append('image', new Blob([bytes], { type: contentType }), `pixabay_${Date.now()}.${extFromType}`);

    const res = await fetch(VIDEO_UPLOAD_URL, {
      method: 'POST',
      body: form,
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      console.error(`mirrorToVideoCdn: upload to video.pan21.com failed with status ${res.status}${articleRef ? ` for article "${articleRef}"` : ''} (source: ${pixabayUrl})`);
      return null;
    }
    const data = await res.json() as { url?: string; error?: string };
    if (data.url) return data.url;
    console.error(`mirrorToVideoCdn: upload response had no url${articleRef ? ` for article "${articleRef}"` : ''} (source: ${pixabayUrl}):`, data.error ?? data);
  } catch (err) {
    console.error(`mirrorToVideoCdn: upload threw${articleRef ? ` for article "${articleRef}"` : ''} (source: ${pixabayUrl}):`, err);
  }
  return null;
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

/** Replaces the text of the first <h1> (the article title) in generated HTML. */
export function replaceH1(html: string, title: string): string {
  return /<h1[^>]*>[\s\S]*?<\/h1>/i.test(html)
    ? html.replace(/(<h1[^>]*>)[\s\S]*?(<\/h1>)/i, `$1${escapeHtml(title)}$2`)
    : html;
}

/**
 * Rewrites a title (and meta description) so it differs from titles already used in the
 * account (04.10.2026 — 7 word-for-word identical titles across PAN21 network sites).
 */
export async function makeDistinctTitle(opts: {
  title: string; meta_description: string; keyword: string; domain: string; language: string; taken: string[];
}): Promise<{ title: string; meta_description: string }> {
  if (!ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY fehlt.');
  const langName = opts.language === 'en' ? 'English' : 'German';
  const prompt = `This article on ${opts.domain} targets the keyword "${opts.keyword}". Its title is already used by another website of the same publisher:
"${opts.title}"
Current meta description: "${opts.meta_description}"

Write a new ${langName} H1 title (max. 70 characters) that still contains the keyword, fits ${opts.domain} specifically, and is clearly different from ALL of these existing titles — no stock patterns like "Der ultimative/komplette/umfassende Leitfaden" or "The ultimate/complete guide":
${opts.taken.slice(0, 40).map(t => `- ${t}`).join('\n')}

Also write a matching ${langName} meta description (140-160 characters). Call the output_title tool.`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }],
      tools: [{
        name: 'output_title',
        description: 'Submit the new title and meta description.',
        input_schema: {
          type: 'object',
          properties: { title: { type: 'string' }, meta_description: { type: 'string' } },
          required: ['title', 'meta_description'],
        },
      }],
      tool_choice: { type: 'tool', name: 'output_title' },
    }),
  });
  if (!res.ok) throw new Error(`makeDistinctTitle: Claude API ${res.status}`);
  const data = await res.json();
  const block = data.content?.find((c: { type: string }) => c.type === 'tool_use');
  const out = block?.input as { title?: string; meta_description?: string } | undefined;
  if (!out?.title) throw new Error('makeDistinctTitle: no title returned');
  return { title: out.title.trim(), meta_description: (out.meta_description || opts.meta_description).trim() };
}

export async function generateArticleContent(
  domain: string,
  notes: string | null,
  keyword: string,
  rationale?: string,
  intent?: string,
  relatedLinks?: { title: string; url: string }[],
  articleLanguage = 'de',
  /** Titles already used on this or sister sites of the same account (see
   *  lib/content/networkUsage.ts) — the H1 must differ from all of them. */
  avoidTitles: string[] = []
): Promise<GeneratedArticle> {
  if (!ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY fehlt.');

  // Extra legal-caution instruction for sites that write about specific companies
  // that may have legal counsel monitoring content (e.g. formular-abzocke.de / Phonemotion GmbH).
  const legalCautionNote = (domain === 'formular-abzocke.de')
    ? `\nLEGAL CAUTION — this site writes about Gewerbe-Online-Service.de (operated by Phonemotion GmbH). The company has legal representation and monitors published content closely. You MUST:
- State only verifiable facts; never speculate or imply criminal intent (no "Betrug", no "Abzocke" unless quoting established legal findings)
- Avoid sweeping generalisations (e.g. "viele Nutzer" without a cited source)
- Use hedged language where appropriate: "nach Angaben von Betroffenen", "laut Verbraucherbeschwerden", "es wird berichtet"
- Never recommend filing a criminal complaint (Strafanzeige) — instead recommend consumer advice centres (Verbraucherzentrale) or civil legal counsel
- Describe the business model factually (private fee-based service, not an official authority) without characterising it as fraudulent\n`
    : '';

  const langName = articleLanguage === 'en' ? 'English' : articleLanguage === 'de' ? 'German' : articleLanguage;
  const prompt = `You are an expert ${langName}-language SEO content writer. Write a high-quality, genuinely useful blog article targeting the keyword "${keyword}" for the website ${domain}${notes ? ` (context: ${notes})` : ''}.
${rationale ? `Why this keyword matters for this site: ${rationale}` : ''}
${intent ? `Search intent: ${intent}` : ''}
${legalCautionNote}
Requirements:
- Write in ${langName}
- 700-1000 words, genuinely informative (not generic filler)
- Use a clear H1 title, then structured with H2/H3 subheadings
- Natural, non-spammy use of the keyword and closely related terms
- Include a short concluding paragraph
${relatedLinks && relatedLinks.length ? `- Where it genuinely fits the text, link 1–3 times to these related articles on the same site (use exactly these URLs, natural anchor text, no link list):\n${relatedLinks.map(r => `  - ${r.title}: ${r.url}`).join('\n')}\n` : ''}${avoidTitles.length ? `- The H1 title must be clearly different from these titles already used on sister websites — do not reuse them or their phrasing, and avoid stock patterns like "Der ultimative/komplette/umfassende Leitfaden" or "The ultimate/complete guide"; give the title an angle specific to ${domain}:\n${avoidTitles.slice(0, 40).map(t => `  - ${t}`).join('\n')}\n` : ''}- Output as clean semantic HTML body content only (h1, h2, h3, p, ul/li as needed) — no <html>, <head>, or <body> tags, no inline styles, no markdown

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

  // Safety net: if the title still matches one already used in the account, rewrite it.
  const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');
  if (avoidTitles.some(t => norm(t) === norm(article.title))) {
    try {
      const distinct = await makeDistinctTitle({
        title: article.title, meta_description: article.meta_description, keyword, domain, language: articleLanguage, taken: avoidTitles,
      });
      article.content_html = replaceH1(article.content_html, distinct.title);
      article.title = distinct.title;
      article.meta_description = distinct.meta_description;
    } catch (err) {
      console.error(`generateArticleContent: could not make title distinct for ${domain}`, err);
    }
  }

  const slug = slugify(article.title);
  let imageUrl: string | null = null;
  let imageAlt: string | null = null;
  let contentHtml: string = article.content_html;

  const image = article.image_query ? await findPixabayImage(article.image_query) : null;
  if (image) {
    imageUrl = await mirrorToVideoCdn(image.url, slug);
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
