// Publish gate against empty articles (27.10.2026). The 17.10. guard only checked that
// content_html was not empty, but 5 articles still went live with nothing but the title:
// Claude's tool answer contained content_html = "<h1>Title" (no closing tag, no text) —
// kaputte-links.de 19.10., rentyourcompany.com 22.10., companyking.de 27.10., impressum-free.de
// 08.10., pan21.de 11.10. Before 17.10. the same failure showed up as the literal text
// "undefined" (gmbh-verkauf.com, site-ok.de). Every publish path goes through publishArticle(),
// which now refuses such an article; requestArticle() checks the same and retries.

/** Generated articles are 700–1000 words; of 1143 published ones the 1st percentile is 618,
 *  and exactly the 9 empty ones are below 400 words or have fewer than 2 H2. */
export const MIN_ARTICLE_WORDS = 400;
export const MIN_ARTICLE_H2 = 2;

/** Body text without image figure and "Passend zum Thema" block. */
export function articleText(html: string): string {
  return (html || '')
    .replace(/<figure[\s\S]*?<\/figure>/gi, ' ')
    .replace(/<!-- sp:related -->[\s\S]*?<!-- \/sp:related -->/g, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function wordCount(html: string): number {
  const text = articleText(html);
  return text ? text.split(' ').length : 0;
}

/** Problems that must block publishing; empty array = fine. */
export function articleProblems(article: { title?: string | null; content_html?: string | null }): string[] {
  const html = article.content_html || '';
  const problems: string[] = [];
  if (!article.title?.trim()) problems.push('kein Titel');
  const words = wordCount(html);
  if (words < MIN_ARTICLE_WORDS) problems.push(`zu kurz (${words} Wörter, mindestens ${MIN_ARTICLE_WORDS})`);
  const body = html.replace(/<!-- sp:related -->[\s\S]*?<!-- \/sp:related -->/g, '');
  const h2 = (body.match(/<h2[\s>]/gi) || []).length;
  if (h2 < MIN_ARTICLE_H2) problems.push(`zu wenige Zwischenüberschriften (${h2} H2, mindestens ${MIN_ARTICLE_H2})`);
  if (/<h1[^>]*>/i.test(html) && !/<\/h1>/i.test(html)) problems.push('H1 nicht geschlossen (Antwort abgeschnitten)');
  if (/\bundefined$/.test(articleText(html))) problems.push('Text endet mit "undefined"');
  return problems;
}

export class ArticleQualityError extends Error {
  constructor(public readonly problems: string[], slug?: string) {
    super(`Artikel${slug ? ` "${slug}"` : ''} nicht veröffentlicht: ${problems.join('; ')}`);
    this.name = 'ArticleQualityError';
  }
}

export function assertPublishable(article: { title?: string | null; content_html?: string | null; slug?: string | null }): void {
  const problems = articleProblems(article);
  if (problems.length) throw new ArticleQualityError(problems, article.slug ?? undefined);
}
