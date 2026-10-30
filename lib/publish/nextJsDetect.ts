// Next.js-Erkennung für den Ausgabepfad (public/ vs. Repo-Root).
//
// Standard: ein next.config.(js|mjs|ts) im Repo-Root. Manche Next.js-Repos haben keine
// next.config (Next.js braucht sie nicht), z. B. ffa-links.de: dort landeten Artikel und
// sitemap-blog.xml im Root statt unter public/ und lieferten 404 (29.10.2026).
// Domains hier werden immer als Next.js behandelt. Alle anderen Sites: unverändert.
const FORCE_NEXTJS_DOMAINS = new Set<string>(['ffa-links.de']);

function normDomain(domain: string | null | undefined): string {
  return (domain || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '');
}

export function isNextJsRepo(rootEntries: Array<{ name: string }>, domain: string | null | undefined): boolean {
  if (FORCE_NEXTJS_DOMAINS.has(normDomain(domain))) return true;
  return rootEntries.some(e => /^next\.config\.(js|mjs|ts)$/.test(e.name));
}

// Nicht-Next.js-Repos, deren Build statische Dateien ebenfalls nur aus public/ ausliefert
// (z. B. escort-angels.com: TanStack Start/Vite + Nitro auf Coolify). Artikel, sitemap-blog.xml
// und robots.txt landeten dort im Root und lieferten 404 (30.10.2026). Nur der Ausgabepfad
// wechselt nach public/; Next.js-spezifische Schritte (Nav-Link in TSX, app/robots.ts) nicht.
const FORCE_PUBLIC_DIR_DOMAINS = new Set<string>(['escort-angels.com']);

/** true, wenn statische Dateien (Artikel, Index, Sitemap, robots.txt) unter public/ gehören. */
export function usesPublicDir(rootEntries: Array<{ name: string }>, domain: string | null | undefined): boolean {
  return FORCE_PUBLIC_DIR_DOMAINS.has(normDomain(domain)) || isNextJsRepo(rootEntries, domain);
}
