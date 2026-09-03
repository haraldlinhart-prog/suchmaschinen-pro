import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isAdminEmail } from '@/lib/supabase/admin';
import { refreshAccessToken, deleteGa4Property } from '@/lib/google/analytics';
import { createServiceClient } from '@/lib/supabase/service';

export const maxDuration = 60;

// One-off cleanup (see chat 03.09.26): deletes the 9 GA4 properties confirmed by
// ga-cleanup-scan to be empty duplicates of a sibling property that does have data.
const TO_DELETE = [
  'properties/450696138', // ZMR Services (dup of 450764730)
  'properties/474648937', // Amerikanische-LLC.de (dup of 474736703)
  'properties/474729025', // firmensanierung.online (dup of 474676311)
  'properties/474693381', // Lighthouse-Trust.net (dup of 476578485)
  'properties/474693573', // Einfach-LLC.de (dup of 474666113)
  'properties/474748611', // German Nominee Services (dup of 474664702)
  'properties/474695216', // Company-Formation.us (dup of 474746013)
  'properties/474664109', // Company-Formation.us (dup of 474746013)
  'properties/511341612', // PAN21.com (dup of 477248119)
];

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: 'Nicht berechtigt.' }, { status: 403 });
  }

  const service = createServiceClient();
  const { data: website } = await service
    .from('sq_websites')
    .select('ga_refresh_token')
    .not('ga_refresh_token', 'is', null)
    .limit(1)
    .single();
  if (!website?.ga_refresh_token) return NextResponse.json({ error: 'Kein verbundener GA-Zugang.' }, { status: 404 });

  const accessToken = await refreshAccessToken(website.ga_refresh_token);

  const results: { property: string; status: 'deleted' | 'error'; detail?: string }[] = [];
  for (const property of TO_DELETE) {
    try {
      await deleteGa4Property(accessToken, property);
      results.push({ property, status: 'deleted' });
    } catch (e) {
      results.push({ property, status: 'error', detail: e instanceof Error ? e.message : String(e) });
    }
    await new Promise(r => setTimeout(r, 300));
  }

  return NextResponse.json({ results });
}
