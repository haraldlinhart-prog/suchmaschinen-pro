'use client';
import { useRef } from 'react';

export default function VideoTutorial() {
  const videoRef = useRef<HTMLVideoElement>(null);

  const toggle = () => {
    const v = videoRef.current;
    if (!v) return;
    v.paused ? v.play() : v.pause();
  };

  const seek = (sec: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(v.duration || 0, v.currentTime + sec));
  };

  const btnStyle: React.CSSProperties = {
    background: 'var(--emerald)',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    padding: '0.35rem 0.8rem',
    fontSize: '0.82rem',
    cursor: 'pointer',
    fontFamily: 'var(--font-display)',
  };

  return (
    <div style={{ background: 'var(--emerald-pale)', border: '1px solid var(--emerald)', borderRadius: 8, padding: '1rem 1.2rem', margin: '1.2rem 0' }}>
      <strong style={{ fontSize: '0.88rem', color: 'var(--ink)' }}>🎬 Video-Anleitung: Page-ID und Token in 2 Minuten</strong>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.3rem 0 0.5rem' }}>
        Das folgende Video zeigt die wichtigsten Schritte — wie Sie den Graph API Explorer öffnen, die Berechtigungen aktivieren und mit <code>me/accounts</code> in einem Schritt Page-ID und Token abrufen.
      </p>
      <p style={{ fontSize: '0.82rem', background: 'rgba(0,0,0,0.04)', borderRadius: 5, padding: '0.45rem 0.7rem', margin: '0 0 0.8rem', color: 'var(--ink)' }}>
        <strong>Was Sie im Video sehen:</strong> den <a href="https://developers.facebook.com/tools/explorer" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--emerald)' }}>Meta Graph API Explorer</a> — ein kostenloses Tool auf developers.facebook.com. Sie rufen ihn auf, wählen Ihre App aus und geben die Abfrage <code>me/accounts</code> ein. Das Ergebnis zeigt Page-ID und Token für jede Ihrer Facebook-Seiten. Damit der Token dauerhaft gilt, führen Sie anschließend Schritt 5 aus.
      </p>
      <video
        ref={videoRef}
        src="/facebook-page-token.mp4"
        style={{ width: '100%', borderRadius: 6, border: '1px solid var(--border)', display: 'block', cursor: 'pointer' }}
        playsInline
        onClick={toggle}
      />
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <button style={btnStyle} onClick={() => seek(-3)}>⏮ −3s</button>
        <button style={btnStyle} onClick={toggle}>▶ / ⏸</button>
        <button style={btnStyle} onClick={() => seek(3)}>+3s ⏭</button>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: '0.3rem' }}>
          Zum Abspielen oder Pausieren ins Video klicken
        </span>
        <a
          href="/facebook-page-token.mp4"
          target="_blank"
          rel="noopener noreferrer"
          style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--emerald)', textDecoration: 'none', whiteSpace: 'nowrap' }}
        >
          🔗 Video in neuem Tab öffnen
        </a>
      </div>
    </div>
  );
}
