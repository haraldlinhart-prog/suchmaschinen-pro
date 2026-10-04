/**
 * schema.org JSON-LD for the static pages we commit into customer repos (04.10.2026:
 * published articles had no structured data at all). Pure functions — no I/O.
 */

/** Serializes JSON-LD for an inline <script>. Titles/descriptions are AI-generated,
 *  so "<" is escaped to keep e.g. "</script>" from breaking out of the tag. */
export function jsonLdScript(data: unknown): string {
  return `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;
}

/** Google recommends headlines of at most 110 characters. */
function truncateHeadline(title: string, max = 110): string {
  const chars = Array.from(title.trim());
  if (chars.length <= max) return chars.join('');
  return `${chars.slice(0, max - 1).join('').trimEnd()}…`;
}

export interface ArticleJsonLdInput {
  title: string;
  metaDescription: string;
  lang: string;
  /** Canonical article URL. */
  canonical: string;
  /** Site origin without trailing slash, e.g. https://www.site-ok.de */
  origin: string;
  /** Site name (the customer's domain — never a hardcoded brand). */
  siteName: string;
  /** Blog index URL (the <publish_path>/ index.html we generate), for the breadcrumb. */
  indexUrl: string;
  datePublished: string;
  dateModified: string;
  imageUrl?: string | null;
}

export function buildArticleJsonLd(i: ArticleJsonLdInput): string {
  const organization = { '@type': 'Organization', name: i.siteName, url: `${i.origin}/` };
  const posting: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: truncateHeadline(i.title),
    ...(i.metaDescription.trim() ? { description: i.metaDescription.trim() } : {}),
    inLanguage: i.lang,
    datePublished: i.datePublished,
    dateModified: i.dateModified,
    mainEntityOfPage: { '@type': 'WebPage', '@id': i.canonical },
    url: i.canonical,
    ...(i.imageUrl ? { image: i.imageUrl } : {}),
    author: organization,
    publisher: organization,
  };
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: i.siteName, item: `${i.origin}/` },
      { '@type': 'ListItem', position: 2, name: 'News', item: i.indexUrl },
      { '@type': 'ListItem', position: 3, name: truncateHeadline(i.title), item: i.canonical },
    ],
  };
  return `${jsonLdScript(posting)}\n${jsonLdScript(breadcrumb)}`;
}

/** CollectionPage for the generated <publish_path>/index.html listing. */
export function buildIndexJsonLd(i: { canonical: string; origin: string; siteName: string; lang: string; name: string }): string {
  return jsonLdScript({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: i.name,
    url: i.canonical,
    inLanguage: i.lang,
    isPartOf: { '@type': 'WebSite', name: i.siteName, url: `${i.origin}/` },
  });
}
