import { createServiceClient } from '@/lib/supabase/service';
import { refreshAccessToken, GoogleTokenInvalidError } from '@/lib/google/analytics';

// Each website stores its own GA refresh token, but for one person they all belong to
// the same Google account. When a site's token has died (expired/revoked), try the
// person's other, more recently connected tokens and adopt the first one that still
// works — so reconnecting Google once on any site heals every site (chat 26.09.26).
export async function getGaAccessToken(website: { id: string; ga_refresh_token: string | null }, userId: string): Promise<string> {
  if (website.ga_refresh_token) {
    try {
      return await refreshAccessToken(website.ga_refresh_token);
    } catch (e) {
      if (!(e instanceof GoogleTokenInvalidError)) throw e;
    }
  }

  const service = createServiceClient();
  const { data: others } = await service
    .from('sq_websites')
    .select('ga_refresh_token, ga_connected_at')
    .eq('user_id', userId)
    .not('ga_refresh_token', 'is', null)
    .order('ga_connected_at', { ascending: false });

  const tried = new Set<string>(website.ga_refresh_token ? [website.ga_refresh_token] : []);
  for (const row of others || []) {
    const token: string = row.ga_refresh_token;
    if (tried.has(token)) continue;
    tried.add(token);
    if (tried.size > 6) break; // older ones are almost certainly dead too
    try {
      const accessToken = await refreshAccessToken(token);
      await service.from('sq_websites').update({ ga_refresh_token: token }).eq('id', website.id);
      return accessToken;
    } catch (e) {
      if (!(e instanceof GoogleTokenInvalidError)) throw e;
    }
  }

  throw new GoogleTokenInvalidError('keine gültige Verbindung');
}

export const RECONNECT_MESSAGE =
  'Die Verbindung zu Google Analytics ist abgelaufen. Bitte einmal neu verbinden – danach funktionieren auch Ihre anderen Websites wieder.';
