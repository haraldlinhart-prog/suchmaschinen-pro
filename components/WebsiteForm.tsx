'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { HostingPlatform } from '@/types';
import { HOSTING_LABELS } from '@/types';

function cleanDomain(input: string): string {
  let d = input.trim().toLowerCase();
  d = d.replace(/^https?:\/\//, '');
  d = d.replace(/^www\./, '');
  d = d.replace(/\/.*$/, '');
  return d;
}

function slugifyDomain(domain: string): string {
  return domain.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

const PLATFORM_OPTIONS: HostingPlatform[] = ['network', 'vercel', 'netlify', 'apache', 'wordpress', 'other'];

export function WebsiteForm({ userId, onSuccess }: { userId: string; onSuccess: () => void }) {
  const [domain, setDomain] = useState('');
  const [label, setLabel] = useState('');
  const [notes, setNotes] = useState('');
  const [githubRepo, setGithubRepo] = useState('');
  const [hostingPlatform, setHostingPlatform] = useState<HostingPlatform>('network');
  const [publishPath, setPublishPath] = useState('/blog/');
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

    const cleanedRepo = githubRepo.trim().replace(/^https?:\/\/github\.com\//, '').replace(/\/$/, '');
    if (hostingPlatform === 'network' && cleanedRepo && !/^[\w.-]+\/[\w.-]+$/.test(cleanedRepo)) {
      setStatus('error');
      setMessage('Bitte GitHub-Repo im Format "owner/repo" angeben.');
      return;
    }

    let cleanedPath = publishPath.trim() || '/blog/';
    if (!cleanedPath.startsWith('/')) cleanedPath = `/${cleanedPath}`;
    if (!cleanedPath.endsWith('/')) cleanedPath = `${cleanedPath}/`;

    const supabase = createClient();
    const { error } = await supabase.from('sq_websites').insert({
      user_id: userId,
      domain: cleanedDomain,
      label: label.trim() || null,
      notes: notes.trim() || null,
      github_repo: hostingPlatform === 'network' ? (cleanedRepo || null) : null,
      hosting_platform: hostingPlatform,
      publish_path: cleanedPath,
      public_slug: slugifyDomain(cleanedDomain),
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
    setGithubRepo('');
    setPublishPath('/blog/');
    setHostingPlatform('network');
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
        <label className="form-label">Wo läuft die Website?</label>
        <select value={hostingPlatform} onChange={e => setHostingPlatform(e.target.value as HostingPlatform)} className="form-input">
          {PLATFORM_OPTIONS.map(p => <option key={p} value={p}>{HOSTING_LABELS[p]}</option>)}
        </select>
      </div>
      {hostingPlatform === 'network' && (
        <div>
          <label className="form-label">GitHub-Repo <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(optional, für automatische Veröffentlichung)</span></label>
          <input type="text" value={githubRepo} onChange={e => setGithubRepo(e.target.value)}
            className="form-input" placeholder="ihraccount/ihrrepo" />
        </div>
      )}
      <div>
        <label className="form-label">Gewünschter Pfad für Artikel</label>
        <input type="text" value={publishPath} onChange={e => setPublishPath(e.target.value)}
          className="form-input" placeholder="/blog/" />
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
