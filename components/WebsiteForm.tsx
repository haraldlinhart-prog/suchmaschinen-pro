'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { HostingPlatform } from '@/types';
import { HOSTING_LABELS } from '@/types';

const ADMIN_EMAIL = 'haraldlinhart@gmail.com';

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

export function WebsiteForm({ userId, userEmail, onSuccess }: { userId: string; userEmail?: string | null; onSuccess: () => void }) {
  const isAdmin = userEmail === ADMIN_EMAIL;
  const [domain, setDomain] = useState('');
  const [label, setLabel] = useState('');
  const [notes, setNotes] = useState('');
  const [githubRepo, setGithubRepo] = useState('');
  const [hostingPlatform, setHostingPlatform] = useState<HostingPlatform>('network');
  const [publishPath, setPublishPath] = useState('/blog/');
  const [wpUrl, setWpUrl] = useState('');
  const [wpUsername, setWpUsername] = useState('');
  const [wpAppPassword, setWpAppPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const [repoOptions, setRepoOptions] = useState<string[]>([]);
  const [repoLoadState, setRepoLoadState] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');
  const [repoManualEntry, setRepoManualEntry] = useState(false);
  const [domainTouched, setDomainTouched] = useState(false);
  const [domainLookupState, setDomainLookupState] = useState<'idle' | 'loading' | 'done'>('idle');

  useEffect(() => {
    if (!isAdmin || hostingPlatform !== 'network' || repoLoadState !== 'idle') return;
    setRepoLoadState('loading');
    fetch('/api/github/repos')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data.repos)) {
          setRepoOptions(data.repos.map((r: { full_name: string }) => r.full_name));
          setRepoLoadState('loaded');
        } else {
          setRepoLoadState('error');
        }
      })
      .catch(() => setRepoLoadState('error'));
  }, [isAdmin, hostingPlatform, repoLoadState]);

  // When the admin picks a repo, look up its live production domain in Vercel and
  // pre-fill the domain field — unless the person already typed a domain by hand.
  useEffect(() => {
    if (!isAdmin || !githubRepo || domainTouched) return;
    setDomainLookupState('loading');
    fetch(`/api/vercel/domain?repo=${encodeURIComponent(githubRepo)}`)
      .then(res => res.json())
      .then(data => {
        if (data.domain && !domainTouched) setDomain(data.domain);
      })
      .catch(() => {})
      .finally(() => setDomainLookupState('done'));
  }, [isAdmin, githubRepo, domainTouched]);

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

    if (hostingPlatform === 'wordpress' && (!wpUrl.trim() || !wpUsername.trim() || !wpAppPassword.trim())) {
      setStatus('error');
      setMessage('Bitte WordPress-URL, Benutzername und Anwendungspasswort angeben.');
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
      wp_url: hostingPlatform === 'wordpress' ? wpUrl.trim().replace(/\/$/, '') : null,
      wp_username: hostingPlatform === 'wordpress' ? wpUsername.trim() : null,
      wp_app_password: hostingPlatform === 'wordpress' ? wpAppPassword.trim() : null,
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
    setWpUrl('');
    setWpUsername('');
    setWpAppPassword('');
    setDomainTouched(false);
    setDomainLookupState('idle');
    setStatus('idle');
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.1rem', maxWidth: 520 }}>
      <div>
        <label className="form-label">Domain *</label>
        <input required type="text" value={domain} onChange={e => { setDomain(e.target.value); setDomainTouched(true); }}
          className="form-input" placeholder="ihredomain.de" />
        {isAdmin && domainLookupState === 'loading' && (
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>Domain wird aus Vercel ermittelt…</div>
        )}
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
          {isAdmin && !repoManualEntry ? (
            <>
              {repoLoadState === 'loading' && (
                <div className="form-input" style={{ color: 'var(--text-muted)' }}>Repos werden geladen…</div>
              )}
              {repoLoadState === 'error' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <div style={{ fontSize: '0.8rem', color: '#b02020' }}>Repo-Liste konnte nicht geladen werden.</div>
                  <input type="text" value={githubRepo} onChange={e => setGithubRepo(e.target.value)}
                    className="form-input" placeholder="ihraccount/ihrrepo" />
                </div>
              )}
              {repoLoadState === 'loaded' && (
                <>
                  <select value={githubRepo} onChange={e => setGithubRepo(e.target.value)} className="form-input">
                    <option value="">— Repo auswählen —</option>
                    {repoOptions.map(name => <option key={name} value={name}>{name}</option>)}
                  </select>
                  <button type="button" onClick={() => setRepoManualEntry(true)}
                    style={{ background: 'none', border: 'none', padding: 0, marginTop: '0.4rem', fontSize: '0.78rem', color: 'var(--text-muted)', textDecoration: 'underline', cursor: 'pointer' }}>
                    Stattdessen manuell eingeben
                  </button>
                </>
              )}
            </>
          ) : (
            <>
              <input type="text" value={githubRepo} onChange={e => setGithubRepo(e.target.value)}
                className="form-input" placeholder="ihraccount/ihrrepo" />
              {isAdmin && (
                <button type="button" onClick={() => { setRepoManualEntry(false); setRepoLoadState('idle'); }}
                  style={{ background: 'none', border: 'none', padding: 0, marginTop: '0.4rem', fontSize: '0.78rem', color: 'var(--text-muted)', textDecoration: 'underline', cursor: 'pointer' }}>
                  Aus Repo-Liste auswählen
                </button>
              )}
            </>
          )}
        </div>
      )}
      {hostingPlatform === 'wordpress' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', background: 'var(--paper-dark)', padding: '1rem', borderRadius: 8 }}>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
            In WordPress unter Benutzer → Profil → &quot;Anwendungspasswörter&quot; ein neues Passwort erstellen und hier eintragen. Kein Plugin nötig.{' '}
            <a href="/hilfe/wordpress" target="_blank" rel="noopener" style={{ color: 'var(--emerald)', fontWeight: 600 }}>Ausführliche Anleitung →</a>
          </p>
          <div>
            <label className="form-label">WordPress-URL</label>
            <input type="text" value={wpUrl} onChange={e => setWpUrl(e.target.value)} className="form-input" placeholder="https://ihredomain.de" />
          </div>
          <div>
            <label className="form-label">Benutzername</label>
            <input type="text" value={wpUsername} onChange={e => setWpUsername(e.target.value)} className="form-input" placeholder="admin" />
          </div>
          <div>
            <label className="form-label">Anwendungspasswort</label>
            <input type="password" value={wpAppPassword} onChange={e => setWpAppPassword(e.target.value)} className="form-input" placeholder="xxxx xxxx xxxx xxxx xxxx xxxx" />
          </div>
        </div>
      )}
      {hostingPlatform !== 'wordpress' && (
        <div>
          <label className="form-label">Gewünschter Pfad für Artikel</label>
          <input type="text" value={publishPath} onChange={e => setPublishPath(e.target.value)}
            className="form-input" placeholder="/blog/" />
        </div>
      )}
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
