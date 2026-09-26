import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isAdminEmail } from '@/lib/supabase/admin';
import { runGscSync } from '@/lib/google/gscSync';

export const maxDuration = 800;

// Run the daily Search Console sync on demand (admin only).
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdminEmail(user.email)) return NextResponse.json({ error: 'Nicht berechtigt.' }, { status: 403 });
  try {
    return NextResponse.json(await runGscSync());
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
