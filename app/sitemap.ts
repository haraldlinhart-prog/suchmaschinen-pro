import { MetadataRoute } from 'next';
import { isEnglishHost } from '@/lib/seo';
import { absoluteUrl, type PageKey } from '@/lib/sitePages';

// One sitemap per domain (suchmaschinen.pro → German URLs, search-engines.pro → English
// URLs), each entry with its hreflang alternates on the other domain.
const ENTRIES: { key: PageKey; changeFrequency: 'weekly' | 'monthly'; priority: number }[] = [
  { key: 'home', changeFrequency: 'weekly', priority: 1 },
  { key: 'tour', changeFrequency: 'monthly', priority: 0.8 },
  { key: 'contact', changeFrequency: 'monthly', priority: 0.6 },
  { key: 'auth', changeFrequency: 'monthly', priority: 0.5 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const locale = (await isEnglishHost()) ? 'en' : 'de';
  return ENTRIES.map(e => ({
    url: absoluteUrl(e.key, locale),
    changeFrequency: e.changeFrequency,
    priority: e.priority,
    alternates: { languages: { de: absoluteUrl(e.key, 'de'), en: absoluteUrl(e.key, 'en'), 'x-default': absoluteUrl(e.key, 'de') } },
  }));
}
