export type WebsiteStatus = 'pending' | 'analyzing' | 'active' | 'paused';
export type ArticleStatus = 'draft' | 'published';
export type HostingPlatform = 'network' | 'vercel' | 'netlify' | 'apache' | 'wordpress' | 'other';

export interface Website {
  id: string;
  created_at: string;
  user_id: string;
  domain: string;
  label: string | null;
  status: WebsiteStatus;
  notes: string | null;
  github_repo: string | null;
  suggested_keywords: SuggestedKeyword[] | null;
  last_analyzed_at: string | null;
  public_slug: string;
  publish_path: string;
  hosting_platform: HostingPlatform;
  wp_url: string | null;
  wp_username: string | null;
  wp_app_password: string | null;
}

export const HOSTING_LABELS: Record<HostingPlatform, string> = {
  network: 'PAN21-Netzwerk (GitHub + Vercel) — "zuhause bei Mutti"',
  vercel: 'Vercel (andere Domain)',
  netlify: 'Netlify',
  apache: 'Klassischer Webhoster (Apache/.htaccess)',
  wordpress: 'WordPress',
  other: 'Sonstiges / weiß ich nicht',
};

export interface SuggestedKeyword {
  keyword: string;
  rationale: string;
  intent: string;
}

export interface Article {
  id: string;
  created_at: string;
  website_id: string;
  user_id: string;
  keyword: string;
  title: string;
  slug: string;
  meta_description: string | null;
  content_html: string;
  status: ArticleStatus;
  github_path: string | null;
  published_at: string | null;
  published_url: string | null;
}

export const STATUS_LABELS: Record<WebsiteStatus, string> = {
  pending: 'Ausstehend',
  analyzing: 'Wird analysiert',
  active: 'Aktiv',
  paused: 'Pausiert',
};
