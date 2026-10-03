import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { absoluteUrl, ENGLISH_HOSTS, type Locale, type PageKey } from '@/lib/sitePages';

/** Set by middleware.ts: 'en' for search-engines.pro and the /en pages. */
export async function getLocale(): Promise<Locale> {
  return (await headers()).get('x-locale') === 'en' ? 'en' : 'de';
}

export async function isEnglishHost(): Promise<boolean> {
  return ENGLISH_HOSTS.includes(((await headers()).get('host') || '').toLowerCase());
}

/** Link target of the English homepage: "/" on search-engines.pro, "/en" elsewhere
 *  (preview deployments, where "/" is the German homepage). */
export async function englishHomeHref(): Promise<string> {
  return (await isEnglishHost()) ? '/' : '/en';
}

const SITE_NAME: Record<Locale, string> = { de: 'suchmaschinen.pro', en: 'search-engines.pro' };
const OG_IMAGE: Record<Locale, { url: string; alt: string }> = {
  de: { url: 'https://www.suchmaschinen.pro/og-image.png', alt: 'suchmaschinen.pro — Artikel, die Google tatsächlich indexiert.' },
  en: { url: 'https://www.search-engines.pro/og-image-en.png', alt: 'search-engines.pro — Articles Google actually indexes.' },
};

/**
 * Per-page metadata: self-referencing canonical, reciprocal hreflang de/en/x-default
 * across both domains, and Open Graph/Twitter tags with the page's own URL.
 */
export function pageMetadata(
  key: PageKey,
  locale: Locale,
  opts: { title: string; description: string; absoluteTitle?: boolean; noindex?: boolean },
): Metadata {
  const url = absoluteUrl(key, locale);
  const fullTitle = opts.absoluteTitle ? opts.title : `${opts.title} | ${SITE_NAME[locale]}`;
  return {
    title: opts.absoluteTitle ? { absolute: opts.title } : opts.title,
    description: opts.description,
    alternates: {
      canonical: url,
      languages: { de: absoluteUrl(key, 'de'), en: absoluteUrl(key, 'en'), 'x-default': absoluteUrl(key, 'de') },
    },
    openGraph: {
      type: 'website',
      url,
      locale: locale === 'en' ? 'en_US' : 'de_DE',
      alternateLocale: locale === 'en' ? ['de_DE'] : ['en_US'],
      siteName: SITE_NAME[locale],
      title: fullTitle,
      description: opts.description,
      images: [{ url: OG_IMAGE[locale].url, width: 1200, height: 630, alt: OG_IMAGE[locale].alt }],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: opts.description,
      images: [OG_IMAGE[locale].url],
    },
    ...(opts.noindex ? { robots: { index: false, follow: true } } : {}),
  };
}
