import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@/lib/supabase/server';

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function looksHuman(text: string) {
  const noSpaces = text.replace(/\s/g, '');
  return !(noSpaces.length > 60 && noSpaces.length === text.length);
}

function isGibberish(str: string) {
  const trimmed = (str || '').trim();
  if (/^[a-zA-ZäöüÄÖÜß]{10,40}$/.test(trimmed) && /[a-zäöüß]/.test(trimmed) && /[A-ZÄÖÜ]/.test(trimmed)) {
    return true;
  }
  const words = (str || '').split(/\s+/).filter(w => w.length >= 6);
  const vowelChars = 'aeiouyAEIOUYäöüÄÖÜàáâãåèéêëìíîïòóôõùúûýÀÁÂÃÅÈÉÊËÌÍÎÏÒÓÔÕÙÚÛÝ';
  for (const word of words) {
    const letters = word.replace(/[^a-zA-ZäöüÄÖÜßàáâãåèéêëìíîïòóôõùúûýÀÁÂÃÅÈÉÊËÌÍÎÏÒÓÔÕÙÚÛÝ]/g, '');
    if (letters.length < 6) continue;
    let vowels = 0;
    for (const ch of letters) if (vowelChars.includes(ch)) vowels++;
    const vowelRatio = vowels / letters.length;
    let transitions = 0;
    for (let i = 1; i < letters.length; i++) {
      const prevUpper = letters[i - 1] === letters[i - 1].toUpperCase() && letters[i - 1] !== letters[i - 1].toLowerCase();
      const curUpper = letters[i] === letters[i].toUpperCase() && letters[i] !== letters[i].toLowerCase();
      if (prevUpper !== curUpper) transitions++;
    }
    const transitionRatio = transitions / (letters.length - 1);
    const vowelThreshold = letters.length >= 14 ? 0.28 : (letters.length >= 11 ? 0.22 : 0.16);
    if (vowelRatio < vowelThreshold && transitionRatio > 0.3) return true;
  }
  if (/\S{61,}/.test(str || '')) return true;
  return false;
}

export async function POST(req: NextRequest) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { name, email, message, website, elapsed } = await req.json();

    if (isGibberish(message) || isGibberish(name)) { return NextResponse.json({ ok: true }); }
    if (website) return NextResponse.json({ ok: true });
    if (typeof elapsed !== 'number' || elapsed < 3000) {
      return NextResponse.json({ error: 'Bitte versuchen Sie es erneut.' }, { status: 400 });
    }
    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Pflichtfelder fehlen' }, { status: 400 });
    }
    if (name.length > 100 || !looksHuman(name) || !looksHuman(message)) {
      return NextResponse.json({ error: 'Bitte versuchen Sie es erneut.' }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Ungültige E-Mail-Adresse.' }, { status: 400 });
    }

    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeMessage = escapeHtml(message).replace(/\n/g, '<br>');

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #0b1f1c; padding: 20px; text-align: center;">
          <h1 style="color: #16a578; font-size: 1.4rem; margin: 0;">suchmaschinen.pro</h1>
          <p style="color: rgba(255,255,255,0.7); margin: 5px 0 0; font-size: 0.85rem;">Neue Kontaktanfrage</p>
        </div>
        <div style="padding: 30px; background: #f7faf8; border: 1px solid #dbe5e0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; color: #5b6b66; font-size: 0.85rem; width: 120px;">Name:</td><td style="padding: 8px 0; font-weight: 500;">${safeName}</td></tr>
            <tr><td style="padding: 8px 0; color: #5b6b66; font-size: 0.85rem;">E-Mail:</td><td style="padding: 8px 0;"><a href="mailto:${safeEmail}" style="color: #0b1f1c;">${safeEmail}</a></td></tr>
          </table>
          <hr style="border: none; border-top: 1px solid #dbe5e0; margin: 20px 0;">
          <h3 style="color: #0b1f1c; margin-bottom: 10px;">Nachricht:</h3>
          <p style="line-height: 1.7; color: #333; white-space: pre-line;">${safeMessage}</p>
        </div>
        <div style="padding: 16px; background: #eef3f0; text-align: center; font-size: 0.75rem; color: #8a9a94;">
          Diese Anfrage wurde über suchmaschinen.pro gesendet
        </div>
      </div>
    `;

    const { error: sendError } = await resend.emails.send({
      from: 'suchmaschinen.pro <noreply@pan21.com>',
      to: 'suchmaschinen@pan21.com',
      replyTo: email,
      subject: 'Kontaktanfrage suchmaschinen.pro',
      html,
    });

    if (sendError) {
      console.error('Resend error:', sendError);
      return NextResponse.json({ error: 'E-Mail konnte nicht gesendet werden' }, { status: 500 });
    }

    try {
      const supabase = await createClient();
      await supabase.from('sq_contact_requests').insert({ name, email, message });
    } catch { /* Non-critical */ }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Contact route error:', err);
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 });
  }
}
