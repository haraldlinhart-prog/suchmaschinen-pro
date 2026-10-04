/**
 * Posts a published article to the Instagram professional account linked to the
 * site's Facebook Page (Graph API, "Instagram API with Facebook Login").
 *
 * Uses the same Page Access Token as postToFacebook.ts; it additionally needs the
 * `instagram_basic` and `instagram_content_publish` permissions.
 *
 * Instagram has no link posts: the post is the article image plus a caption.
 * Links in captions are not clickable, so the article URL is written out readable.
 * The image must be a publicly reachable JPEG (our video.pan21.com mirror is).
 */

interface InstagramPostOptions {
  igUserId: string;
  pageToken: string;
  imageUrl: string;
  articleTitle: string;
  articleUrl: string;
  teaser?: string | null;
  keyword?: string | null;
  domain: string;
  language?: string;
}

export interface InstagramPostResult {
  success: boolean;
  mediaId?: string;
  error?: string;
}

const GRAPH = 'https://graph.facebook.com/v21.0';
const CAPTION_MAX = 2200; // Instagram's hard caption limit

/** Turns a phrase into a hashtag body: letters/digits only, words in CamelCase. */
function toTag(phrase: string): string {
  return phrase
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');
}

/** 3–5 hashtags: the keyword as one tag, its longer single words, and the site brand. */
export function buildHashtags(keyword: string | null | undefined, domain: string): string[] {
  const tags: string[] = [];
  const add = (t: string) => {
    if (t.length >= 3 && t.length <= 30 && !/^\d+$/.test(t) && !tags.some(x => x.toLowerCase() === t.toLowerCase())) tags.push(t);
  };
  if (keyword) {
    add(toTag(keyword));
    for (const w of keyword.split(/[^\p{L}\p{N}]+/u)) if (w.length >= 5) add(toTag(w));
  }
  const brand = domain.replace(/^www\./, '').split('.')[0];
  add(toTag(brand));
  return tags.slice(0, 5).map(t => `#${t}`);
}

function buildCaption(o: InstagramPostOptions): string {
  const en = (o.language || 'de').startsWith('en');
  const readMore = en ? 'Read the full article:' : 'Den ganzen Artikel lesen:';
  const body = (o.teaser && o.teaser.trim()) || o.articleTitle;
  const tags = buildHashtags(o.keyword, o.domain).join(' ');
  const tail = `\n\n${readMore}\n${o.articleUrl}${tags ? `\n\n${tags}` : ''}`;
  const head = `${o.articleTitle}\n\n${body === o.articleTitle ? '' : body}`.trim();
  const room = CAPTION_MAX - tail.length;
  return (head.length > room ? `${head.slice(0, room - 1).trimEnd()}…` : head) + tail;
}

async function graph(path: string, params: Record<string, string>, method: 'GET' | 'POST' = 'POST') {
  const qs = new URLSearchParams(params).toString();
  const res = method === 'GET'
    ? await fetch(`${GRAPH}/${path}?${qs}`)
    : await fetch(`${GRAPH}/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: qs });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error?.message ?? `HTTP ${res.status}`);
  return data;
}

export async function postToInstagram(opts: InstagramPostOptions): Promise<InstagramPostResult> {
  const { igUserId, pageToken, imageUrl } = opts;
  try {
    // 1) Create the media container — Instagram downloads the image here.
    const container = await graph(`${encodeURIComponent(igUserId)}/media`, {
      image_url: imageUrl,
      caption: buildCaption(opts),
      access_token: pageToken,
    });

    // 2) Wait until the container is processed (usually a few seconds for images).
    for (let i = 0; i < 10; i++) {
      const st = await graph(container.id, { fields: 'status_code,status', access_token: pageToken }, 'GET');
      if (st.status_code === 'FINISHED') break;
      if (st.status_code === 'ERROR' || st.status_code === 'EXPIRED') {
        throw new Error(`Container ${st.status_code}: ${st.status ?? 'unbekannt'}`);
      }
      await new Promise(r => setTimeout(r, 3_000));
    }

    // 3) Publish.
    const published = await graph(`${encodeURIComponent(igUserId)}/media_publish`, {
      creation_id: container.id,
      access_token: pageToken,
    });
    return { success: true, mediaId: published.id };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Unbekannter Fehler';
    console.error('Instagram post failed:', errMsg);
    return { success: false, error: errMsg };
  }
}
