// Internal linking between a site's articles (chat 26.09.26): new articles link to
// related older ones, and (Premium) related older articles get a link to the new one.

const STOP = new Set(['der', 'die', 'das', 'und', 'oder', 'in', 'im', 'für', 'fur', 'mit', 'von', 'zu', 'zum', 'zur', 'ein', 'eine', 'einer', 'eines', 'den', 'dem', 'des', 'wie', 'was', 'ist', 'bei', 'auf', 'an', 'als', 'aus', 'so', 'sie', 'ihr', 'ihre', 'ihrer', 'nach', 'vs', 'the', 'and', 'of', 'to', 'a']);

export function tokens(text: string): Set<string> {
  return new Set(
    text.toLowerCase()
      .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
      .split(/[^a-z0-9]+/)
      .filter(w => w.length > 2 && !STOP.has(w))
      // crude stemming so "abwickeln"/"abwicklung", "gmbh"/"gmbhs" meet
      .map(w => w.slice(0, 6))
  );
}

export interface LinkTarget { id: string; title: string; keyword: string; url: string }

/** Most related articles by shared keyword/title stems, best first. */
export function relatedArticles(keyword: string, title: string, candidates: LinkTarget[], n = 3): LinkTarget[] {
  const mine = tokens(`${keyword} ${title}`);
  return candidates
    .map(c => {
      const theirs = tokens(`${c.keyword} ${c.title}`);
      let shared = 0;
      for (const t of theirs) if (mine.has(t)) shared++;
      return { c, score: shared / Math.sqrt(Math.max(1, theirs.size)) };
    })
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .map(x => x.c);
}

const BLOCK_START = '<!-- sp:related -->';
const BLOCK_END = '<!-- /sp:related -->';

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Adds (or extends) a "Passend zum Thema" block at the end of an article. Idempotent per URL. */
export function addRelatedLink(contentHtml: string, target: { title: string; url: string }): string {
  if (contentHtml.includes(`href="${target.url}"`)) return contentHtml;
  const li = `<li><a href="${esc(target.url)}">${esc(target.title)}</a></li>`;
  const s = contentHtml.indexOf(BLOCK_START);
  if (s !== -1) {
    const endUl = contentHtml.indexOf('</ul>', s);
    if (endUl !== -1) return contentHtml.slice(0, endUl) + li + contentHtml.slice(endUl);
  }
  return `${contentHtml}\n${BLOCK_START}<h2>Passend zum Thema</h2><ul>${li}</ul>${BLOCK_END}`;
}
