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
      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.3rem 0 0.8rem' }}>
        Das folgende Video zeigt die wichtigsten Schritte — wie du den Graph API Explorer öffnest, die Berechtigungen aktivierst und mit <code>me/accounts</code> in einem Schritt sowohl Page-ID als auch Token bekommst.
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
          Klick ins Video zum Pausieren
        </span>
      </div>
    </div>
  );
}
