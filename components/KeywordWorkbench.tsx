'use client';

import { useEffect, useState } from 'react';
import type { SuggestedKeyword } from '@/types';

export interface KeywordVolumeInfo {
  volume: number | null;
  cpc: number | null;
  competition: string | null;
}

interface GoogleQuery {
  keyword: string;
  impressions: number;
  clicks: number;
  position: number;
}

/** Loads monthly search volumes for a list of keywords (cached server-side). */
export function useKeywordVolumes(keywords: string[]) {
  const [volumes, setVolumes] = useState<Record<string, KeywordVolumeInfo>>({});
  const [available, setAvailable] = useState<boolean | null>(null);
  const key = keywords.map(k => k.toLowerCase()).sort().join('|');

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    fetch('/api/keywords/volume', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keywords: key.split('|') }),
    })
      .then(r => r.json())
      .then(d => {
        if (cancelled) return;
        setAvailable(!!d.available);
        setVolumes(v => ({ ...v, ...(d.volumes || {}) }));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [key]);

  const get = (k: string) => volumes[k.trim().toLowerCase().replace(/\s+/g, ' ')];
  return { get, available };
}

export function VolumeLabel({ info }: { info?: KeywordVolumeInfo }) {
  if (!info || info.volume === null || info.volume === undefined) return null;
  const cpc = info.cpc !== null && info.cpc !== undefined ? Number(info.cpc) : null;
  return (
    <>
      <span style={{ fontSize: '0.78rem', color: 'var(--ink)', fontWeight: 600 }}>
        {info.volume === 0 ? 'kaum Suchen' : `≈ ${info.volume.toLocaleString('de-DE')} Suchen/Monat`}
      </span>
      {cpc !== null && cpc > 0 && (
        <span
          title="So viel zahlen Werbetreibende bei Google Ads für einen einzigen Klick auf diesen Suchbegriff. Jeder Besucher, der über Ihren Artikel kommt, ist diesen Betrag wert – ohne dass Sie dafür bezahlen."
          style={{ fontSize: '0.78rem', color: 'var(--emerald)', fontWeight: 600, cursor: 'help' }}
        >
          Wert pro Besucher: {cpc.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
        </span>
      )}
    </>
  );
}

interface Props {
  websiteId: string;
  isAdmin: boolean;
  usedKeywords: string[];
  generatingKeyword: string | null;
  generateMessage: string;
  freeLimitReached: boolean;
  onGenerate: (kw: SuggestedKeyword) => void;
  onQueued: () => void;
}

export function KeywordWorkbench({ websiteId, isAdmin, usedKeywords, generatingKeyword, generateMessage, freeLimitReached, onGenerate, onQueued }: Props) {
  const [ownKeyword, setOwnKeyword] = useState('');
  const [queueing, setQueueing] = useState<string | null>(null);
  const [queuedMsg, setQueuedMsg] = useState('');
  const [googleQueries, setGoogleQueries] = useState<GoogleQuery[] | null>(null);
  const [googleError, setGoogleError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(isAdmin);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    fetch(`/api/keywords/google?websiteId=${websiteId}`)
      .then(r => r.json())
      .then(d => {
        if (cancelled) return;
        if (d.queries) setGoogleQueries(d.queries);
        else setGoogleError(d.error || 'Suchbegriffe konnten nicht geladen werden.');
      })
      .catch(() => { if (!cancelled) setGoogleError('Suchbegriffe konnten nicht geladen werden.'); })
      .finally(() => { if (!cancelled) setGoogleLoading(false); });
    return () => { cancelled = true; };
  }, [isAdmin, websiteId]);

  const vol = useKeywordVolumes((googleQueries || []).slice(0, 100).map(q => q.keyword));
  const used = new Set(usedKeywords.map(k => k.toLowerCase()));

  const queue = async (keyword: string, source: string, rationale?: string) => {
    setQueueing(keyword);
    setQueuedMsg('');
    try {
      const res = await fetch('/api/keywords/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ websiteId, keyword, source, rationale }),
      });
      const d = await res.json();
      if (!res.ok) { setQueuedMsg(d.error || 'Konnte nicht vorgemerkt werden.'); return; }
      setQueuedMsg(`„${keyword}“ ist vorgemerkt – der nächste automatische Artikel wird dazu geschrieben.`);
      onQueued();
    } catch {
      setQueuedMsg('Konnte nicht vorgemerkt werden.');
    } finally {
      setQueueing(null);
    }
  };

  const own = ownKeyword.trim();
  const btn = { padding: '0.45rem 0.9rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' } as const;

  const sorted = (googleQueries || [])
    .map(q => ({ ...q, info: vol.get(q.keyword) }))
    .sort((a, b) => (b.info?.volume ?? -1) - (a.info?.volume ?? -1) || b.impressions - a.impressions);
  const visible = showAll ? sorted : sorted.slice(0, 15);

  return (
    <div style={{ marginBottom: '2.5rem' }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: 'var(--ink)', marginBottom: '0.75rem' }}>Eigener Suchbegriff</h2>
      <div className="card" style={{ padding: '1.1rem 1.4rem', marginBottom: '2rem' }}>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0 0 0.75rem' }}>
          Sie wissen, wonach Ihre Kunden suchen? Geben Sie den Suchbegriff ein und lassen Sie sofort einen Artikel dazu schreiben – oder merken Sie ihn für die nächste automatische Veröffentlichung vor.
        </p>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <input
            value={ownKeyword}
            onChange={e => setOwnKeyword(e.target.value)}
            placeholder="z. B. GmbH liquidieren Kosten"
            maxLength={120}
            style={{ flex: 1, minWidth: 220, padding: '0.55rem 0.8rem', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.9rem' }}
          />
          <button
            className="btn-emerald"
            style={btn}
            disabled={!own || freeLimitReached || generatingKeyword !== null}
            onClick={() => { onGenerate({ keyword: own, rationale: 'Selbst gewählter Suchbegriff', intent: 'informational' }); }}
          >
            {generatingKeyword === own && <span className="spinner" />}
            {generatingKeyword === own ? generateMessage : 'Artikel jetzt erstellen'}
          </button>
          <button className="btn-outline" style={btn} disabled={!own || queueing !== null} onClick={() => queue(own, 'manual')}>
            {queueing === own && <span className="spinner" />}Als Nächstes vormerken
          </button>
        </div>
        {queuedMsg && <p style={{ fontSize: '0.8rem', color: 'var(--emerald)', margin: '0.6rem 0 0' }}>{queuedMsg}</p>}
      </div>

      {isAdmin && (
        <>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: 'var(--ink)', marginBottom: '0.25rem' }}>Ihre Suchbegriffe bei Google</h2>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Begriffe, zu denen Google Ihre Website in den letzten 90 Tagen angezeigt hat (Search Console)
            {vol.available ? ', mit monatlichem Suchvolumen in Deutschland' : ''}.
          </div>
          {googleLoading && <div style={{ padding: '1rem' }}><span className="spinner" style={{ color: 'var(--emerald)' }} /></div>}
          {googleError && <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{googleError}</p>}
          {googleQueries && googleQueries.length === 0 && (
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Google hat diese Website bisher zu keinem Suchbegriff angezeigt.</p>
          )}
          {visible.length > 0 && (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {visible.map((q, i) => {
                const hasArticle = used.has(q.keyword.toLowerCase());
                return (
                  <div key={q.keyword} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1.2rem', borderTop: i ? '1px solid var(--border)' : 'none', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--ink)' }}>{q.keyword}</div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '0.15rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <VolumeLabel info={q.info} />
                        <span>{q.impressions.toLocaleString('de-DE')} × angezeigt</span>
                        <span>{q.clicks.toLocaleString('de-DE')} Klicks</span>
                        <span>Ø Position {String(q.position).replace('.', ',')}</span>
                      </div>
                    </div>
                    {hasArticle ? (
                      <span className="badge badge-active">Artikel vorhanden</span>
                    ) : (
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button className="btn-outline" style={btn} disabled={queueing !== null} onClick={() => queue(q.keyword, 'search_console', `Google zeigt die Website bereits zu diesem Begriff (Ø Position ${q.position}) – ein eigener Artikel kann das Ranking deutlich verbessern.`)}>
                          {queueing === q.keyword && <span className="spinner" />}Vormerken
                        </button>
                        <button
                          className="btn-outline"
                          style={btn}
                          disabled={freeLimitReached || generatingKeyword !== null}
                          onClick={() => onGenerate({ keyword: q.keyword, rationale: `Google zeigt die Website bereits zu diesem Begriff (Ø Position ${q.position}).`, intent: 'informational' })}
                        >
                          {generatingKeyword === q.keyword && <span className="spinner" />}
                          {generatingKeyword === q.keyword ? generateMessage : 'Artikel erstellen'}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {sorted.length > 15 && (
            <button className="btn-outline" style={{ ...btn, marginTop: '0.75rem' }} onClick={() => setShowAll(s => !s)}>
              {showAll ? 'Weniger anzeigen' : `Alle ${sorted.length} anzeigen`}
            </button>
          )}
          <div style={{ marginBottom: '2.5rem' }} />
        </>
      )}
    </div>
  );
}
