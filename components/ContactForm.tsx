'use client';

import { useState, useRef } from 'react';

export function ContactForm() {
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
      if (!res.ok) { setStatus('error'); setErrorMsg(data.error || 'Senden fehlgeschlagen.'); return; }
      setStatus('ok');
      setName(''); setEmail(''); setMessage('');
    } catch {
      setStatus('error');
      setErrorMsg('Senden fehlgeschlagen. Bitte versuchen Sie es erneut.');
    }
  };

  if (status === 'ok') {
    return (
      <div style={{ background: 'var(--emerald-pale)', border: '1px solid var(--emerald)', padding: '2rem', textAlign: 'center', borderRadius: 12 }}>
        <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>✅</div>
        <p style={{ color: 'var(--ink)', lineHeight: 1.6 }}>Vielen Dank für Ihre Nachricht — wir melden uns zeitnah bei Ihnen.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
      <input type="text" value={website} onChange={e => setWebsite(e.target.value)} tabIndex={-1} autoComplete="off"
        style={{ position: 'absolute', left: '-9999px' }} aria-hidden="true" />
      <div>
        <label className="form-label">Name *</label>
        <input required type="text" value={name} onChange={e => setName(e.target.value)} className="form-input" />
      </div>
      <div>
        <label className="form-label">E-Mail-Adresse *</label>
        <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="form-input" />
      </div>
      <div>
        <label className="form-label">Nachricht *</label>
        <textarea required value={message} onChange={e => setMessage(e.target.value)} className="form-input" style={{ minHeight: 130, resize: 'vertical' }} />
      </div>
      {status === 'error' && (
        <div style={{ background: '#fce8e8', border: '1px solid #f5a5a5', padding: '0.75rem', fontSize: '0.85rem', color: '#b02020', borderRadius: 8 }}>
          {errorMsg}
        </div>
      )}
      <button type="submit" disabled={status === 'loading'} className="btn-emerald" style={{ justifyContent: 'center', opacity: status === 'loading' ? 0.7 : 1 }}>
        {status === 'loading' ? 'Wird gesendet…' : 'Nachricht senden'}
      </button>
    </form>
  );
}
