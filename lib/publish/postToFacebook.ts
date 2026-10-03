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
  /** Optional image URL to attach directly as the post's preview thumbnail via
   *  the Graph API's `picture` field. Independent of `link` — Facebook still
   *  links the post/click-through to `articleUrl` regardless of this value. */
  picture?: string | null;
}

export interface FacebookPostResult {
  success: boolean;
  postId?: string;
  error?: string;
}

export async function postToFacebook(opts: FacebookPostOptions): Promise<FacebookPostResult> {
  const { pageId, pageToken, articleTitle, articleUrl, teaser, picture } = opts;

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
          // `picture` is independent of `link`: it only sets the preview thumbnail
          // Facebook attaches to this post. The post/click-through still points at
          // `link` (the real article URL) regardless of which image is shown here.
          ...(picture ? { picture } : {}),
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
