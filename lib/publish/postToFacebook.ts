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

export async function postToFacebook(opts: FacebookPostOptions): Promise<FacebookPostResult> {
  const { pageId, pageToken, articleTitle, articleUrl, teaser } = opts;

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
