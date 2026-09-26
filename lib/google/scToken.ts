import { createServiceClient } from '@/lib/supabase/service';
import { refreshAccessToken } from '@/lib/google/searchconsole';

// Each admin connects their own Google Search Console (chat 26.09.26: Martin has his own
// websites and his own Search Console). Tokens live in sq_admin_tokens under
// "search_console:<user id>"; the legacy "search_console" row stays Harry's for the
// network-wide scan tools.

export const scKey = (userId: string) => `search_console:${userId}`;

export async function getScRefreshToken(userId: string): Promise<string | null> {
  const service = createServiceClient();
  const { data } = await service.from('sq_admin_tokens').select('refresh_token').eq('key', scKey(userId)).maybeSingle();
  return data?.refresh_token || null;
}

export async function getScAccessToken(userId: string): Promise<string | null> {
  const token = await getScRefreshToken(userId);
  return token ? refreshAccessToken(token) : null;
}
