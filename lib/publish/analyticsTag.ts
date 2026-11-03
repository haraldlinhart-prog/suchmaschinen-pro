// Google tags for the static pages this tool writes (articles, news index); a site's own
// layout doesn't reach them. Key: domain without "www.". Sites not listed stay tag-free.
const GOOGLE_TAGS: Record<string, string> = {
  'webmaster.plus': 'G-L1CSCE8539',
};

/** The tag to append to <head>, with a leading line break; empty for sites without a tag. */
export function analyticsTagFor(domain: string): string {
  const id = GOOGLE_TAGS[domain.toLowerCase().replace(/^www\./, '')];
  if (!id) return '';
  return `
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${id}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', '${id}');
</script>`;
}
