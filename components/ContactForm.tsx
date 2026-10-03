'use client';

import { useState, useRef } from 'react';

const TEXT = {
  de: {
    name: 'Name *', email: 'E-Mail-Adresse *', message: 'Nachricht *',
    send: 'Nachricht senden', sending: 'Wird gesendet…',
    failed: 'Senden fehlgeschlagen.', failedRetry: 'Senden fehlgeschlagen. Bitte versuchen Sie es erneut.',
    thanks: 'Vielen Dank für Ihre Nachricht — wir melden uns zeitnah bei Ihnen.',
  },
  en: {
    name: 'Name *', email: 'Email address *', message: 'Message *',
    send: 'Send message', sending: 'Sending…',
    failed: 'Your message could not be sent. Please try again.', failedRetry: 'Your message could not be sent. Please try again.',
    thanks: 'Thank you for your message — we will get back to you shortly.',
  },
};

export function ContactForm({ locale = 'de' }: { locale?: 'de' | 'en' }) {
  const t = TEXT[locale];
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [website, setWebsite] = useState(''); // honeypot
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const loadTime = useRef(Date.now());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message, website, elapsed: Date.now() - loadTime.current }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus('error');
        // The API answers in German; English visitors get a generic English message.
        setErrorMsg(locale === 'en' ? t.failed : (data.error || t.failed));
        return;
      }
      setStatus('ok');
      setName(''); setEmail(''); setMessage('');
    } catch {
      setStatus('error');
      setErrorMsg(t.failedRetry);
    }
  };

  if (status === 'ok') {
    return (
      <div style={{ background: 'var(--emerald-pale)', border: '1px solid var(--emerald)', padding: '2rem', textAlign: 'center', borderRadius: 12 }}>
        <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>✅</div>
        <p style={{ color: 'var(--ink)', lineHeight: 1.6 }}>{t.thanks}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.1rem', position: 'relative' }}>
      <input type="text" value={website} onChange={e => setWebsite(e.target.value)} tabIndex={-1} autoComplete="off"
        style={{ position: 'absolute', left: '-9999px' }} aria-hidden="true" />
      <div>
        <label className="form-label" htmlFor="cf-name">{t.name}</label>
        <input id="cf-name" required type="text" autoComplete="name" value={name} onChange={e => setName(e.target.value)} className="form-input" />
      </div>
      <div>
        <label className="form-label" htmlFor="cf-email">{t.email}</label>
        <input id="cf-email" required type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} className="form-input" />
      </div>
      <div>
        <label className="form-label" htmlFor="cf-message">{t.message}</label>
        <textarea id="cf-message" required value={message} onChange={e => setMessage(e.target.value)} className="form-input" style={{ minHeight: 130, resize: 'vertical' }} />
      </div>
      {status === 'error' && (
        <div style={{ background: '#fce8e8', border: '1px solid #f5a5a5', padding: '0.75rem', fontSize: '0.85rem', color: '#b02020', borderRadius: 8 }}>
          {errorMsg}
        </div>
      )}
      <button type="submit" disabled={status === 'loading'} className="btn-emerald" style={{ justifyContent: 'center', opacity: status === 'loading' ? 0.7 : 1 }}>
        {status === 'loading' ? t.sending : t.send}
      </button>
    </form>
  );
}
