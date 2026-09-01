'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

function cleanDomain(input: string): string {
  let d = input.trim().toLowerCase();
  d = d.replace(/^https?:\/\//, '');
  d = d.replace(/^www\./, '');
  d = d.replace(/\/.*$/, '');
  return d;
}

export function WebsiteForm({ userId, onSuccess }: { userId: string; onSuccess: () => void }) {
  const [domain, setDomain] = useState('');
  const [label, setLabel] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    const cleanedDomain = cleanDomain(domain);
    if (!cleanedDomain || !cleanedDomain.includes('.')) {
      setStatus('error');
      setMessage('Bitte geben Sie eine gültige Domain ein (z. B. ihredomain.de).');
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.from('sq_websites').insert({
      user_id: userId,
      domain: cleanedDomain,
      label: label.trim() || null,
      notes: notes.trim() || null,
      status: 'pending',
    });

    if (error) {
      setStatus('error');
      setMessage(error.code === '23505' ? 'Diese Domain ist bereits registriert.' : 'Fehler beim Speichern. Bitte versuchen Sie es erneut.');
      return;
    }

    setDomain('');
    setLabel('');
    setNotes('');
    setStatus('idle');
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.1rem', maxWidth: 520 }}>
      <div>
        <label className="form-label">Domain *</label>
        <input required type="text" value={domain} onChange={e => setDomain(e.target.value)}
          className="form-input" placeholder="ihredomain.de" />
      </div>
      <div>
        <label className="form-label">Bezeichnung <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(optional)</span></label>
        <input type="text" value={label} onChange={e => setLabel(e.target.value)}
          className="form-input" placeholder="z. B. Hauptseite" />
      </div>
      <div>
        <label className="form-label">Notizen <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(optional)</span></label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)}
          className="form-input" style={{ minHeight: 80, resize: 'vertical' }}
          placeholder="Themenschwerpunkt, Zielgruppe, o.ä." />
      </div>

      {status === 'error' && (
        <div style={{ background: '#fce8e8', border: '1px solid #f5a5a5', padding: '0.75rem', fontSize: '0.85rem', color: '#b02020', borderRadius: 8 }}>
          {message}
        </div>
      )}

      <button type="submit" disabled={status === 'loading'} className="btn-emerald" style={{ justifyContent: 'center', opacity: status === 'loading' ? 0.7 : 1 }}>
        {status === 'loading' ? 'Wird gespeichert…' : 'Website hinzufügen'}
      </button>
    </form>
  );
}
