import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Called by a Supabase Database Webhook on auth.users INSERT.
// Secured with a shared secret so only Supabase can trigger it.
export async function POST(req: NextRequest) {
  try {
    const secret = req.headers.get('x-webhook-secret');
    if (!secret || secret !== process.env.SIGNUP_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const record = payload?.record ?? payload;
    const email: string = record?.email || 'unbekannt';
    const createdAt: string = record?.created_at || new Date().toISOString();

    const resend = new Resend(process.env.RESEND_API_KEY);
    const safeEmail = escapeHtml(email);

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #0b1f1c; padding: 20px; text-align: center;">
          <h1 style="color: #16a578; font-size: 1.4rem; margin: 0;">suchmaschinen.pro</h1>
          <p style="color: rgba(255,255,255,0.7); margin: 5px 0 0; font-size: 0.85rem;">Neue Registrierung</p>
        </div>
        <div style="padding: 30px; background: #f7faf8; border: 1px solid #dbe5e0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; color: #5b6b66; font-size: 0.85rem; width: 140px;">E-Mail:</td><td style="padding: 8px 0; font-weight: 500;">${safeEmail}</td></tr>
            <tr><td style="padding: 8px 0; color: #5b6b66; font-size: 0.85rem;">Zeitpunkt:</td><td style="padding: 8px 0;">${escapeHtml(createdAt)}</td></tr>
          </table>
        </div>
        <div style="padding: 16px; background: #eef3f0; text-align: center; font-size: 0.75rem; color: #8a9a94;">
          Automatische Benachrichtigung von suchmaschinen.pro (neue Registrierung, noch nicht bestätigt)
        </div>
      </div>
    `;

    const { error: sendError } = await resend.emails.send({
      from: 'suchmaschinen.pro <noreply@pan21.com>',
      to: 'suchmaschinen@pan21.com',
      subject: `Neue Registrierung: ${email}`,
      html,
    });

    if (sendError) {
      console.error('Resend error (notify-signup):', sendError);
      return NextResponse.json({ error: 'E-Mail konnte nicht gesendet werden' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('notify-signup route error:', err);
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 });
  }
}
