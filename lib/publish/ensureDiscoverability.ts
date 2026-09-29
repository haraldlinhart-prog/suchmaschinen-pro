import { getScAccessToken } from '@/lib/google/scToken';
import { resolveOrigin } from '@/lib/publish/origin';
import { submitSitemap } from '@/lib/google/searchconsole';

// Publishing an article into a repo is not enough: if nothing links to it and no sitemap
// lists it, neither visitors nor Google ever find it (firmenabwicklung.de, chat 26.09.26 —
// six live articles, zero internal links, sitemap listed only the homepage).
// This runs after every publish and once per cron run for every GitHub-linked site.
// It is idempotent: files are only committed when their content actually changes.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseLike = any;

interface WebsiteLike {
  user_id?: string;
  id: string;
  domain: string;
  github_repo: string | null;
  publish_path: string;
}

export interface DiscoverabilityResult {
  domain: string;
  sitemap: 'created' | 'updated' | 'unchanged' | 'skipped';
  robots: 'created' | 'updated' | 'unchanged' | 'dynamic' | 'skipped';
  link: 'inserted' | 'present' | 'manual-nextjs' | 'no-homepage' | 'skipped';
  gsc?: 'submitted' | 'error' | 'not-connected';
  detail?: string;
}

const LINK_MARKER = '<!-- suchmaschinen.pro:blog-link -->';
const LINK_LABEL = 'Ratgeber';

function gh(token: string) {
  const headers = { Authorization: `token ${token}`, Accept: 'application/vnd.github+json' };
  return {
    async get(owner: string, repo: string, path: string): Promise<{ content: string; sha: string } | null> {
      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, { headers });
      if (!res.ok) return null;
      const data = await res.json();
      if (Array.isArray(data) || typeof data.content !== 'string') return null;
      return { content: Buffer.from(data.content, 'base64').toString('utf-8'), sha: data.sha };
    },
    async exists(owner: string, repo: string, path: string): Promise<boolean> {
      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, { headers });
      return res.ok;
    },
    async list(owner: string, repo: string, path = ''): Promise<Array<{ name: string }>> {
      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, { headers });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    async put(owner: string, repo: string, path: string, content: string, message: string, sha?: string) {
      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          content: Buffer.from(content, 'utf-8').toString('base64'),
          ...(sha ? { sha } : {}),
        }),
      });
      if (!res.ok) throw new Error(`GitHub PUT ${path} failed (${res.status}): ${await res.text()}`);
    },
  };
}


function xmlEscape(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function buildSitemap(origin: string, publishPath: string, articles: Array<{ slug: string; published_at: string | null }>): string {
  const newest = articles.map(a => a.published_at).filter(Boolean).sort().pop();
  const entry = (loc: string, lastmod: string | null | undefined, priority: string) =>
    `  <url>\n    <loc>${xmlEscape(loc)}</loc>\n${lastmod ? `    <lastmod>${lastmod.slice(0, 10)}</lastmod>\n` : ''}    <priority>${priority}</priority>\n  </url>\n`;
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  xml += entry(`${origin}/${publishPath}/`, newest, '0.8');
  for (const a of articles) xml += entry(`${origin}/${publishPath}/${a.slug}/`, a.published_at, '0.7');
  return xml + '</urlset>\n';
}

export function homepageLinksToBlog(html: string, publishPath: string): boolean {
  if (html.includes(LINK_MARKER)) return true;
  const p = publishPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`href=["'](https?://[^"']*)?/?${p}/?["'#?]`, 'i').test(html);
}

// Inserts a single crawlable link to the article index. Prefers the main navigation
// (so visitors see it), falls back to the footer, then to just before </body>.
export function insertBlogLink(html: string, publishPath: string): string {
  const href = `/${publishPath}/`;
  const navMatch = html.match(/<nav\b[^>]*>[\s\S]*?<\/nav>/i);
  if (navMatch && navMatch.index !== undefined) {
    const nav = navMatch[0];
    let newNav: string | null = null;
    if (/<li\b/i.test(nav)) {
      // Copy the class of an existing <li> so the item picks up the menu styling.
      const liClass = nav.match(/<li\b([^>]*)>/i)?.[1] ?? '';
      // Insert after the first </li> so "Ratgeber" lands at position 2.
      const firstLiEnd = nav.indexOf('</li>');
      if (firstLiEnd !== -1) {
        const insertAt = firstLiEnd + 5; // after </li>
        newNav = `${nav.slice(0, insertAt)}\n      ${LINK_MARKER}<li${liClass}><a href="${href}">${LINK_LABEL}</a></li>${nav.slice(insertAt)}`;
      } else {
        // No </li> found: fall back to inserting before the last </ul>.
        const lastUl = nav.lastIndexOf('</ul>');
        if (lastUl !== -1) {
          newNav = `${nav.slice(0, lastUl)}${LINK_MARKER}<li${liClass}><a href="${href}">${LINK_LABEL}</a></li>${nav.slice(lastUl)}`;
        }
      }
    } else if (/<a\b/i.test(nav)) {
      // Flat list of <a> tags: insert after the first plain link so "Ratgeber" lands at
      // position 2. CTAs and logo/brand links are not counted as plain links.
      const anchors = [...nav.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/gi)];
      const plain = anchors.filter(m => !/class=["'][^"']*(cta|btn|button|logo|brand)/i.test(m[0]));
      // Copy the class of an existing plain <a> so the item picks up the menu styling.
      const aClassMatch = plain[0]?.[0].match(/class=["']([^"']+)["']/i);
      const aClass = aClassMatch ? ` class="${aClassMatch[1]}"` : '';
      const link = `${LINK_MARKER}<a${aClass} href="${href}">${LINK_LABEL}</a>`;
      if (plain.length > 0) {
        // After the first plain link = position 2 in the nav.
        const first = plain[0];
        const end = (first.index ?? 0) + first[0].length;
        newNav = `${nav.slice(0, end)}\n      ${link}${nav.slice(end)}`;
      }
    }
    if (newNav) return html.slice(0, navMatch.index) + newNav + html.slice(navMatch.index + nav.length);
  }

  const standalone = `${LINK_MARKER}<p style="text-align:center;margin:1rem 0;font-size:.9rem"><a href="${href}" style="color:inherit">${LINK_LABEL} &amp; Artikel</a></p>\n`;
  const footerEnd = html.search(/<\/footer>/i);
  if (footerEnd !== -1) return html.slice(0, footerEnd) + standalone + html.slice(footerEnd);
  const bodyEnd = html.search(/<\/body>/i);
  if (bodyEnd !== -1) return html.slice(0, bodyEnd) + standalone + html.slice(bodyEnd);
  return html;
}

async function submitToSearchConsole(domain: string, sitemapUrl: string, userId?: string): Promise<'submitted' | 'error' | 'not-connected'> {
  try {
    const accessToken = userId ? await getScAccessToken(userId) : null;
    if (!accessToken) return 'not-connected';
    await submitSitemap(accessToken, `sc-domain:${domain.replace(/^www\./, '')}`, sitemapUrl);
    return 'submitted';
  } catch (e) {
    // Only works for properties in the admin's Search Console (network sites); for
    // customer domains the robots.txt Sitemap line is what gets Google to it.
    console.error(`ensureDiscoverability: GSC submit failed for ${domain}`, e);
    return 'error';
  }
}

export async function ensureDiscoverability(website: WebsiteLike, supabase: SupabaseLike): Promise<DiscoverabilityResult> {
  const result: DiscoverabilityResult = { domain: website.domain, sitemap: 'skipped', robots: 'skipped', link: 'skipped' };
  if (!website.github_repo) return result;
  const token = process.env.GITHUB_TOKEN;
  if (!token) return { ...result, detail: 'GITHUB_TOKEN fehlt' };

  const { data } = await supabase
    .from('sq_articles')
    .select('slug, published_at')
    .eq('website_id', website.id)
    .eq('status', 'published')
    .order('published_at', { ascending: false });
  const articles = (data || []) as Array<{ slug: string; published_at: string | null }>;
  if (articles.length === 0) return result;

  const api = gh(token);
  const [owner, repo] = website.github_repo.split('/');
  const publishPath = (website.publish_path || '/blog/').replace(/^\/|\/$/g, '');
  const root = await api.list(owner, repo);
  const isNextJs = root.some(e => /^next\.config\.(js|mjs|ts)$/.test(e.name));
  const staticPrefix = isNextJs ? 'public/' : '';
  const origin = await resolveOrigin(website.domain);
  const sitemapUrl = `${origin}/sitemap-blog.xml`;

  // 1. Dedicated article sitemap. Kept separate from the site's own sitemap.xml so we
  //    never clobber a hand-written or framework-generated one.
  const sitemapPath = `${staticPrefix}sitemap-blog.xml`;
  const sitemapXml = buildSitemap(origin, publishPath, articles);
  const existingSitemap = await api.get(owner, repo, sitemapPath);
  if (!existingSitemap) {
    await api.put(owner, repo, sitemapPath, sitemapXml, 'suchmaschinen.pro: add article sitemap');
    result.sitemap = 'created';
  } else if (existingSitemap.content !== sitemapXml) {
    await api.put(owner, repo, sitemapPath, sitemapXml, 'suchmaschinen.pro: update article sitemap', existingSitemap.sha);
    result.sitemap = 'updated';
  } else {
    result.sitemap = 'unchanged';
  }

  // 2. robots.txt must point at it. Next.js sites with app/robots.ts generate robots.txt
  //    at build time; a public/robots.txt would be shadowed, so rely on GSC there.
  const dynamicRobots = isNextJs && (
    await api.exists(owner, repo, 'app/robots.ts') || await api.exists(owner, repo, 'app/robots.js') ||
    await api.exists(owner, repo, 'src/app/robots.ts') || await api.exists(owner, repo, 'src/app/robots.js')
  );
  if (dynamicRobots) {
    result.robots = 'dynamic';
  } else {
    const robotsPath = `${staticPrefix}robots.txt`;
    const robots = await api.get(owner, repo, robotsPath);
    const line = `Sitemap: ${sitemapUrl}`;
    if (!robots) {
      await api.put(owner, repo, robotsPath, `User-agent: *\nAllow: /\n\n${line}\n`, 'suchmaschinen.pro: add robots.txt with article sitemap');
      result.robots = 'created';
    } else if (!robots.content.includes(line)) {
      const updated = `${robots.content.replace(/\s*$/, '')}\n${line}\n`;
      await api.put(owner, repo, robotsPath, updated, 'suchmaschinen.pro: reference article sitemap in robots.txt', robots.sha);
      result.robots = 'updated';
    } else {
      result.robots = 'unchanged';
    }
  }

  // 3. A crawlable link from the homepage to the article index.
  if (isNextJs) {
    // JSX navigation can't be edited safely by string insertion; flagged for manual work.
    result.link = 'manual-nextjs';
  } else {
    const home = await api.get(owner, repo, 'index.html');
    if (!home) {
      result.link = 'no-homepage';
    } else if (homepageLinksToBlog(home.content, publishPath)) {
      result.link = 'present';
    } else {
      const updated = insertBlogLink(home.content, publishPath);
      if (updated !== home.content) {
        await api.put(owner, repo, 'index.html', updated, 'suchmaschinen.pro: link article index from homepage', home.sha);
        result.link = 'inserted';
      } else {
        result.link = 'no-homepage';
      }
    }
  }

  // 4. Tell Google about the new sitemap once, when it first appears.
  if (result.sitemap === 'created') result.gsc = await submitToSearchConsole(website.domain, sitemapUrl, website.user_id);

  return result;
}
