'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { Website, Article, SuggestedKeyword } from '@/types';
import { rewriteInstructions } from '@/lib/rewriteInstructions';

export default function WebsiteDetailPage() {
  const router = useRouter();
  const params = useParams();
  const websiteId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [website, setWebsite] = useState<Website | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState('');
  const [generatingKeyword, setGeneratingKeyword] = useState<string | null>(null);
  const [publishModal, setPublishModal] = useState<Article | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState('');
  const [editingRepo, setEditingRepo] = useState(false);
  const [repoInput, setRepoInput] = useState('');
  const [savingRepo, setSavingRepo] = useState(false);
  const [editingWp, setEditingWp] = useState(false);
  const [wpUrlInput, setWpUrlInput] = useState('');
  const [wpUserInput, setWpUserInput] = useState('');
  const [wpPassInput, setWpPassInput] = useState('');
  const [savingWp, setSavingWp] = useState(false);
  const [previewArticle, setPreviewArticle] = useState<Article | null>(null);
  const [savingAutomation, setSavingAutomation] = useState(false);

  const loadData = useCallback(async (uid: string) => {
    setLoading(true);
    const supabase = createClient();
    const [{ data: w }, { data: a }] = await Promise.all([
      supabase.from('sq_websites').select('*').eq('id', websiteId).eq('user_id', uid).single(),
      supabase.from('sq_articles').select('*').eq('website_id', websiteId).eq('user_id', uid).order('created_at', { ascending: false }),
    ]);
    setWebsite(w as Website);
    setArticles((a || []) as Article[]);
    setLoading(false);
  }, [websiteId]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/auth'); return; }
      setUser(data.user);
      loadData(data.user.id);
    });
  }, [router, loadData]);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setAnalyzeError('');
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ websiteId }),
      });
      const data = await res.json();
      if (!res.ok) { setAnalyzeError(data.error || 'Analyse fehlgeschlagen.'); setAnalyzing(false); return; }
      if (user) await loadData(user.id);
    } catch {
      setAnalyzeError('Analyse fehlgeschlagen. Bitte erneut versuchen.');
    }
    setAnalyzing(false);
  };

  const handleGenerateArticle = async (kw: SuggestedKeyword) => {
    setGeneratingKeyword(kw.keyword);
    try {
      const res = await fetch('/api/generate-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ websiteId, keyword: kw.keyword, rationale: kw.rationale, intent: kw.intent }),
      });
      const data = await res.json();
      if (res.ok && user) await loadData(user.id);
      else alert(data.error || 'Fehler bei der Artikel-Generierung.');
    } catch {
      alert('Fehler bei der Artikel-Generierung.');
    }
    setGeneratingKeyword(null);
  };

  const handlePublish = async () => {
    if (!publishModal) return;
    setPublishing(true);
    setPublishError('');
    try {
      const res = await fetch('/api/publish-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId: publishModal.id }),
      });
      const data = await res.json();
      if (!res.ok) { setPublishError(data.error || 'Veröffentlichung fehlgeschlagen.'); setPublishing(false); return; }
      setPublishModal(null);
      if (user) await loadData(user.id);
    } catch {
      setPublishError('Veröffentlichung fehlgeschlagen.');
    }
    setPublishing(false);
  };

  const handleSaveRepo = async () => {
    const cleaned = repoInput.trim().replace(/^https?:\/\/github\.com\//, '').replace(/\/$/, '');
    if (cleaned && !/^[\w.-]+\/[\w.-]+$/.test(cleaned)) {
      alert('Bitte im Format "owner/repo" angeben.');
      return;
    }
    setSavingRepo(true);
    const supabase = createClient();
    const { error } = await supabase.from('sq_websites').update({ github_repo: cleaned || null }).eq('id', websiteId);
    setSavingRepo(false);
    if (error) { alert('Fehler beim Speichern.'); return; }
    setEditingRepo(false);
    if (user) await loadData(user.id);
  };

  const handleSaveWp = async () => {
    if (!wpUrlInput.trim() || !wpUserInput.trim() || !wpPassInput.trim()) {
      alert('Bitte URL, Benutzername und Anwendungspasswort angeben.');
      return;
    }
    setSavingWp(true);
    const supabase = createClient();
    const { error } = await supabase.from('sq_websites').update({
      wp_url: wpUrlInput.trim().replace(/\/$/, ''),
      wp_username: wpUserInput.trim(),
      wp_app_password: wpPassInput.trim(),
    }).eq('id', websiteId);
    setSavingWp(false);
    if (error) { alert('Fehler beim Speichern.'); return; }
    setEditingWp(false);
    setWpPassInput('');
    if (user) await loadData(user.id);
  };

  const handleTogglePlan = async (plan: 'basic' | 'plus') => {
    setSavingAutomation(true);
    const supabase = createClient();
    await supabase.from('sq_websites').update({ plan }).eq('id', websiteId);
    setSavingAutomation(false);
    if (user) await loadData(user.id);
  };

  const handleToggleAutoPublish = async (enabled: boolean) => {
    setSavingAutomation(true);
    const supabase = createClient();
    await supabase.from('sq_websites').update({ auto_publish: enabled }).eq('id', websiteId);
    setSavingAutomation(false);
    if (user) await loadData(user.id);
  };

  if (loading || !website) return <div style={{ padding: '4rem', textAlign: 'center' }}>Wird geladen...</div>;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '3rem 1.5rem' }}>
      <Link href="/dashboard" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textDecoration: 'none' }}>&larr; Meine Websites</Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', margin: '1rem 0 2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: 'var(--ink)' }}>{website.domain}</h1>
          {website.label && <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{website.label}</div>}
          {website.hosting_platform === 'network' && (
            editingRepo ? (
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.4rem' }}>
                <input
                  type="text"
                  value={repoInput}
                  onChange={e => setRepoInput(e.target.value)}
                  placeholder="owner/repo"
                  className="form-input"
                  style={{ fontSize: '0.82rem', padding: '0.4rem 0.7rem', maxWidth: 220 }}
                />
                <button onClick={handleSaveRepo} disabled={savingRepo} className="btn-emerald" style={{ padding: '0.4rem 0.9rem', fontSize: '0.78rem' }}>
                  {savingRepo ? '…' : 'Speichern'}
                </button>
                <button onClick={() => setEditingRepo(false)} className="btn-outline" style={{ padding: '0.4rem 0.9rem', fontSize: '0.78rem' }}>
                  Abbrechen
                </button>
              </div>
            ) : (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                {website.github_repo ? (
                  <>GitHub: {website.github_repo} · </>
                ) : (
                  <>Kein GitHub-Repo hinterlegt · </>
                )}
                <button
                  onClick={() => { setRepoInput(website.github_repo || ''); setEditingRepo(true); }}
                  style={{ background: 'none', border: 'none', color: 'var(--emerald)', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem', padding: 0, fontFamily: 'var(--font-body)' }}
                >
                  {website.github_repo ? 'ändern' : 'jetzt verknüpfen'}
                </button>
              </div>
            )
          )}
          {website.hosting_platform === 'wordpress' && (
            editingWp ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem', maxWidth: 280 }}>
                <a href="/hilfe/wordpress" target="_blank" rel="noopener" style={{ fontSize: '0.78rem', color: 'var(--emerald)', fontWeight: 600 }}>Ausführliche Anleitung →</a>
                <input type="text" value={wpUrlInput} onChange={e => setWpUrlInput(e.target.value)} placeholder="https://ihredomain.de" className="form-input" style={{ fontSize: '0.82rem', padding: '0.4rem 0.7rem' }} />
                <input type="text" value={wpUserInput} onChange={e => setWpUserInput(e.target.value)} placeholder="Benutzername" className="form-input" style={{ fontSize: '0.82rem', padding: '0.4rem 0.7rem' }} />
                <input type="password" value={wpPassInput} onChange={e => setWpPassInput(e.target.value)} placeholder="Anwendungspasswort" className="form-input" style={{ fontSize: '0.82rem', padding: '0.4rem 0.7rem' }} />
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={handleSaveWp} disabled={savingWp} className="btn-emerald" style={{ padding: '0.4rem 0.9rem', fontSize: '0.78rem' }}>
                    {savingWp ? '…' : 'Speichern'}
                  </button>
                  <button onClick={() => setEditingWp(false)} className="btn-outline" style={{ padding: '0.4rem 0.9rem', fontSize: '0.78rem' }}>
                    Abbrechen
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                {website.wp_url ? (
                  <>WordPress: {website.wp_url} · </>
                ) : (
                  <>Keine WordPress-Zugangsdaten hinterlegt · </>
                )}
                <button
                  onClick={() => { setWpUrlInput(website.wp_url || ''); setWpUserInput(website.wp_username || ''); setWpPassInput(''); setEditingWp(true); }}
                  style={{ background: 'none', border: 'none', color: 'var(--emerald)', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem', padding: 0, fontFamily: 'var(--font-body)' }}
                >
                  {website.wp_url ? 'ändern' : 'jetzt verknüpfen'}
                </button>
              </div>
            )
          )}
        </div>
        <button onClick={handleAnalyze} disabled={analyzing} className="btn-emerald" style={{ opacity: analyzing ? 0.7 : 1 }}>
          {analyzing ? 'Analysiere…' : website.suggested_keywords ? 'Erneut analysieren' : 'Website analysieren'}
        </button>
      </div>

      {analyzeError && (
        <div style={{ background: '#fce8e8', border: '1px solid #f5a5a5', padding: '0.85rem', fontSize: '0.85rem', color: '#b02020', borderRadius: 8, marginBottom: '1.5rem' }}>
          {analyzeError}
        </div>
      )}

      {!website.suggested_keywords && !analyzing && (
        <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--white)', border: '1px dashed var(--border)', borderRadius: 12, marginBottom: '2rem' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
            Noch keine Analyse vorhanden. Klicken Sie auf &quot;Website analysieren&quot;, um relevante Suchbegriffe zu finden.
          </p>
        </div>
      )}

      {website.suggested_keywords && (
        <div style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: 'var(--ink)', marginBottom: '0.25rem' }}>Vorgeschlagene Suchbegriffe</h2>
          {website.last_analyzed_at && (
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Zuletzt analysiert: {new Date(website.last_analyzed_at).toLocaleString('de-DE')}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {website.suggested_keywords.map((kw, i) => {
              const hasArticle = articles.some(a => a.keyword === kw.keyword);
              return (
                <div key={i} className="card" style={{ padding: '1.1rem 1.4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--ink)' }}>{kw.keyword}</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{kw.rationale}</div>
                    <span className="badge badge-pending" style={{ marginTop: '0.4rem', display: 'inline-block' }}>{kw.intent}</span>
                  </div>
                  <button
                    onClick={() => handleGenerateArticle(kw)}
                    disabled={generatingKeyword === kw.keyword || hasArticle}
                    className="btn-outline"
                    style={{ padding: '0.5rem 1.1rem', fontSize: '0.82rem', opacity: hasArticle ? 0.5 : 1 }}
                  >
                    {generatingKeyword === kw.keyword ? 'Wird geschrieben…' : hasArticle ? 'Artikel vorhanden' : 'Artikel generieren'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="card" style={{ padding: '1.5rem', marginBottom: '2.5rem' }}>
        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--ink)', marginBottom: '0.75rem' }}>Automatische Veröffentlichung</div>
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Plan</div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => handleTogglePlan('basic')} disabled={savingAutomation}
                className={website.plan === 'basic' ? 'btn-emerald' : 'btn-outline'} style={{ padding: '0.4rem 0.9rem', fontSize: '0.78rem' }}>
                Basic — 1×/Woche
              </button>
              <button onClick={() => handleTogglePlan('plus')} disabled={savingAutomation}
                className={website.plan === 'plus' ? 'btn-emerald' : 'btn-outline'} style={{ padding: '0.4rem 0.9rem', fontSize: '0.78rem' }}>
                Plus — 1×/Tag
              </button>
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Status</div>
            <button onClick={() => handleToggleAutoPublish(!website.auto_publish)} disabled={savingAutomation}
              className={website.auto_publish ? 'btn-emerald' : 'btn-outline'} style={{ padding: '0.4rem 0.9rem', fontSize: '0.78rem' }}>
              {website.auto_publish ? 'Aktiv — ausschalten' : 'Inaktiv — einschalten'}
            </button>
          </div>
        </div>
        {website.auto_publish && (
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.9rem', marginBottom: 0 }}>
            {website.last_auto_published_at
              ? `Letzter automatischer Artikel: ${new Date(website.last_auto_published_at).toLocaleString('de-DE')}`
              : 'Noch kein automatischer Artikel veröffentlicht — der nächste Lauf startet automatisch.'}
          </p>
        )}
      </div>

      {website.hosting_platform !== 'network' && website.hosting_platform !== 'wordpress' && (
        <div className="card" style={{ padding: '1.5rem', marginBottom: '2.5rem', borderColor: 'var(--emerald)', borderWidth: 1.5 }}>
          {(() => {
            const info = rewriteInstructions(website.hosting_platform, website.publish_path, website.public_slug);
            return (
              <>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--ink)', marginBottom: '0.5rem' }}>
                  Einmalige Einrichtung: {info.title}
                </div>
                {info.steps.map((s, i) => (
                  <p key={i} style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 0.5rem' }}>{s}</p>
                ))}
                {info.snippet && (
                  <pre style={{ background: 'var(--paper-dark)', padding: '1rem', borderRadius: 8, fontSize: '0.8rem', overflow: 'auto', marginTop: '0.5rem' }}>
                    {info.snippet}
                  </pre>
                )}
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.75rem', marginBottom: 0 }}>
                  Sobald das eingerichtet ist, erscheinen veröffentlichte Artikel automatisch unter <strong>{website.domain}{website.publish_path}</strong>.
                </p>
              </>
            );
          })()}
        </div>
      )}

      {articles.length > 0 && (
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: 'var(--ink)', marginBottom: '1rem' }}>Generierte Artikel</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {articles.map(article => (
              <div key={article.id} className="card" style={{ padding: '1.1rem 1.4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 220 }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.3rem' }}>
                    <span className={`badge ${article.status === 'published' ? 'badge-active' : 'badge-pending'}`}>
                      {article.status === 'published' ? 'Veröffentlicht' : 'Entwurf'}
                    </span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--ink)' }}>{article.title}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Keyword: {article.keyword}</div>
                  {(article.status === 'published') && article.published_url && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--emerald)', marginTop: '0.2rem' }}>
                      {article.published_url}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => setPreviewArticle(article)} className="btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.82rem' }}>
                    Vorschau
                  </button>
                  {article.status === 'draft' && (
                    <button
                      onClick={() => { setPublishModal(article); setPublishError(''); }}
                      className="btn-emerald"
                      style={{ padding: '0.5rem 1rem', fontSize: '0.82rem' }}
                    >
                      Veröffentlichen
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {previewArticle && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(11,31,28,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', zIndex: 100 }}
          onClick={() => setPreviewArticle(null)}>
          <div style={{ background: 'white', borderRadius: 12, maxWidth: 700, width: '100%', maxHeight: '85vh', overflow: 'auto', padding: '2rem' }}
            onClick={e => e.stopPropagation()}>
            <button onClick={() => setPreviewArticle(null)} style={{ float: 'right', background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: 'var(--text-muted)' }}>×</button>
            <div dangerouslySetInnerHTML={{ __html: previewArticle.content_html }} />
          </div>
        </div>
      )}

      {publishModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(11,31,28,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', zIndex: 100 }}>
          <div className="card" style={{ maxWidth: 440, width: '100%', padding: '2rem' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', marginBottom: '0.5rem', color: 'var(--ink)' }}>Artikel veröffentlichen</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.2rem' }}>
              {website.github_repo ? (
                <>Wird als <code>{website.publish_path.replace(/^\//, '')}{publishModal.slug}/index.html</code> in <strong>{website.github_repo}</strong> committet und löst ein automatisches Deployment aus.</>
              ) : website.hosting_platform === 'wordpress' ? (
                <>Wird direkt als neuer WordPress-Beitrag auf <strong>{website.wp_url}</strong> veröffentlicht.</>
              ) : (
                <>Wird bei suchmaschinen.pro veröffentlicht und erscheint unter <strong>{website.publish_path}</strong> auf {website.domain}, sobald die Weiterleitung eingerichtet ist (siehe Hinweis unten auf der Seite).</>
              )}
            </p>
            {publishError && (
              <div style={{ background: '#fce8e8', border: '1px solid #f5a5a5', padding: '0.75rem', fontSize: '0.85rem', color: '#b02020', borderRadius: 8, marginBottom: '1rem' }}>
                {publishError}
              </div>
            )}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setPublishModal(null)} className="btn-outline" style={{ padding: '0.6rem 1.2rem', fontSize: '0.85rem' }}>
                Abbrechen
              </button>
              <button onClick={handlePublish} disabled={publishing} className="btn-emerald" style={{ padding: '0.6rem 1.2rem', fontSize: '0.85rem', opacity: publishing ? 0.7 : 1 }}>
                {publishing ? 'Wird veröffentlicht…' : 'Jetzt veröffentlichen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
