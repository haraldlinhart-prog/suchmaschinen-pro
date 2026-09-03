import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isAdminEmail } from '@/lib/supabase/admin';

// One-off (see chat 03.09.26): creates the Stripe Price for the new Premium plan
// (49 EUR/month) using the STRIPE_SECRET_KEY already configured on this project.
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: 'Nicht berechtigt.' }, { status: 403 });
  }

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return NextResponse.json({ error: 'STRIPE_SECRET_KEY fehlt.' }, { status: 500 });

  const body = new URLSearchParams({
    unit_amount: '4900',
    currency: 'eur',
    'recurring[interval]': 'month',
    'product_data[name]': 'suchmaschinen.pro Premium',
  });

  const res = await fetch('https://api.stripe.com/v1/prices', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  const data = await res.json();
  if (!res.ok) return NextResponse.json({ error: data.error?.message || 'Stripe-Fehler' }, { status: 502 });

  return NextResponse.json({ priceId: data.id, product: data.product, amount: data.unit_amount });
}
