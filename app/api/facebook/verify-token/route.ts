import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Validates a Facebook Page Access Token before it's saved to sq_websites.
 *
 * Catches the two failure modes that silently broke Facebook posting for
 * turnkey-companies.com (01.10.2026):
 *  1. A short-lived USER token pasted instead of a PAGE token (debug_token's
 *     `type` field, and a missing `profile_id`, reveal this).
 *  2. A token that will expire soon / has already expired (`expires_at`).
 * It also confirms the token actually authorizes the specific pageId being
 * saved — not just some other page the same Facebook user manages — and
 * that it carries pages_manage_posts, without which postToFacebook.ts's
 * POST to /feed fails.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });

    const { pageId, token } = await req.json();
    if (!pageId || !token) {
      return NextResponse.json({ error: 'pageId und token sind erforderlich.' }, { status: 400 });
    }

    const debugRes = await fetch(
      `https://graph.facebook.com/debug_token?input_token=${encodeURIComponent(token)}&access_token=${encodeURIComponent(token)}`
    );
    const debugData = await debugRes.json();

    if (debugData.error) {
      return NextResponse.json({
        ok: false,
        issues: [`Token ungültig: ${debugData.error.message ?? 'unbekannter Fehler'}`],
      });
    }

    const info = debugData.data;
    const issues: string[] = [];

    if (info.type !== 'PAGE') {
      issues.push(
        `Das ist ein ${info.type === 'USER' ? 'persönliches Nutzer-Token' : `${info.type}-Token`}, kein Page-Token. ` +
        `Facebook braucht für automatisches Posten ein Page Access Token, nicht Ihr eigenes Login-Token.`
      );
    } else if (info.profile_id && String(info.profile_id) !== String(pageId)) {
      issues.push(`Dieses Token gehört zu Seite ${info.profile_id}, nicht zur hinterlegten Seite ${pageId}.`);
    }

    const scopes: string[] = info.scopes ?? [];
    if (!scopes.includes('pages_manage_posts')) {
      issues.push('Dem Token fehlt die Berechtigung "pages_manage_posts" — ohne die kann nicht gepostet werden.');
    }

    // expires_at === 0 means "never expires" (the normal, desired case for a Page token
    // obtained via a long-lived User token or a System User). A positive value in the
    // past means it's already dead; in the near future, it'll die again soon like the
    // one that broke turnkey-companies.com.
    const now = Math.floor(Date.now() / 1000);
    let expiryNote = 'läuft nie ab';
    if (info.expires_at && info.expires_at > 0) {
      if (info.expires_at <= now) {
        issues.push('Dieses Token ist bereits abgelaufen.');
        expiryNote = 'bereits abgelaufen';
      } else {
        const daysLeft = Math.round((info.expires_at - now) / 86400);
        expiryNote = `läuft in ca. ${daysLeft} Tag(en) ab`;
        if (daysLeft <= 7) {
          issues.push(`Dieses Token läuft in nur ${daysLeft} Tag(en) ab — kein dauerhaftes Token.`);
        }
      }
    }

    // Independent of debug_token's own read: actually try the page with this token,
    // since that's the call that matters (and confirms Harry/the token really has
    // access to THIS page, including Business Portfolio pages not under /me/accounts).
    let pageName: string | null = null;
    if (issues.length === 0 || info.type === 'PAGE') {
      const pageRes = await fetch(
        `https://graph.facebook.com/v21.0/${encodeURIComponent(pageId)}?fields=name&access_token=${encodeURIComponent(token)}`
      );
      const pageData = await pageRes.json();
      if (pageData.error) {
        issues.push(`Zugriff auf die Seite fehlgeschlagen: ${pageData.error.message ?? 'unbekannter Fehler'}`);
      } else {
        pageName = pageData.name ?? null;
      }
    }

    // Instagram (optional, 04.10.2026): is a professional IG account linked to this
    // page, and may this token publish to it? Never blocks saving the Facebook part —
    // the result only decides whether the dashboard offers "also post to Instagram".
    let instagram: { id: string; username: string | null } | null = null;
    let instagramIssue: string | null = null;
    if (pageName !== null) {
      const igRes = await fetch(
        `https://graph.facebook.com/v21.0/${encodeURIComponent(pageId)}?fields=instagram_business_account{id,username}&access_token=${encodeURIComponent(token)}`
      );
      const igData = await igRes.json();
      const acc = igData?.instagram_business_account;
      if (acc?.id) {
        instagram = { id: String(acc.id), username: acc.username ?? null };
        const missing = ['instagram_basic', 'instagram_content_publish'].filter(s => !scopes.includes(s));
        if (missing.length) {
          instagramIssue = `Für Instagram fehlen dem Token die Berechtigungen: ${missing.join(', ')}.`;
        }
      } else if (igData?.error) {
        instagramIssue = `Instagram-Verknüpfung nicht lesbar: ${igData.error.message ?? 'unbekannter Fehler'}`;
      }
    }

    return NextResponse.json({
      ok: issues.length === 0,
      issues,
      pageName,
      instagram,
      instagramReady: !!instagram && !instagramIssue,
      instagramIssue,
      type: info.type,
      scopes,
      expiryNote,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unbekannter Fehler bei der Token-Prüfung.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
