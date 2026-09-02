'use client';

interface Props {
  data: { date: string; sessions: number; activeUsers: number }[];
}

export function AnalyticsChart({ data }: Props) {
  if (data.length === 0) return null;

  const width = 720;
  const height = 220;
  const padding = 36;
  const maxVal = Math.max(1, ...data.map(d => Math.max(d.sessions, d.activeUsers)));

  const x = (i: number) => padding + (i / Math.max(1, data.length - 1)) * (width - padding * 2);
  const y = (v: number) => height - padding - (v / maxVal) * (height - padding * 2);

  const linePath = (key: 'sessions' | 'activeUsers') =>
    data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(d[key]).toFixed(1)}`).join(' ');

  const totalSessions = data.reduce((s, d) => s + d.sessions, 0);
  const totalUsers = data.reduce((s, d) => s + d.activeUsers, 0);
  const formatDate = (raw: string) => `${raw.slice(6, 8)}.${raw.slice(4, 6)}.`;

  return (
    <div>
      <div style={{ display: 'flex', gap: '2rem', marginBottom: '1rem' }}>
        <div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--ink)' }}>{totalSessions.toLocaleString('de-DE')}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: 'var(--emerald)', marginRight: '0.35rem' }} />
            Sitzungen (Zeitraum)
          </div>
        </div>
        <div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--ink)' }}>{totalUsers.toLocaleString('de-DE')}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#94a3b8', marginRight: '0.35rem' }} />
            Nutzer (Zeitraum)
          </div>
        </div>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto' }}>
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="var(--border)" strokeWidth={1} />
        <path d={linePath('sessions')} fill="none" stroke="var(--emerald)" strokeWidth={2} />
        <path d={linePath('activeUsers')} fill="none" stroke="#94a3b8" strokeWidth={2} strokeDasharray="4 3" />
        {data.map((d, i) =>
          i % Math.ceil(data.length / 6) === 0 ? (
            <text key={d.date} x={x(i)} y={height - padding + 16} fontSize={10} fill="var(--text-muted)" textAnchor="middle">
              {formatDate(d.date)}
            </text>
          ) : null
        )}
      </svg>
    </div>
  );
}
