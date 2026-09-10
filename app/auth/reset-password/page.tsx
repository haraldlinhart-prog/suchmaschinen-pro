'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

function ResetPasswordContent() {
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
    if (password.length < 8) { setStatus('error'); setMessage('Das Passwort muss mindestens 8 Zeichen lang sein.'); return; }
    if (password !== confirmPassword) { setStatus('error'); setMessage('Die Passwörter stimmen nicht überein.'); return; }

    setStatus('loading');
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setStatus('error'); setMessage(error.message);
    } else {
      setStatus('ok'); setMessage('Ihr Passwort wurde geändert. Sie werden weitergeleitet …');
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
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--ink)' }}>
              suchmaschinen<span style={{ color: 'var(--emerald)' }}>.pro</span>
            </div>
          </Link>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
            Neues Passwort festlegen
          </div>
        </div>

        <div className="card" style={{ padding: '2.25rem' }}>
          {sessionReady === 'checking' && (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Link wird geprüft …</p>
          )}

          {sessionReady === 'invalid' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ background: '#fce8e8', border: '1px solid #f5a5a5', padding: '1rem', fontSize: '0.85rem', color: '#b02020', borderRadius: 8, marginBottom: '1.25rem' }}>
                Dieser Link ist ungültig oder abgelaufen. Bitte fordern Sie einen neuen Link zum Zurücksetzen des Passworts an.
              </div>
              <Link href="/auth" style={{ color: 'var(--emerald)', fontSize: '0.85rem', fontWeight: 600 }}>
                → Zurück zum Login
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
                  <label className="form-label">Neues Passwort *</label>
                  <input required type="password" value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="form-input" placeholder="Mindestens 8 Zeichen"
                    minLength={8} />
                </div>
                <div>
                  <label className="form-label">Passwort bestätigen *</label>
                  <input required type="password" value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="form-input" placeholder="Mindestens 8 Zeichen"
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
                  {status === 'loading' ? '...' : 'Neues Passwort speichern'}
                </button>
              </form>
            )
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return <Suspense fallback={<div style={{padding:'4rem',textAlign:'center'}}>Lädt...</div>}><ResetPasswordContent /></Suspense>;
}
