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
          title="So viel zahlen Werbetreibende bei Google Ads (Anzeigen über den Suchergebnissen) für einen einzigen Klick auf diesen Suchbegriff. Wer über Ihren Artikel kommt, kommt kostenlos – diesen Betrag sparen Sie also pro Besucher an Werbekosten."
          style={{ fontSize: '0.78rem', color: 'var(--emerald)', fontWeight: 600, cursor: 'help' }}
        >
          Google-Ads-Preis: {cpc.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })} pro Klick
        </span>
      )}
    </>
  );
}

export function AdsPriceNote() {
  return (
    <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: '0.4rem 0 0' }}>
      <strong style={{ color: 'var(--emerald)' }}>Google-Ads-Preis</strong> = was Werbetreibende bei Google Ads für einen einzigen Klick auf eine
      Anzeige zu diesem Suchbegriff bezahlen. Besucher, die über Ihren Artikel kommen, kosten Sie nichts – pro Besucher sparen Sie also diesen
      Betrag an Werbekosten. Ein hoher Preis zeigt außerdem, dass der Begriff kaufbereite Interessenten anzieht.
    </p>
  );
}

export interface KeywordAnalysisResult {
  keyword: string;
  volume: number | null;
  cpc: number | null;
  scenarios: Array<{ position: number; clicks: number; adsValue: number | null }>;
  verdict: { level: 'good' | 'niche' | 'weak' | 'none' | 'unknown'; text: string };
  related: Array<{ keyword: string; volume: number; cpc: number | null }>;
}

function VerdictBox({ verdict }: { verdict: KeywordAnalysisResult['verdict'] }) {
  const tone = {
    good: { bg: 'var(--emerald-pale)', fg: 'var(--emerald)', icon: '✓', label: 'Empfehlenswert' },
    niche: { bg: 'var(--emerald-pale)', fg: 'var(--emerald)', icon: '✓', label: 'Sinnvoll' },
    weak: { bg: '#fdf3dc', fg: '#8a6a1a', icon: '!', label: 'Eher schwach' },
    none: { bg: '#fce8e8', fg: '#b02020', icon: '✕', label: 'Nicht empfehlenswert' },
    unknown: { bg: 'var(--paper-dark)', fg: 'var(--text-muted)', icon: '?', label: 'Keine Daten' },
  }[verdict.level];
  return (
    <div style={{ background: tone.bg, color: tone.fg, padding: '0.6rem 0.8rem', borderRadius: 8, fontSize: '0.82rem', display: 'flex', gap: '0.55rem', alignItems: 'flex-start' }}>
      <strong aria-hidden style={{ width: 18, textAlign: 'center' }}>{tone.icon}</strong>
      <span><strong>{tone.label}:</strong> {verdict.text}</span>
    </div>
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
  const [analysis, setAnalysis] = useState<KeywordAnalysisResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState('');
  const [override, setOverride] = useState(false);
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

  const analyze = async (kw: string) => {
    const k = kw.trim();
    if (k.length < 3) return;
    setOwnKeyword(k);
    setAnalyzing(true);
    setAnalyzeError('');
    setAnalysis(null);
    setOverride(false);
    try {
      const res = await fetch('/api/keywords/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: k }),
      });
      const d = await res.json();
      if (!res.ok) setAnalyzeError(d.error || 'Prüfung fehlgeschlagen.');
      else setAnalysis(d);
    } catch {
      setAnalyzeError('Prüfung fehlgeschlagen.');
    } finally {
      setAnalyzing(false);
    }
  };
  const analysed = analysis && analysis.keyword.toLowerCase() === own.toLowerCase() ? analysis : null;
  const sensible = !!analysed && (['good', 'niche', 'unknown'].includes(analysed.verdict.level) || override);
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
          Sie wissen, wonach Ihre Kunden suchen? Geben Sie den Suchbegriff ein und prüfen Sie zuerst, wie viele Besucher ein Artikel dazu bringen kann und was diese Besucher über Google Ads kosten würden. Ist der Begriff sinnvoll, können Sie den Artikel sofort schreiben lassen oder für die nächste automatische Veröffentlichung vormerken.
        </p>
        <form
          onSubmit={e => { e.preventDefault(); analyze(own); }}
          style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}
        >
          <input
            value={ownKeyword}
            onChange={e => setOwnKeyword(e.target.value)}
            placeholder="z. B. GmbH liquidieren Kosten"
            maxLength={80}
            style={{ flex: 1, minWidth: 220, padding: '0.55rem 0.8rem', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.9rem' }}
          />
          <button type="submit" className="btn-emerald" style={btn} disabled={own.length < 3 || analyzing}>
            {analyzing && <span className="spinner" />}
            {analyzing ? 'Wird geprüft…' : 'Suchbegriff prüfen'}
          </button>
        </form>
        {analyzeError && <p style={{ fontSize: '0.8rem', color: '#b02020', margin: '0.6rem 0 0' }}>{analyzeError}</p>}

        {analysed && (
          <div style={{ marginTop: '1.1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.9rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
              <strong style={{ fontSize: '0.95rem', color: 'var(--ink)' }}>„{analysed.keyword}“</strong>
              <VolumeLabel info={{ volume: analysed.volume, cpc: analysed.cpc, competition: null }} />
            </div>
            <VerdictBox verdict={analysed.verdict} />

            {analysed.volume ? (
              <>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--ink)', margin: '1rem 0 0.4rem' }}>Was ein Artikel zu diesem Begriff bringen kann</div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                    <thead>
                      <tr style={{ textAlign: 'left', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '0.35rem 0.5rem', fontWeight: 600 }}>Wenn der Artikel bei Google auf …</th>
                        <th style={{ padding: '0.35rem 0.5rem', fontWeight: 600, textAlign: 'right' }}>Besucher pro Monat (ca.)</th>
                        <th style={{ padding: '0.35rem 0.5rem', fontWeight: 600, textAlign: 'right' }}>Gleiche Besucher über Google Ads kosten</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analysed.scenarios.map(sc => (
                        <tr key={sc.position} style={{ borderTop: '1px solid var(--border)', background: sc.position <= 3 ? 'var(--emerald-pale)' : undefined }}>
                          <td style={{ padding: '0.4rem 0.5rem' }}>Platz {sc.position}{sc.position <= 10 ? '' : ' (Seite 2)'}</td>
                          <td style={{ padding: '0.4rem 0.5rem', textAlign: 'right', fontWeight: 600 }}>{sc.clicks < 1 ? 'unter 1' : Math.round(sc.clicks).toLocaleString('de-DE')}</td>
                          <td style={{ padding: '0.4rem 0.5rem', textAlign: 'right', fontWeight: 600, color: 'var(--emerald)' }}>
                            {sc.adsValue !== null ? `${sc.adsValue.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })} / Monat` : '–'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '0.5rem 0 0' }}>
                  Schätzung aus dem monatlichen Suchvolumen und den typischen Klickraten je Google-Platz (Platz 1 erhält rund 28 % der Klicks, Platz 10 nur noch rund 2–3 %).
                  Die rechte Spalte zeigt, was Sie für dieselbe Zahl an Besuchern bei Google Ads bezahlen müssten – über den Artikel kommen sie kostenlos.
                </p>
              </>
            ) : null}

            {analysed.related.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.4rem' }}>Verwandte Suchbegriffe mit mehr Nachfrage</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {analysed.related.map(r => (
                    <div key={r.keyword} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', padding: '0.35rem 0', borderTop: '1px solid var(--border)' }}>
                      <span style={{ flex: 1, minWidth: 180, fontSize: '0.85rem', color: 'var(--ink)' }}>{r.keyword}</span>
                      <VolumeLabel info={{ volume: r.volume, cpc: r.cpc, competition: null }} />
                      <button type="button" className="btn-outline" style={{ ...btn, padding: '0.3rem 0.7rem' }} onClick={() => analyze(r.keyword)}>Diesen prüfen</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(analysed.verdict.level === 'weak' || analysed.verdict.level === 'none') && (
              <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '1rem' }}>
                <input type="checkbox" checked={override} onChange={e => setOverride(e.target.checked)} />
                Ich möchte diesen Begriff trotzdem verwenden (z. B. weil er genau mein Angebot beschreibt).
              </label>
            )}

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
              <button
                className="btn-emerald"
                style={btn}
                disabled={!sensible || freeLimitReached || generatingKeyword !== null}
                onClick={() => { onGenerate({ keyword: analysed.keyword, rationale: 'Selbst gewählter Suchbegriff', intent: 'informational' }); }}
              >
                {generatingKeyword === analysed.keyword && <span className="spinner" />}
                {generatingKeyword === analysed.keyword ? generateMessage : 'Artikel jetzt erstellen'}
              </button>
              <button className="btn-outline" style={btn} disabled={!sensible || queueing !== null} onClick={() => queue(analysed.keyword, 'manual')}>
                {queueing === analysed.keyword && <span className="spinner" />}Als Nächstes vormerken
              </button>
            </div>
          </div>
        )}
        {queuedMsg && <p style={{ fontSize: '0.8rem', color: 'var(--emerald)', margin: '0.6rem 0 0' }}>{queuedMsg}</p>}
      </div>

      {isAdmin && (
        <>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: 'var(--ink)', marginBottom: '0.25rem' }}>Ihre Suchbegriffe bei Google</h2>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Begriffe, zu denen Google Ihre Website in den letzten 90 Tagen angezeigt hat (Search Console)
            {vol.available ? ', mit monatlichem Suchvolumen in Deutschland' : ''}.
            {vol.available && <AdsPriceNote />}
          </div>
          {googleLoading && <div style={{ padding: '1rem' }}><span className="spinner" style={{ color: 'var(--emerald)' }} /></div>}
          {googleError && <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{googleError}</p>}
          {googleError.includes('nicht verbunden') && (
            <a href="/api/searchconsole/connect" className="btn-emerald" style={{ display: 'inline-block', marginBottom: '1rem', padding: '0.5rem 1.1rem', fontSize: '0.82rem' }}>
              Google Search Console verbinden
            </a>
          )}
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
