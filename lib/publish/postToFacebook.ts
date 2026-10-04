/**
 * Posts a published article to a Facebook Page via the Graph API.
 *
 * Requires a Page Access Token with the `pages_manage_posts` permission.
 * The token is stored per-website in sq_websites.facebook_page_token.
 *
 * Facebook generates a link-preview automatically from the article URL's
 * Open Graph tags — we don't need to upload the image manually.
 */

interface FacebookPostOptions {
  pageId: string;
  pageToken: string;
  articleTitle: string;
  articleUrl: string;
  /** Optional 2–3 sentence teaser shown above the link card. */
  teaser?: string | null;
}

export interface FacebookPostResult {
  success: boolean;
  postId?: string;
  error?: string;
}

/**
 * Lässt Facebook die Artikelseite VOR dem Posten auslesen ("Erneut scrapen" per Graph API)
 * und wiederholt das, bis Titel und Bild ankommen. Hintergrund (04.10.26, pan21.com):
 * Facebooks Crawler bekam sporadisch "Could Not Connect To Server" (Antwortcode 418),
 * speicherte dieses Ergebnis zwischen, und der Beitrag erschien nur mit "www.pan21.com"
 * ohne Bild. Ein erneutes Scrapen kurz danach lieferte alles korrekt.
 * Scheitert das Vorwärmen endgültig, wird trotzdem gepostet (wie bisher) – nur geloggt.
 */
async function warmUpLinkPreview(url: string, token: string, attempts = 4, delayMs = 15_000): Promise<boolean> {
  for (let i = 1; i <= attempts; i++) {
    try {
      const res = await fetch(
        `https://graph.facebook.com/v21.0/?id=${encodeURIComponent(url)}&scrape=true&access_token=${encodeURIComponent(token)}`,
        { method: 'POST' }
      );
      const data = await res.json();
      const hasImage = Array.isArray(data?.image) && data.image.length > 0;
      const hasRealTitle = typeof data?.title === 'string' && data.title.trim() !== '' && !/^(https?:\/\/)?(www\.)?[a-z0-9.-]+\.[a-z]{2,}\/?$/i.test(data.title.trim());
      if (res.ok && hasImage && hasRealTitle) return true;
      console.warn(`Facebook scrape attempt ${i}/${attempts} for ${url} incomplete:`, data?.error?.message ?? { title: data?.title, hasImage });
    } catch (err) {
      console.warn(`Facebook scrape attempt ${i}/${attempts} for ${url} failed:`, err instanceof Error ? err.message : err);
    }
    if (i < attempts) await new Promise(r => setTimeout(r, delayMs));
  }
  console.error(`Facebook link preview for ${url} still incomplete after ${attempts} attempts — posting anyway.`);
  return false;
}

export async function postToFacebook(opts: FacebookPostOptions): Promise<FacebookPostResult> {
  const { pageId, pageToken, articleTitle, articleUrl, teaser } = opts;

  await warmUpLinkPreview(articleUrl, pageToken);

  // Build the message: teaser (if any) + link. Facebook generates the link
  // preview card automatically from Open Graph tags on the article page.
  const message = teaser
    ? `${teaser.trim()}\n\n${articleUrl}`
    : `${articleTitle}\n\n${articleUrl}`;

  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${encodeURIComponent(pageId)}/feed`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          link: articleUrl,
          access_token: pageToken,
          // Deliberately no `picture`/`name`/`thumbnail`/`description` fields here:
          // the Graph API rejects the ENTIRE post with error #100 ("Only owners of
          // the URL have the ability to specify the picture, name, thumbnail or
          // description params") unless the domain is verified as an Owned Domain
          // in Facebook Business settings — confirmed live on himassage.net today.
          // The preview image comes purely from Facebook's own scraper reading
          // the article page's og:image meta tag.
        }),
      }
    );

    const data = await res.json();

    if (!res.ok || data.error) {
      const errMsg = data.error?.message ?? `HTTP ${res.status}`;
      console.error('Facebook post failed:', errMsg);
      return { success: false, error: errMsg };
    }

    return { success: true, postId: data.id };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Unbekannter Fehler';
    console.error('Facebook post exception:', errMsg);
    return { success: false, error: errMsg };
  }
}
