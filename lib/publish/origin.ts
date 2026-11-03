// The origin a site actually serves on (apex vs. www), found by following redirects.
// Canonical tags, sitemaps and links must use it — pointing them at a host that
// redirects makes Google index both hosts (firmenabwicklung.de, chat 26.09.26).
// Bilingual sites whose secondary language has its own domain, served from the same repo
// and Vercel project (03.11.2026, treuhandauftrag.de → nominee-buyer.com). Canonicals,
// sitemap entries and article URLs of that language use this domain. Keyed by domain (no
// DB column), like siteLayout.ts; move into sq_websites once more sites need it.
const SECONDARY_LANGUAGE_DOMAINS: Record<string, string> = {
  'treuhandauftrag.de': 'nominee-buyer.com',
};

function bareDomain(domain: string): string {
  return domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '');
}

export function secondaryDomainFor(domain: string): string | null {
  return SECONDARY_LANGUAGE_DOMAINS[bareDomain(domain)] ?? null;
}

/** The domain an article in `language` lives on; website.domain unless the site has a secondary-language domain. */
export function domainForLanguage(website: { domain: string; secondary_language?: string | null }, language?: string | null): string {
  const secondary = secondaryDomainFor(website.domain);
  return secondary && language && language === website.secondary_language ? secondary : website.domain;
}

/** True for URLs on a secondary-language domain of any site. */
export function isSecondaryDomainUrl(url: string): boolean {
  try {
    return Object.values(SECONDARY_LANGUAGE_DOMAINS).includes(bareDomain(new URL(url).hostname));
  } catch {
    return false;
  }
}

export async function resolveOrigin(domain: string): Promise<string> {
  try {
    const res = await fetch(`https://${domain}/`, { redirect: 'follow' });
    return new URL(res.url).origin;
  } catch {
    return `https://${domain}`;
  }
}
