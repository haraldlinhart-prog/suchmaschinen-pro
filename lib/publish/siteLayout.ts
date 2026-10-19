import { escapeHtml } from '@/lib/ai/generateArticle';
import { buildIndexJsonLd } from '@/lib/publish/jsonLd';

// Per-site language sections (19.10.2026, german-nominee.de).
//
// Most sites have one article folder (publish_path) with one generated index and one
// generated sitemap-blog.xml, both rebuilt from sq_articles on every publish. That breaks
// sites whose blog also contains pages suchmaschinen.pro did not write: on german-nominee.de
// the 50 English guides migrated from GrandRanker live under /blog/ and the German posts
// under /blog/de/. On 19.10.2026 the rebuild replaced sitemap-blog.xml and blog/index.html
// with the German rows only, and a German article landed in the English folder.
//
// A site listed here gets:
//   - each article language published to its own folder (with a self hreflang),
//   - its own sitemap file per language,
//   - index and sitemap MERGED with what is already in the repo: existing entries are
//     never dropped, only suchmaschinen.pro's own articles are added/updated.
// Sites not listed keep the exact previous behaviour.
//
// Keyed by domain (no DB column), so no migration is needed. Move this into sq_websites
// once a second site needs it.

export interface LanguageSection {
  /** Article folder without leading/trailing slash, e.g. 'blog' or 'blog/de'. */
  path: string;
  /** Sitemap file at the site root (Next.js sites: under public/). */
  sitemap: string;
  /** Labels for a freshly generated index (only used when the index file does not exist yet). */
  indexTitle: string;
  backLabel: string;
}

export interface SiteLayout {
  /** language code → section. */
  sections: Record<string, LanguageSection>;
  /** Language assumed for rows whose `language` is NULL (published before the bilingual feature). */
  legacyLanguage: string;
  /** Language whose index is x-default. */
  defaultLanguage: string;
}

const SITE_LAYOUTS: Record<string, SiteLayout> = {
  'german-nominee.de': {
    defaultLanguage: 'en',
    legacyLanguage: 'de',
    sections: {
      en: { path: 'blog', sitemap: 'sitemap-blog.xml', indexTitle: 'Guides', backLabel: 'Back to' },
      de: { path: 'blog/de', sitemap: 'sitemap-blog-de.xml', indexTitle: 'Ratgeber auf Deutsch', backLabel: 'Zurück zu' },
    },
  },
};

export function siteLayoutFor(domain: string | null | undefined): SiteLayout | null {
  if (!domain) return null;
  const key = domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '');
  return SITE_LAYOUTS[key] ?? null;
}

/** Section key for a language: NULL → legacy language, unknown languages → legacy section. */
export function sectionLanguage(layout: SiteLayout, language: string | null | undefined): string {
  const l = language || layout.legacyLanguage;
  return layout.sections[l] ? l : layout.legacyLanguage;
}

/** Section for a language; unknown languages fall back to the legacy language's section. */
export function sectionFor(layout: SiteLayout, language: string | null | undefined): LanguageSection {
  return layout.sections[sectionLanguage(layout, language)];
}

/** Slugs that would collide with a language folder (e.g. an article "de" under /blog/). */
export function isReservedSlug(layout: SiteLayout, slug: string): boolean {
  const s = slug.toLowerCase();
  if (s === 'en' || s === 'de') return true;
  return Object.values(layout.sections).some(sec => sec.path.split('/').pop() === s);
}

export function hreflangSelf(lang: string, url: string): string {
  return `<link rel="alternate" hreflang="${escapeHtml(lang)}" href="${url}">`;
}

export type LayoutArticle = {
  slug: string;
  title?: string | null;
  meta_description?: string | null;
  published_at: string | null;
  language?: string | null;
};

function articleUrl(origin: string, sec: LanguageSection, slug: string): string {
  return `${origin}/${sec.path}/${slug}/`;
}

/** Articles of one section, newest first. */
export function articlesForSection(layout: SiteLayout, lang: string, articles: LayoutArticle[]): LayoutArticle[] {
  return articles
    .filter(a => sectionLanguage(layout, a.language) === lang)
    .sort((a, b) => (b.published_at || '').localeCompare(a.published_at || ''));
}

/** URLs our own articles would have in THIS section's folder although they belong to another
 *  language (e.g. a German row under /blog/<slug>/). Those are stale entries we wrote ourselves. */
function staleUrlsForSection(layout: SiteLayout, lang: string, origin: string, articles: LayoutArticle[]): Set<string> {
  const sec = layout.sections[lang];
  const own = new Set(articlesForSection(layout, lang, articles).map(a => a.slug));
  const stale = new Set<string>();
  for (const a of articles) if (!own.has(a.slug)) stale.add(articleUrl(origin, sec, a.slug));
  return stale;
}

function xmlEscape(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function sitemapEntry(loc: string, lastmod: string | null | undefined, priority: string): string {
  return `  <url>\n    <loc>${xmlEscape(loc)}</loc>\n${lastmod ? `    <lastmod>${lastmod.slice(0, 10)}</lastmod>\n` : ''}    <priority>${priority}</priority>\n  </url>\n`;
}

/**
 * Merges this section's articles into an existing sitemap. Every existing <url> block is kept
 * unchanged, except: blocks for our own articles get their <lastmod> updated, and blocks for
 * our own articles of ANOTHER language under this folder are removed. New articles are added
 * right after the index entry, newest first.
 */
export function mergeSitemap(existing: string | null, layout: SiteLayout, lang: string, origin: string, allArticles: LayoutArticle[]): string {
  const sec = layout.sections[lang];
  const own = articlesForSection(layout, lang, allArticles);
  const stale = staleUrlsForSection(layout, lang, origin, allArticles);
  const indexLoc = `${origin}/${sec.path}/`;
  const newest = own.map(a => a.published_at).filter(Boolean).sort().pop() || null;

  const blockRe = /[ \t]*<url>[\s\S]*?<\/url>[ \t]*\n?/g;
  const locOf = (block: string) => {
    const m = block.match(/<loc>\s*([^<]+?)\s*<\/loc>/);
    return m ? m[1].replace(/&amp;/g, '&') : '';
  };

  let header = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  let blocks: string[] = [];
  if (existing && /<urlset\b/.test(existing)) {
    const first = existing.search(/[ \t]*<url>/);
    const close = existing.lastIndexOf('</urlset>');
    if (first === -1) header = existing.slice(0, close === -1 ? existing.length : close);
    else header = existing.slice(0, first);
    if (!header.endsWith('\n')) header += '\n';
    blocks = (existing.match(blockRe) || []).map(b => (b.endsWith('\n') ? b : `${b}\n`));
  }

  const setLastmod = (block: string, lastmod: string | null) => {
    if (!lastmod) return block;
    const d = lastmod.slice(0, 10);
    if (/<lastmod>/.test(block)) {
      const cur = block.match(/<lastmod>\s*([^<]+?)\s*<\/lastmod>/)?.[1] || '';
      return cur.slice(0, 10) >= d ? block : block.replace(/<lastmod>[^<]*<\/lastmod>/, `<lastmod>${d}</lastmod>`);
    }
    return block.replace(/(<\/loc>\n?)/, `$1    <lastmod>${d}</lastmod>\n`);
  };

  const byLoc = new Map<string, number>();
  const kept: string[] = [];
  for (const b of blocks) {
    const loc = locOf(b);
    if (stale.has(loc)) continue;
    if (byLoc.has(loc)) continue; // drop exact duplicates
    byLoc.set(loc, kept.length);
    kept.push(b);
  }

  // Index entry
  if (byLoc.has(indexLoc)) {
    const i = byLoc.get(indexLoc) as number;
    kept[i] = setLastmod(kept[i], newest);
  } else {
    kept.unshift(sitemapEntry(indexLoc, newest, lang === layout.defaultLanguage ? '0.8' : '0.6'));
    byLoc.clear();
    kept.forEach((b, i) => byLoc.set(locOf(b), i));
  }

  const added: string[] = [];
  for (const a of own) {
    const loc = articleUrl(origin, sec, a.slug);
    if (byLoc.has(loc)) {
      const i = byLoc.get(loc) as number;
      kept[i] = setLastmod(kept[i], a.published_at);
    } else {
      added.push(sitemapEntry(loc, a.published_at, lang === layout.defaultLanguage ? '0.7' : '0.6'));
    }
  }
  const idx = kept.findIndex(b => locOf(b) === indexLoc);
  kept.splice(idx + 1, 0, ...added);
  return `${header}${kept.join('')}</urlset>\n`;
}

function freshIndexHtml(domain: string, origin: string, layout: SiteLayout, lang: string): string {
  const sec = layout.sections[lang];
  const canonical = `${origin}/${sec.path}/`;
  const alternates = Object.entries(layout.sections)
    .map(([l, s]) => `<link rel="alternate" hreflang="${l}" href="${origin}/${s.path}/">`)
    .join('\n');
  const xDefault = `<link rel="alternate" hreflang="x-default" href="${origin}/${layout.sections[layout.defaultLanguage].path}/">`;
  const name = `${sec.indexTitle} – ${domain}`;
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(name)}</title>
<meta name="robots" content="index, follow">
<link rel="canonical" href="${canonical}">
${alternates}
${xDefault}
${buildIndexJsonLd({ canonical, origin, siteName: domain, lang, name })}
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; max-width: 720px; margin: 0 auto; padding: 40px 20px; line-height: 1.7; color: #1a1a1a; }
  h1 { font-size: 1.8rem; margin-bottom: 1.5rem; }
  ul { list-style: none; padding: 0; }
  li { margin-bottom: 1.5rem; padding-bottom: 1.5rem; border-bottom: 1px solid #eee; }
  li a { font-size: 1.15rem; font-weight: 600; color: #1a1a1a; text-decoration: none; }
  li p { margin: 0.4rem 0 0; color: #555; font-size: 0.92rem; }
  a.back { display: inline-block; margin-bottom: 24px; color: #666; text-decoration: none; font-size: 0.9rem; }
</style>
</head>
<body>
<a class="back" href="${origin}/">&larr; ${escapeHtml(sec.backLabel)} ${escapeHtml(domain)}</a>
<h1>${escapeHtml(sec.indexTitle)}</h1>
<ul>
</ul>
</body>
</html>
`;
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Merges this section's articles into an existing index page. Nothing that is already on the
 * page is changed: articles not linked yet are inserted at the top of the article list (in
 * the list's own markup style); <li> items we wrote ourselves for another language's article
 * under this folder are removed. Returns null when the page has no recognisable list (then
 * it is left alone).
 */
export function mergeIndex(existing: string | null, domain: string, layout: SiteLayout, lang: string, origin: string, allArticles: LayoutArticle[]): string | null {
  const sec = layout.sections[lang];
  let html = existing ?? freshIndexHtml(domain, origin, layout, lang);

  for (const url of staleUrlsForSection(layout, lang, origin, allArticles)) {
    const re = new RegExp(`[ \\t]*<li\\b[^>]*>(?:(?!<li\\b|</li>)[\\s\\S])*?href=["']${escapeRe(url)}["'](?:(?!<li\\b)[\\s\\S])*?</li>[ \\t]*\\n?`, 'g');
    html = html.replace(re, '');
  }

  const own = articlesForSection(layout, lang, allArticles);
  const missing = own.filter(a => {
    const rel = `/${sec.path}/${a.slug}/`;
    return !new RegExp(`href=["'](?:https?://[^"'/]+)?${escapeRe(rel)}["']`).test(html);
  });
  if (missing.length === 0) return html;

  // The article list: <ul class="...posts..."> if present, otherwise the first <ul> after <h1>.
  let ulMatch = html.match(/<ul\b[^>]*class=["'][^"']*\bposts\b[^"']*["'][^>]*>/i);
  if (!ulMatch) {
    const h1 = html.search(/<\/h1>/i);
    if (h1 !== -1) {
      const m = html.slice(h1).match(/<ul\b[^>]*>/i);
      if (m && m.index !== undefined) ulMatch = Object.assign(m, { index: m.index + h1 }) as RegExpMatchArray;
    }
  }
  if (!ulMatch || ulMatch.index === undefined) return existing === null ? html : null;

  const insertAt = ulMatch.index + ulMatch[0].length;
  const compact = html[insertAt] !== '\n'; // e.g. <ul class="posts"><li>…</li><li>…</li></ul>
  const items = missing.map(a => {
    const href = articleUrl(origin, sec, a.slug);
    const title = escapeHtml(a.title || a.slug);
    const desc = a.meta_description ? escapeHtml(a.meta_description) : '';
    return compact
      ? `<li><a href="${href}">${title}</a>${desc ? `<p>${desc}</p>` : ''}</li>`
      : `\n  <li>\n    <a href="${href}">${title}</a>\n    ${desc ? `<p>${desc}</p>` : ''}\n  </li>`;
  }).join('');
  return html.slice(0, insertAt) + items + html.slice(insertAt);
}

export async function readRepoFile(owner: string, repo: string, path: string, token: string): Promise<string | null> {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
    headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github+json' },
    cache: 'no-store',
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub GET ${path} failed (${res.status})`);
  const data = await res.json();
  if (Array.isArray(data) || typeof data.content !== 'string') throw new Error(`GitHub GET ${path}: not a file`);
  return Buffer.from(data.content, 'base64').toString('utf-8');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function loadLayoutArticles(websiteId: string, supabase: any): Promise<LayoutArticle[]> {
  const { data, error } = await supabase
    .from('sq_articles')
    .select('slug, title, meta_description, published_at, language')
    .eq('website_id', websiteId)
    .eq('status', 'published')
    .order('published_at', { ascending: false });
  if (error) throw new Error(`loading articles failed: ${error.message}`);
  return (data || []) as LayoutArticle[];
}

/**
 * Index + sitemap files for the given languages, merged with the repo state. A read error
 * throws (we never write a file we could not read first — that is what would drop entries).
 * `extra` = the article being published right now (not yet 'published' in the database).
 */
export async function buildLayoutFiles(
  website: { id: string; domain: string; github_repo: string },
  layout: SiteLayout,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  ctx: { isNextJs: boolean; origin: string; token: string },
  opts: { languages?: string[]; index?: boolean; sitemap?: boolean; extra?: LayoutArticle } = {}
): Promise<Array<{ path: string; content: string }>> {
  const [owner, repo] = website.github_repo.split('/');
  const prefix = ctx.isNextJs ? 'public/' : '';
  let articles = await loadLayoutArticles(website.id, supabase);
  if (opts.extra) articles = [opts.extra, ...articles.filter(a => a.slug !== opts.extra!.slug)];

  const langs = opts.languages ?? Object.keys(layout.sections);
  const files: Array<{ path: string; content: string }> = [];
  for (const lang of langs) {
    const sec = layout.sections[lang];
    if (!sec) continue;
    if (opts.sitemap !== false) {
      const path = `${prefix}${sec.sitemap}`;
      const cur = await readRepoFile(owner, repo, path, ctx.token);
      files.push({ path, content: mergeSitemap(cur, layout, lang, ctx.origin, articles) });
    }
    if (opts.index !== false) {
      const path = `${prefix}${sec.path}/index.html`;
      const cur = await readRepoFile(owner, repo, path, ctx.token);
      const merged = mergeIndex(cur, website.domain, layout, lang, ctx.origin, articles);
      if (merged !== null) files.push({ path, content: merged });
    }
  }
  return files;
}
