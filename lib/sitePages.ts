// Public marketing pages and their URLs on both domains. suchmaschinen.pro is German,
// search-engines.pro is English; middleware.ts maps the English slugs to the shared
// page files. Client-safe (no server imports) — used by Header for the language switch.

export const DE_ORIGIN = 'https://www.suchmaschinen.pro';
export const EN_ORIGIN = 'https://www.search-engines.pro';
export const ENGLISH_HOSTS = ['search-engines.pro', 'www.search-engines.pro'];
export const GERMAN_HOSTS = ['suchmaschinen.pro', 'www.suchmaschinen.pro'];

export type Locale = 'de' | 'en';
export type PageKey = 'home' | 'tour' | 'contact' | 'legal' | 'privacy' | 'auth';

/** Public URL path per page and language (English paths as seen on search-engines.pro). */
export const PAGE_PATHS: Record<PageKey, Record<Locale, string>> = {
  home: { de: '/', en: '/' },
  tour: { de: '/rundgang', en: '/tour' },
  contact: { de: '/kontakt', en: '/contact' },
  legal: { de: '/impressum', en: '/legal-notice' },
  privacy: { de: '/datenschutz', en: '/privacy' },
  auth: { de: '/auth', en: '/auth' },
};

/** English slug → internal page file it is served from. */
export const EN_SLUG_TO_INTERNAL: Record<string, string> = {
  '/tour': '/en/tour',
  '/contact': '/kontakt',
  '/legal-notice': '/impressum',
  '/privacy': '/datenschutz',
};

/** Paths that must not be reachable under their German/internal name on search-engines.pro. */
export const EN_HOST_REDIRECTS: Record<string, string> = {
  '/en': '/',
  '/en/tour': '/tour',
  '/rundgang': '/tour',
  '/kontakt': '/contact',
  '/impressum': '/legal-notice',
  '/datenschutz': '/privacy',
};

export function pageKeyFromPath(pathname: string): PageKey | null {
  const p = pathname.replace(/\/+$/, '') || '/';
  if (p === '/' || p === '/en') return 'home';
  if (p === '/en/tour') return 'tour';
  for (const key of Object.keys(PAGE_PATHS) as PageKey[]) {
    if (PAGE_PATHS[key].de === p || PAGE_PATHS[key].en === p) return key;
  }
  return null;
}

export function absoluteUrl(key: PageKey, locale: Locale): string {
  const origin = locale === 'en' ? EN_ORIGIN : DE_ORIGIN;
  const path = PAGE_PATHS[key][locale];
  return path === '/' ? `${origin}/` : `${origin}${path}`;
}
