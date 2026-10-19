import { NextRequest, NextResponse } from 'next/server';
import { dispatchGscSync, runGscSync } from '@/lib/google/gscSync';

export const maxDuration = 800;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // ?site=<id> = worker for one site; without it = dispatcher for all sites.
  const siteId = req.nextUrl.searchParams.get('site');
  try {
    return NextResponse.json(siteId ? await runGscSync(siteId) : await dispatchGscSync());
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
