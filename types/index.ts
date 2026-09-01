export type WebsiteStatus = 'pending' | 'analyzing' | 'active' | 'paused';

export interface Website {
  id: string;
  created_at: string;
  user_id: string;
  domain: string;
  label: string | null;
  status: WebsiteStatus;
  notes: string | null;
}

export const STATUS_LABELS: Record<WebsiteStatus, string> = {
  pending: 'Ausstehend',
  analyzing: 'Wird analysiert',
  active: 'Aktiv',
  paused: 'Pausiert',
};
