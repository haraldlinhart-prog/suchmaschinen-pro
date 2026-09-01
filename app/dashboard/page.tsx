'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { Website } from '@/types';
import { STATUS_LABELS } from '@/types';
import { WebsiteForm } from '@/components/WebsiteForm';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [websites, setWebsites] = useState<Website[]>([]);
  const [view, setView] = useState<'list' | 'new'>('list');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/auth'); return; }
      setUser(data.user);
      loadWebsites(data.user.id);
    });
  }, [router]);

  const loadWebsites = async (userId: string) => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase.from('sq_websites').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    setWebsites((data || []) as Website[]);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Website wirklich entfernen?')) return;
    const supabase = createClient();
    await supabase.from('sq_websites').delete().eq('id', id);
    setWebsites(prev => prev.filter(w => w.id !== id));
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  };

  if (!user) return <div style={{ padding: '4rem', textAlign: 'center' }}>Wird geladen...</div>;

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '3rem 1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div className="section-label">Mein Konto</div>
          <div className="divider-emerald" />
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: 'var(--ink)' }}>
            Meine Websites
          </h1>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{user.email}</div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={() => setView(view === 'new' ? 'list' : 'new')} className={view === 'new' ? 'btn-outline' : 'btn-emerald'} style={{ padding: '0.6rem 1.25rem', fontSize: '0.88rem' }}>
            {view === 'new' ? '← Meine Websites' : '+ Website hinzufügen'}
          </button>
          <button onClick={handleLogout} className="btn-outline" style={{ padding: '0.6rem 1.25rem', fontSize: '0.88rem' }}>
            Abmelden
          </button>
        </div>
      </div>

      {view === 'new' ? (
        <WebsiteForm userId={user.id} onSuccess={() => { setView('list'); loadWebsites(user.id); }} />
      ) : (
        <>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Websites werden geladen...</div>
          ) : websites.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--white)', border: '1px dashed var(--border)', borderRadius: 12 }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🌐</div>
              <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)', marginBottom: '0.5rem' }}>
                Noch keine Website registriert
              </h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                Fügen Sie Ihre erste Website hinzu, um mit der Analyse zu starten.
              </p>
              <button onClick={() => setView('new')} className="btn-emerald">
                Website hinzufügen
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {websites.map(w => (
                <Link key={w.id} href={`/dashboard/${w.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="card" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      <span className={`badge ${w.status === 'active' ? 'badge-active' : 'badge-pending'}`}>
                        {STATUS_LABELS[w.status]}
                      </span>
                    </div>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--ink)', marginBottom: '0.25rem' }}>
                      {w.domain}
                    </h3>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      {w.label && <>{w.label}{' · '}</>}
                      Hinzugefügt {new Date(w.created_at).toLocaleDateString('de-DE')}
                    </div>
                    {w.notes && <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>{w.notes}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={(e) => { e.preventDefault(); handleDelete(w.id); }} style={{
                      padding: '0.45rem 1rem', background: 'transparent', border: '1px solid #e0a0a0', borderRadius: 8,
                      color: '#b02020', fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'var(--font-body)',
                    }}>
                      Entfernen
                    </button>
                  </div>
                </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
