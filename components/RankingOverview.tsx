'use client';

import { useEffect, useState } from 'react';

// Google ranking overview (chat 26.09.26): how the website ranks overall, how that
// develops over time, and which search terms each page ranks for.
// Colors: page-1 positions (1–10) in emerald, everything below in a muted gray-green.
// The gray is deliberately low-contrast, so every bar carries a direct label and the
// whole chart has a table view (validated with the dataviz palette script).

const PAGE1 = '#0f7a5c';
const BELOW = '#9db0a9';

interface Bucket { key: string; label: string; count: number; keywords: string[] }
interface TrendPoint { date: string; position: number; clicks: number; impressions: number }
interface PageKw { keyword: string; position: number; impressions: number; clicks: number }
interface PageRow { page: string; impressions: number; clicks: number; keywords: PageKw[] }
interface Data {
  days: number;
  totals: { keywords: number; page1: number; avgPosition: number | null; impressions: number; clicks: number };
  buckets: Bucket[];
  trend: TrendPoint[];
  pages: PageRow[];
}

const nf = (n: number) => Math.round(n).toLocaleString('de-DE');
const pf = (n: number) => String(Math.round(n * 10) / 10).replace('.', ',');
const shortDate = (d: string) => `${d.slice(8, 10)}.${d.slice(5, 7)}.`;

function Tooltip({ x, y, children }: { x: string; y: string; children: React.ReactNode }) {
  return (
    <div
      role="tooltip"
      style={{
        position: 'absolute', left: x, top: y, transform: 'translate(-50%, calc(-100% - 10px))', pointerEvents: 'none',
        background: 'var(--ink)', color: 'white', padding: '0.45rem 0.65rem', borderRadius: 6, fontSize: '0.76rem',
        whiteSpace: 'nowrap', zIndex: 5, boxShadow: 'var(--shadow-elevated)',
      }}
    >
      {children}
    </div>
  );
}

function Buckets({ buckets }: { buckets: Bucket[] }) {
  const max = Math.max(1, ...buckets.map(b => b.count));
  const [hover, setHover] = useState<number | null>(null);
  return (
    <div>
      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.6rem' }}>Wo die Suchbegriffe bei Google stehen</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {buckets.map((b, i) => {
          const onPage1 = i < 2;
          const pct = (b.count / max) * 100;
          return (
            <div
              key={b.key}
              tabIndex={0}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              style={{ display: 'grid', gridTemplateColumns: '92px 1fr', alignItems: 'center', gap: 10, position: 'relative', outline: 'none' }}
            >
              <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{b.label}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 22 }}>
                <div
                  style={{
                    width: `${Math.max(pct, b.count ? 1.5 : 0)}%`, height: 16, borderRadius: '0 4px 4px 0',
                    background: onPage1 ? PAGE1 : BELOW, opacity: hover === null || hover === i ? 1 : 0.55, transition: 'opacity .15s',
                  }}
                />
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--ink)' }}>{nf(b.count)}</span>
              </div>
              {hover === i && b.keywords.length > 0 && (
                <Tooltip x="50%" y="0px">
                  <div style={{ fontWeight: 700, marginBottom: 2 }}>{nf(b.count)} Suchbegriffe · {b.label}</div>
                  <div style={{ opacity: 0.8 }}>{b.keywords.slice(0, 5).join(', ')}{b.count > 5 ? ' …' : ''}</div>
                </Tooltip>
              )}
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.6rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
        <span><span style={{ display: 'inline-block', width: 10, height: 10, background: PAGE1, borderRadius: 2, marginRight: 5 }} />Seite 1 bei Google</span>
        <span><span style={{ display: 'inline-block', width: 10, height: 10, background: BELOW, borderRadius: 2, marginRight: 5 }} />Seite 2 und weiter hinten</span>
      </div>
    </div>
  );
}

function smooth(trend: TrendPoint[], window = 7): TrendPoint[] {
  // Impression-weighted rolling average: single days with 1–2 impressions otherwise make
  // the line jump between position 5 and 90.
  return trend.map((t, i) => {
    const slice = trend.slice(Math.max(0, i - window + 1), i + 1);
    const w = slice.reduce((n, d) => n + d.impressions, 0);
    const position = w ? slice.reduce((n, d) => n + d.position * d.impressions, 0) / w : t.position;
    return { ...t, position: Math.round(position * 10) / 10 };
  });
}

function Trend({ trend: raw }: { trend: TrendPoint[] }) {
  const [hover, setHover] = useState<number | null>(null);
  if (raw.length < 2) return null;
  const trend = smooth(raw);
  const W = 900, H = 220, L = 44, R = 12, T = 12, B = 26;
  const maxPos = Math.min(100, Math.max(20, Math.ceil(Math.max(...trend.map(t => t.position)) / 10) * 10));
  const x = (i: number) => L + (i / (trend.length - 1)) * (W - L - R);
  const y = (p: number) => T + ((p - 1) / (maxPos - 1)) * (H - T - B); // position 1 at the top
  const path = trend.map((t, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(t.position).toFixed(1)}`).join('');
  const ticks = [1, 10, 20, 30, 50, 75, 100].filter(v => v <= maxPos).filter((v, i, a) => i === 0 || y(v) - y(a[i - 1]) >= 18);
  const xTicks = trend.map((t, i) => i).filter(i => i % Math.ceil(trend.length / 7) === 0);

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const i = Math.round(((px - L) / (W - L - R)) * (trend.length - 1));
    setHover(Math.min(trend.length - 1, Math.max(0, i)));
  };
  const h = hover !== null ? trend[hover] : null;
  const first = trend[0].position, last = trend[trend.length - 1].position;
  const delta = Math.round((first - last) * 10) / 10;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
        <div>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--ink)' }}>Durchschnittliche Position im Zeitverlauf</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Gleitender 7-Tage-Durchschnitt · Platz 1 oben · grüner Bereich = Seite 1</div>
        </div>
        {delta !== 0 && (
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: delta > 0 ? PAGE1 : 'var(--text-muted)' }}>
            {delta > 0 ? `▲ ${pf(delta)} Plätze besser` : `▼ ${pf(-delta)} Plätze schlechter`} als vor {raw.length} Tagen
          </div>
        )}
      </div>
      <div style={{ position: 'relative' }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block', touchAction: 'none' }} onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
          <rect x={L} y={y(1)} width={W - L - R} height={y(10) - y(1)} fill="var(--emerald-pale)" />
          {ticks.map(t => (
            <g key={t}>
              <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke="var(--border)" strokeWidth={1} />
              <text x={L - 8} y={y(t) + 4} fontSize={12} fill="var(--text-muted)" textAnchor="end">{t}</text>
            </g>
          ))}
          {xTicks.map(i => (
            <text key={i} x={x(i)} y={H - 6} fontSize={12} fill="var(--text-muted)" textAnchor="middle">{shortDate(trend[i].date)}</text>
          ))}
          <path d={path} fill="none" stroke={PAGE1} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {h && hover !== null && (
            <>
              <line x1={x(hover)} x2={x(hover)} y1={T} y2={H - B} stroke="var(--ink)" strokeWidth={1} strokeOpacity={0.35} />
              <circle cx={x(hover)} cy={y(h.position)} r={5} fill={PAGE1} stroke="white" strokeWidth={2} />
            </>
          )}
        </svg>
        {h && hover !== null && (
          <Tooltip x={`${(x(hover) / W) * 100}%`} y={`${(y(h.position) / H) * 100}%`}>
            <div style={{ fontWeight: 700 }}>Ø Platz {pf(h.position)}</div>
            <div style={{ opacity: 0.8 }}>Woche bis {shortDate(h.date)} · am Tag: {nf(h.impressions)} × angezeigt, {nf(h.clicks)} Klicks</div>
          </Tooltip>
        )}
      </div>
    </div>
  );
}

function PageStrip({ row }: { row: PageRow }) {
  const [hover, setHover] = useState<number | null>(null);
  const MAX = 100;
  // Square-root scale: gives the decisive range (page 1–2) more room than 50–100.
  const pos = (p: number) => ((Math.sqrt(Math.min(p, MAX)) - 1) / (Math.sqrt(MAX) - 1)) * 100;
  let path = row.page;
  try { const u = new URL(row.page); path = `${u.host}${u.pathname}`; } catch { /* keep raw */ }
  const best = row.keywords.reduce((m, k) => Math.min(m, k.position), Infinity);
  const h = hover !== null ? row.keywords[hover] : null;

  return (
    <div style={{ padding: '0.7rem 0', borderTop: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.45rem' }}>
        <a href={row.page} target="_blank" rel="noopener" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--ink)', textDecoration: 'none', wordBreak: 'break-all' }}>{path}</a>
        <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
          {row.keywords.length} Suchbegriffe · beste Position {pf(best)} · {nf(row.impressions)} × angezeigt
        </span>
      </div>
      <div style={{ position: 'relative', height: 26 }}>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 12, height: 2, background: 'var(--border)' }} />
        <div style={{ position: 'absolute', left: 0, width: `${pos(10)}%`, top: 4, height: 18, background: 'var(--emerald-pale)', borderRadius: 4 }} />
        {row.keywords.map((k, i) => (
          <button
            key={k.keyword}
            type="button"
            aria-label={`${k.keyword}: Position ${pf(k.position)}`}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            onFocus={() => setHover(i)}
            onBlur={() => setHover(null)}
            style={{
              position: 'absolute', left: `${pos(k.position)}%`, top: 1, width: 24, height: 24, marginLeft: -12,
              background: 'transparent', border: 'none', padding: 0, cursor: 'default',
            }}
          >
            <span style={{
              display: 'block', margin: 'auto', width: hover === i ? 12 : 9, height: hover === i ? 12 : 9, borderRadius: '50%',
              background: k.position <= 10 ? PAGE1 : BELOW, boxShadow: '0 0 0 2px white', transition: 'all .12s',
            }} />
          </button>
        ))}
        {h && hover !== null && (
          <Tooltip x={`${pos(h.position)}%`} y="4px">
            <div style={{ fontWeight: 700 }}>Platz {pf(h.position)}</div>
            <div style={{ opacity: 0.8 }}>„{h.keyword}“ · {nf(h.impressions)} × angezeigt · {nf(h.clicks)} Klicks</div>
          </Tooltip>
        )}
      </div>
      <div style={{ position: 'relative', height: 14, fontSize: '0.66rem', color: 'var(--text-muted)' }}>
        {[1, 10, 20, 50, 100].map(t => (
          <span key={t} style={{ position: 'absolute', left: `${pos(t)}%`, transform: t === 1 ? 'none' : t === 100 ? 'translateX(-100%)' : 'translateX(-50%)' }}>
            {t === 1 ? 'Platz 1' : t === 100 ? '100+' : t}
          </span>
        ))}
      </div>
    </div>
  );
}

export function RankingOverview({ websiteId }: { websiteId: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState('');
  const [needsConnect, setNeedsConnect] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showTable, setShowTable] = useState(false);
  const [showAllPages, setShowAllPages] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/keywords/rankings?websiteId=${websiteId}&days=90`)
      .then(r => r.json())
      .then(d => { if (cancelled) return; if (d.buckets) setData(d); else { setError(d.error || 'Ranking konnte nicht geladen werden.'); if (d.connect) setNeedsConnect(true); } })
      .catch(() => { if (!cancelled) setError('Ranking konnte nicht geladen werden.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [websiteId]);

  const stat = (value: string, label: string) => (
    <div>
      <div style={{ fontSize: '1.45rem', fontWeight: 700, color: 'var(--ink)', lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 2 }}>{label}</div>
    </div>
  );

  return (
    <div style={{ marginBottom: '2.5rem' }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: 'var(--ink)', marginBottom: '0.25rem' }}>Google-Ranking</h2>
      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Letzte 90 Tage, aus der Google Search Console.</div>
      <div className="card" style={{ padding: '1.4rem', position: 'relative' }}>
        {loading && <span className="spinner" style={{ color: 'var(--emerald)' }} />}
        {error && <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>{error}</p>}
        {needsConnect && (
          <a href="/api/searchconsole/connect" className="btn-emerald" style={{ display: 'inline-block', marginTop: '0.75rem', padding: '0.5rem 1.1rem', fontSize: '0.82rem' }}>
            Google Search Console verbinden
          </a>
        )}
        {data && data.totals.keywords === 0 && (
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>Google hat diese Website in den letzten 90 Tagen noch zu keinem Suchbegriff angezeigt.</p>
        )}
        {data && data.totals.keywords > 0 && (
          <>
            <div style={{ display: 'flex', gap: '2.2rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
              {stat(nf(data.totals.keywords), 'Suchbegriffe mit Ranking')}
              {stat(nf(data.totals.page1), 'davon auf Seite 1')}
              {stat(data.totals.avgPosition ? pf(data.totals.avgPosition) : '–', 'Ø Position (gewichtet)')}
              {stat(nf(data.totals.clicks), 'Klicks aus Google')}
            </div>

            <div style={{ marginBottom: '1.75rem', maxWidth: 520 }}>
              <Buckets buckets={data.buckets} />
            </div>
            <div style={{ marginBottom: '1.75rem' }}>
              <Trend trend={data.trend} />
            </div>

            {data.pages.length > 0 && (
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.2rem' }}>Seiten und ihre Suchbegriffe</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                  Jeder Punkt ist ein Suchbegriff – je weiter links, desto besser. Der grüne Bereich ist Seite 1. Maus auf einen Punkt für Details.
                </div>
                {(showAllPages ? data.pages : data.pages.slice(0, 8)).map(p => <PageStrip key={p.page} row={p} />)}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                  {data.pages.length > 8 && (
                    <button className="btn-outline" style={{ padding: '0.4rem 0.9rem', fontSize: '0.78rem' }} onClick={() => setShowAllPages(s => !s)}>
                      {showAllPages ? 'Weniger Seiten' : `Alle ${data.pages.length} Seiten`}
                    </button>
                  )}
                  <button className="btn-outline" style={{ padding: '0.4rem 0.9rem', fontSize: '0.78rem' }} onClick={() => setShowTable(s => !s)}>
                    {showTable ? 'Tabelle ausblenden' : 'Als Tabelle anzeigen'}
                  </button>
                </div>
                {showTable && (
                  <div style={{ overflowX: 'auto', marginTop: '0.75rem' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                      <thead>
                        <tr style={{ textAlign: 'left', color: 'var(--text-muted)' }}>
                          <th style={{ padding: '0.35rem 0.5rem' }}>Seite</th>
                          <th style={{ padding: '0.35rem 0.5rem' }}>Suchbegriff</th>
                          <th style={{ padding: '0.35rem 0.5rem', textAlign: 'right' }}>Position</th>
                          <th style={{ padding: '0.35rem 0.5rem', textAlign: 'right' }}>Angezeigt</th>
                          <th style={{ padding: '0.35rem 0.5rem', textAlign: 'right' }}>Klicks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.pages.flatMap(p => p.keywords.map(k => (
                          <tr key={p.page + k.keyword} style={{ borderTop: '1px solid var(--border)' }}>
                            <td style={{ padding: '0.35rem 0.5rem', wordBreak: 'break-all' }}>{(() => { try { const u = new URL(p.page); return `${u.host}${u.pathname}`; } catch { return p.page; } })()}</td>
                            <td style={{ padding: '0.35rem 0.5rem' }}>{k.keyword}</td>
                            <td style={{ padding: '0.35rem 0.5rem', textAlign: 'right' }}>{pf(k.position)}</td>
                            <td style={{ padding: '0.35rem 0.5rem', textAlign: 'right' }}>{nf(k.impressions)}</td>
                            <td style={{ padding: '0.35rem 0.5rem', textAlign: 'right' }}>{nf(k.clicks)}</td>
                          </tr>
                        )))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
