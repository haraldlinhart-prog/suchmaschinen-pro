import { MetadataRoute } from 'next';
import { isEnglishHost } from '@/lib/seo';
import { DE_ORIGIN, EN_ORIGIN } from '@/lib/sitePages';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const origin = (await isEnglishHost()) ? EN_ORIGIN : DE_ORIGIN;
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/dashboard', '/api/'] },
    ],
    sitemap: `${origin}/sitemap.xml`,
  };
}
