'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

const TEXT = {
  de: {
    subtitle: 'Neues Passwort festlegen',
    tooShort: 'Das Passwort muss mindestens 8 Zeichen lang sein.',
    mismatch: 'Die Passwörter stimmen nicht überein.',
    changed: 'Ihr Passwort wurde geändert. Sie werden weitergeleitet …',
    checking: 'Link wird geprüft …',
    invalid: 'Dieser Link ist ungültig oder abgelaufen. Bitte fordern Sie einen neuen Link zum Zurücksetzen des Passworts an.',
    back: '→ Zurück zum Login',
    newPw: 'Neues Passwort *', confirmPw: 'Passwort bestätigen *', ph: 'Mindestens 8 Zeichen',
    save: 'Neues Passwort speichern',
  },
  en: {
    subtitle: 'Set a new password',
    tooShort: 'The password must be at least 8 characters long.',
    mismatch: 'The passwords do not match.',
    changed: 'Your password has been changed. Redirecting …',
    checking: 'Checking link …',
    invalid: 'This link is invalid or has expired. Please request a new password reset link.',
    back: '→ Back to sign in',
    newPw: 'New password *', confirmPw: 'Confirm password *', ph: 'At least 8 characters',
    save: 'Save new password',
  },
};

export function ResetPasswordForm({ locale = 'de', homeHref = '/' }: { locale?: 'de' | 'en'; homeHref?: string }) {
  const t = TEXT[locale];
  const router = useRouter();
  const [sessionReady, setSessionReady] = useState<'checking' | 'ready' | 'invalid'>('checking');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const supabase = createClient();

    // The recovery link Supabase emails the user carries a one-time token in the URL;
    // the client library exchanges it for a session automatically and fires this event.
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setSessionReady('ready');
    });

    // If the event already fired before this listener attached, a session will already
    // be present — treat that as ready too rather than waiting forever.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setSessionReady('ready');
    });

    const timeout = setTimeout(() => {
      setSessionReady(current => (current === 'checking' ? 'invalid' : current));
    }, 4000);

    return () => {
      listener.subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    if (password.length < 8) { setStatus('error'); setMessage(t.tooShort); return; }
    if (password !== confirmPassword) { setStatus('error'); setMessage(t.mismatch); return; }

    setStatus('loading');
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setStatus('error'); setMessage(error.message);
    } else {
      setStatus('ok'); setMessage(t.changed);
      setTimeout(() => router.push('/dashboard'), 1500);
    }
  };

  return (
    <div style={{
      minHeight: '75vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '3rem 1.5rem', background: 'var(--paper)',
    }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link href={homeHref} style={{ textDecoration: 'none' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--ink)' }}>
              {locale === 'en' ? 'search-engines' : 'suchmaschinen'}<span style={{ color: 'var(--emerald)' }}>.pro</span>
            </div>
          </Link>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
            {t.subtitle}
          </div>
        </div>

        <div className="card" style={{ padding: '2.25rem' }}>
          {sessionReady === 'checking' && (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{t.checking}</p>
          )}

          {sessionReady === 'invalid' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ background: '#fce8e8', border: '1px solid #f5a5a5', padding: '1rem', fontSize: '0.85rem', color: '#b02020', borderRadius: 8, marginBottom: '1.25rem' }}>
                {t.invalid}
              </div>
              <Link href="/auth" style={{ color: 'var(--emerald)', fontSize: '0.85rem', fontWeight: 600 }}>
                {t.back}
              </Link>
            </div>
          )}

          {sessionReady === 'ready' && (
            status === 'ok' ? (
              <div style={{ background: 'var(--emerald-pale)', border: '1px solid var(--emerald)', padding: '1.5rem', textAlign: 'center', borderRadius: 8 }}>
                <p style={{ color: 'var(--ink)', lineHeight: 1.6 }}>{message}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                <div>
                  <label className="form-label" htmlFor="rp-new">{t.newPw}</label>
                  <input id="rp-new" required type="password" autoComplete="new-password" value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="form-input" placeholder={t.ph}
                    minLength={8} />
                </div>
                <div>
                  <label className="form-label" htmlFor="rp-confirm">{t.confirmPw}</label>
                  <input id="rp-confirm" required type="password" autoComplete="new-password" value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="form-input" placeholder={t.ph}
                    minLength={8} />
                </div>

                {status === 'error' && (
                  <div style={{ background: '#fce8e8', border: '1px solid #f5a5a5', padding: '0.75rem', fontSize: '0.85rem', color: '#b02020', borderRadius: 8 }}>
                    {message}
                  </div>
                )}

                <button type="submit" disabled={status === 'loading'} className="btn-primary" style={{
                  justifyContent: 'center', opacity: status === 'loading' ? 0.7 : 1,
                  cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                }}>
                  {status === 'loading' ? <span className="spinner" aria-label="…" /> : t.save}
                </button>
              </form>
            )
          )}
        </div>
      </div>
    </div>
  );
}
