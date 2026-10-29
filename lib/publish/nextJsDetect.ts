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
