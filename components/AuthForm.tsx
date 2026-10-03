'use client';

import { useState, useEffect, useRef } from 'react';
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

const TEXT = {
  de: {
    tagline: 'SEO-Content, der wirklich indexiert wird',
    timeout: 'Zeitüberschreitung. Bitte versuchen Sie es erneut.',
    captcha: 'Bitte bestätigen Sie das Captcha.',
    blocked: 'Registrierung nicht möglich.',
    confirm: 'Bitte bestätigen Sie Ihre E-Mail-Adresse. Wir haben Ihnen eine Bestätigungsmail gesendet.',
    resetSent: 'Falls ein Konto mit dieser E-Mail-Adresse existiert, haben wir Ihnen einen Link zum Zurücksetzen des Passworts gesendet.',
    badLogin: 'Ungültige Zugangsdaten. Bitte überprüfen Sie E-Mail-Adresse und Passwort.',
    unexpected: 'Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.',
    back: '← Zurück zum Login', login: 'Anmelden', register: 'Registrieren', toLogin: '→ Zum Login',
    forgotIntro: 'Geben Sie Ihre E-Mail-Adresse ein. Wir senden Ihnen einen Link, mit dem Sie ein neues Passwort festlegen können.',
    email: 'E-Mail-Adresse *', emailPh: 'ihre@email.de', password: 'Passwort *', passwordPh: 'Mindestens 8 Zeichen',
    forgot: 'Passwort vergessen?', create: 'Konto erstellen', sendReset: 'Link zum Zurücksetzen senden',
    consentBefore: 'Mit der Registrierung stimmen Sie unserer', consentLink: 'Datenschutzerklärung', consentAfter: 'zu.',
    privacyHref: '/datenschutz',
  },
  en: {
    tagline: 'SEO content that actually gets indexed',
    timeout: 'The request timed out. Please try again.',
    captcha: 'Please complete the captcha.',
    blocked: 'Registration is not possible.',
    confirm: 'Please confirm your email address. We have sent you a confirmation email.',
    resetSent: 'If an account with this email address exists, we have sent you a link to reset your password.',
    badLogin: 'Invalid credentials. Please check your email address and password.',
    unexpected: 'An unexpected error occurred. Please try again.',
    back: '← Back to sign in', login: 'Sign in', register: 'Register', toLogin: '→ Go to sign in',
    forgotIntro: 'Enter your email address and we will send you a link to set a new password.',
    email: 'Email address *', emailPh: 'you@example.com', password: 'Password *', passwordPh: 'At least 8 characters',
    forgot: 'Forgot your password?', create: 'Create account', sendReset: 'Send reset link',
    consentBefore: 'By registering, you agree to our', consentLink: 'privacy policy', consentAfter: '',
    privacyHref: '/privacy',
  },
};

export function AuthForm({ locale = 'de', homeHref = '/' }: { locale?: 'de' | 'en'; homeHref?: string }) {
  const t = TEXT[locale];
  const isEn = locale === 'en';
  const searchParams = useSearchParams();
  const router = useRouter();
  const isRegister = searchParams.get('mode') === 'register';

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(isRegister ? 'register' : 'login');
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
      hl: locale,
      // The normal widget is 303px wide and does not fit the card on small phones.
      size: window.innerWidth < 420 ? 'compact' : 'normal',
      callback: (token: string) => setCaptchaToken(token),
      'expired-callback': () => setCaptchaToken(''),
      'error-callback': () => setCaptchaToken(''),
    });
  }, [hcaptchaReady, locale]);

  function switchMode(m: 'login' | 'register' | 'forgot') {
    setMode(m);
    setStatus('idle');
    setMessage('');
  }

  function resetCaptcha() {
    if (window.hcaptcha && widgetIdRef.current !== undefined) window.hcaptcha.reset(widgetIdRef.current);
    setCaptchaToken('');
  }

  function withTimeout<T>(promise: Promise<T>, ms = 15000): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => setTimeout(() => reject(new Error(t.timeout)), ms)),
    ]);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');
    if (!captchaToken) { setStatus('error'); setMessage(t.captcha); return; }
    const supabase = createClient();

    try {
      if (mode === 'register') {
        if (isSpamEmail(email)) { setStatus('error'); setMessage(t.blocked); return; }
        const { error } = await withTimeout(supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}/dashboard`, captchaToken },
        }));
        if (error) { setStatus('error'); setMessage(error.message); resetCaptcha(); }
        else { setStatus('ok'); setMessage(t.confirm); }
      } else if (mode === 'forgot') {
        const { error } = await withTimeout(supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/reset-password`,
          captchaToken,
        }));
        if (error) { setStatus('error'); setMessage(error.message); resetCaptcha(); }
        else { setStatus('ok'); setMessage(t.resetSent); }
      } else {
        const { error } = await withTimeout(supabase.auth.signInWithPassword({ email, password, options: { captchaToken } }));
        if (error) { setStatus('error'); setMessage(t.badLogin); resetCaptcha(); }
        else { router.push('/dashboard'); }
      }
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : t.unexpected);
      resetCaptcha();
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
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--ink)', margin: 0 }}>
              {isEn ? 'search-engines' : 'suchmaschinen'}<span style={{ color: 'var(--emerald)' }}>.pro</span>
            </h1>
          </Link>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
            {t.tagline}
          </div>
        </div>

        <div className="card" style={{ padding: '2.25rem' }}>
          {mode === 'forgot' ? (
            <div style={{ marginBottom: '1.75rem' }}>
              <button onClick={() => switchMode('login')} style={{
                background: 'transparent', border: 'none', cursor: 'pointer', padding: 0,
                fontFamily: 'var(--font-body)', fontSize: '0.85rem', fontWeight: 600, color: 'var(--emerald)',
              }}>
                {t.back}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', marginBottom: '1.75rem', borderBottom: '2px solid var(--border)' }}>
              {(['login', 'register'] as const).map(m => (
                <button key={m} onClick={() => switchMode(m)} style={{
                  flex: 1, padding: '0.7rem', background: 'transparent', border: 'none',
                  borderBottom: mode === m ? '3px solid var(--emerald)' : '3px solid transparent',
                  fontFamily: 'var(--font-body)', fontSize: '0.9rem',
                  fontWeight: mode === m ? 700 : 500,
                  color: mode === m ? 'var(--ink)' : 'var(--text-muted)',
                  cursor: 'pointer', marginBottom: '-2px', transition: 'all 0.2s',
                }}>
                  {m === 'login' ? t.login : t.register}
                </button>
              ))}
            </div>
          )}

          {status === 'ok' ? (
            <div style={{ background: 'var(--emerald-pale)', border: '1px solid var(--emerald)', padding: '1.5rem', textAlign: 'center', borderRadius: 8 }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>✉️</div>
              <p style={{ color: 'var(--ink)', lineHeight: 1.6 }}>{message}</p>
              {/* Full reload: the hCaptcha widget was unmounted together with the form. */}
              <button type="button" onClick={() => { window.location.href = '/auth'; }} style={{
                display: 'inline-block', marginTop: '1rem', color: 'var(--emerald)', fontSize: '0.85rem', fontWeight: 600,
                background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)',
              }}>
                {t.toLogin}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              {mode === 'forgot' && (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                  {t.forgotIntro}
                </p>
              )}
              <div>
                <label className="form-label" htmlFor="auth-email">{t.email}</label>
                <input id="auth-email" required type="email" autoComplete="email" value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="form-input" placeholder={t.emailPh} />
              </div>
              {mode !== 'forgot' && (
                <div>
                  <label className="form-label" htmlFor="auth-password">{t.password}</label>
                  <input id="auth-password" required type="password" value={password}
                    autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                    onChange={e => setPassword(e.target.value)}
                    className="form-input" placeholder={t.passwordPh}
                    minLength={8} />
                </div>
              )}

              {mode === 'login' && (
                <button type="button" onClick={() => switchMode('forgot')} style={{
                  background: 'transparent', border: 'none', cursor: 'pointer', padding: 0,
                  alignSelf: 'flex-end', marginTop: '-0.6rem',
                  fontFamily: 'var(--font-body)', fontSize: '0.8rem', fontWeight: 600, color: 'var(--emerald)',
                }}>
                  {t.forgot}
                </button>
              )}

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
                {status === 'loading' ? <span className="spinner" aria-label="…" /> : mode === 'login' ? t.login : mode === 'register' ? t.create : t.sendReset}
              </button>

              {mode === 'register' && (
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.5 }}>
                  {t.consentBefore}{' '}
                  <Link href={t.privacyHref} style={{ color: 'var(--emerald)' }}>{t.consentLink}</Link>
                  {t.consentAfter ? <>{' '}{t.consentAfter}</> : '.'}
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
