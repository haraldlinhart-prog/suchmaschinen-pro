'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';
import { createClient } from '@/lib/supabase/client';

const HCAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY || '';

function isSpamEmail(email: string): boolean {
  const at = email.indexOf('@');
  if (at === -1) return false;
  const local = email.slice(0, at);
  const domain = email.slice(at + 1).toLowerCase();
  if (domain !== 'gmail.com' && domain !== 'googlemail.com') return false;
  const dots = (local.match(/\./g) || []).length;
  return dots >= 4 && dots / local.length > 0.25;
}

declare global {
  interface Window {
    hcaptcha?: {
      render: (container: HTMLElement, params: Record<string, unknown>) => string;
      reset: (widgetId?: string) => void;
      getResponse: (widgetId?: string) => string;
    };
  }
}

function AuthContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isRegister = searchParams.get('mode') === 'register';

  const [mode, setMode] = useState<'login' | 'register'>(isRegister ? 'register' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const captchaRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | undefined>(undefined);
  const [hcaptchaReady, setHcaptchaReady] = useState(false);

  useEffect(() => {
    if (!hcaptchaReady || !captchaRef.current || !window.hcaptcha) return;
    if (widgetIdRef.current !== undefined) return;
    widgetIdRef.current = window.hcaptcha.render(captchaRef.current, {
      sitekey: HCAPTCHA_SITE_KEY,
      callback: (token: string) => setCaptchaToken(token),
      'expired-callback': () => setCaptchaToken(''),
      'error-callback': () => setCaptchaToken(''),
    });
  }, [hcaptchaReady]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');
    if (!captchaToken) { setStatus('error'); setMessage('Bitte bestätigen Sie das Captcha.'); return; }
    const supabase = createClient();

    if (mode === 'register') {
      if (isSpamEmail(email)) { setStatus('error'); setMessage('Registrierung nicht möglich.'); return; }
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { emailRedirectTo: `${window.location.origin}/dashboard`, captchaToken },
      });
      if (error) {
        setStatus('error'); setMessage(error.message);
        if (window.hcaptcha && widgetIdRef.current !== undefined) window.hcaptcha.reset(widgetIdRef.current);
        setCaptchaToken('');
      }
      else { setStatus('ok'); setMessage('Bitte bestätigen Sie Ihre E-Mail-Adresse. Wir haben Ihnen eine Bestätigungsmail gesendet.'); }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password, options: { captchaToken } });
      if (error) {
        setStatus('error'); setMessage('Ungültige Zugangsdaten. Bitte überprüfen Sie E-Mail und Passwort.');
        if (window.hcaptcha && widgetIdRef.current !== undefined) window.hcaptcha.reset(widgetIdRef.current);
        setCaptchaToken('');
      }
      else { router.push('/dashboard'); }
    }
  };

  return (
    <div style={{
      minHeight: '75vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '3rem 1.5rem', background: 'var(--paper)',
    }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--ink)' }}>
              suchmaschinen<span style={{ color: 'var(--emerald)' }}>.pro</span>
            </div>
          </Link>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
            SEO-Content, der wirklich indexiert wird
          </div>
        </div>

        <div className="card" style={{ padding: '2.25rem' }}>
          <div style={{ display: 'flex', marginBottom: '1.75rem', borderBottom: '2px solid var(--border)' }}>
            {(['login', 'register'] as const).map(m => (
              <button key={m} onClick={() => { setMode(m); setStatus('idle'); setMessage(''); }} style={{
                flex: 1, padding: '0.7rem', background: 'transparent', border: 'none',
                borderBottom: mode === m ? '3px solid var(--emerald)' : '3px solid transparent',
                fontFamily: 'var(--font-body)', fontSize: '0.9rem',
                fontWeight: mode === m ? 700 : 500,
                color: mode === m ? 'var(--ink)' : 'var(--text-muted)',
                cursor: 'pointer', marginBottom: '-2px', transition: 'all 0.2s',
              }}>
                {m === 'login' ? 'Anmelden' : 'Registrieren'}
              </button>
            ))}
          </div>

          {status === 'ok' ? (
            <div style={{ background: 'var(--emerald-pale)', border: '1px solid var(--emerald)', padding: '1.5rem', textAlign: 'center', borderRadius: 8 }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>✉️</div>
              <p style={{ color: 'var(--ink)', lineHeight: 1.6 }}>{message}</p>
              <Link href="/auth" style={{ display: 'inline-block', marginTop: '1rem', color: 'var(--emerald)', fontSize: '0.85rem', fontWeight: 600 }}>
                → Zum Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div>
                <label className="form-label">E-Mail-Adresse *</label>
                <input required type="email" value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="form-input" placeholder="ihre@email.de" />
              </div>
              <div>
                <label className="form-label">Passwort *</label>
                <input required type="password" value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="form-input" placeholder="Mindestens 8 Zeichen"
                  minLength={8} />
              </div>

              <div ref={captchaRef} style={{ display: 'flex', justifyContent: 'center' }} />

              {status === 'error' && (
                <div style={{ background: '#fce8e8', border: '1px solid #f5a5a5', padding: '0.75rem', fontSize: '0.85rem', color: '#b02020', borderRadius: 8 }}>
                  {message}
                </div>
              )}

              <button type="submit" disabled={status === 'loading'} className="btn-primary" style={{
                justifyContent: 'center', opacity: status === 'loading' ? 0.7 : 1,
                cursor: status === 'loading' ? 'not-allowed' : 'pointer',
              }}>
                {status === 'loading' ? '...' : mode === 'login' ? 'Anmelden' : 'Konto erstellen'}
              </button>

              {mode === 'register' && (
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.5 }}>
                  Mit der Registrierung stimmen Sie unserer{' '}
                  <Link href="/datenschutz" style={{ color: 'var(--emerald)' }}>Datenschutzerklärung</Link>{' '}
                  zu.
                </p>
              )}
            </form>
          )}
        </div>
      </div>
      <Script
        src="https://js.hcaptcha.com/1/api.js?render=explicit"
        async
        defer
        onLoad={() => setHcaptchaReady(true)}
      />
    </div>
  );
}

export default function AuthPage() {
  return <Suspense fallback={<div style={{padding:'4rem',textAlign:'center'}}>Lädt...</div>}><AuthContent /></Suspense>;
}
