import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const { websiteId, propertyId, propertyName } = body || {};
  if (!websiteId || !propertyId) return NextResponse.json({ error: 'websiteId und propertyId sind erforderlich.' }, { status: 400 });

  const { error } = await supabase
    .from('sq_websites')
    .update({ ga_property_id: propertyId, ga_property_name: propertyName || null })
    .eq('id', websiteId)
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
