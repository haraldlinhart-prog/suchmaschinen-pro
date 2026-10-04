'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { Website, Article, SuggestedKeyword } from '@/types';
import { rewriteInstructions } from '@/lib/rewriteInstructions';
import { isAdminEmail } from '@/lib/supabase/admin';
import { GA_FOR_CUSTOMERS } from '@/lib/features';
import { AnalyticsChart } from '@/components/AnalyticsChart';
import { RankingOverview } from '@/components/RankingOverview';
import { KeywordWorkbench, useKeywordVolumes, VolumeLabel, AdsPriceNote } from '@/components/KeywordWorkbench';

const ANALYZE_MESSAGES = [
  'Website wird geladen…',
  'Inhalte werden gelesen…',
  'Relevante Themen werden identifiziert…',
  'Suchbegriffe werden mit KI bewertet…',
  'Fast fertig…',
];
const GENERATE_MESSAGES = [
  'Recherche zum Suchbegriff…',
  'Artikelstruktur wird entworfen…',
  'Text wird geschrieben…',
  'Feinschliff…',
];
const PUBLISH_MESSAGES = ['Artikel wird übertragen…', 'Seite wird erzeugt…', 'Fast fertig…'];

function useRotatingMessage(active: boolean, messages: string[], intervalMs = 2200): string {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!active) { setI(0); return; }
    const id = setInterval(() => setI(prev => (prev + 1) % messages.length), intervalMs);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);
  return messages[i];
}

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
  const [editingFb, setEditingFb] = useState(false);
  const [fbPageIdInput, setFbPageIdInput] = useState('');
  const [fbTokenInput, setFbTokenInput] = useState('');
  const [savingFb, setSavingFb] = useState(false);
  const [checkingFb, setCheckingFb] = useState(false);
  const [fbCheckResult, setFbCheckResult] = useState<{
    ok: boolean; issues: string[]; pageName: string | null; expiryNote?: string;
    instagram?: { id: string; username: string | null } | null;
    instagramReady?: boolean;
    instagramIssue?: string | null;
  } | null>(null);
  const [igEnabled, setIgEnabled] = useState(true);
  const [previewArticle, setPreviewArticle] = useState<Article | null>(null);
  const [savingAutomation, setSavingAutomation] = useState(false);

  const [gaProperties, setGaProperties] = useState<{ property: string; displayName: string; account: string; domain?: string }[] | null>(null);
  const [gaPropertyFilter, setGaPropertyFilter] = useState('');
  const [gaLoadingProperties, setGaLoadingProperties] = useState(false);
  const [gaChartData, setGaChartData] = useState<{ date: string; sessions: number; activeUsers: number }[] | null>(null);
  const [gaChartLoading, setGaChartLoading] = useState(false);
  const [gaError, setGaError] = useState('');
  const [gaNeedsReconnect, setGaNeedsReconnect] = useState(false);

  const analyzeMessage = useRotatingMessage(analyzing, ANALYZE_MESSAGES);
  const generateMessage = useRotatingMessage(!!generatingKeyword, GENERATE_MESSAGES);
  const publishMessage = useRotatingMessage(publishing, PUBLISH_MESSAGES);

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

  // Runs debug_token (+ a live call against the specific page) before anything is
  // saved — this is what would have caught turnkey-companies.com's expired/wrong-type
  // token immediately instead of silently breaking Facebook posting for days.
  const checkFbToken = async (): Promise<boolean> => {
    if (!fbPageIdInput.trim() || !fbTokenInput.trim()) {
      setFbCheckResult({ ok: false, issues: ['Bitte Page-ID und Token angeben.'], pageName: null });
      return false;
    }
    setCheckingFb(true);
    setFbCheckResult(null);
    try {
      const res = await fetch('/api/facebook/verify-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId: fbPageIdInput.trim(), token: fbTokenInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFbCheckResult({ ok: false, issues: [data.error || 'Prüfung fehlgeschlagen.'], pageName: null });
        return false;
      }
      setFbCheckResult(data);
      return data.ok;
    } catch {
      setFbCheckResult({ ok: false, issues: ['Prüfung fehlgeschlagen (Netzwerkfehler).'], pageName: null });
      return false;
    } finally {
      setCheckingFb(false);
    }
  };

  const handleSaveFb = async () => {
    const valid = await checkFbToken();
    if (!valid) return; // fbCheckResult now shows why — nothing is saved until it's fixed
    setSavingFb(true);
    const supabase = createClient();
    // Instagram is posted with the same page token — only stored when the check found a
    // linked IG account with publish rights and the user left the checkbox on.
    const ig = fbCheckResult?.instagramReady && igEnabled ? fbCheckResult.instagram : null;
    const { error } = await supabase.from('sq_websites').update({
      facebook_page_id: fbPageIdInput.trim() || null,
      facebook_page_token: fbTokenInput.trim() || null,
      instagram_account_id: ig?.id ?? null,
      instagram_username: ig?.username ?? null,
    }).eq('id', websiteId);
    setSavingFb(false);
    if (error) { alert('Fehler beim Speichern.'); return; }
    setEditingFb(false);
    setFbTokenInput('');
    setFbCheckResult(null);
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

  const handleUpgrade = async (plan: 'free' | 'basic' | 'pro' | 'premium') => {
    setSavingAutomation(true);
    try {
      // Admin account: set the plan directly, no Stripe charge (see chat 02.09.26 —
      // avoids Harry having to pay-and-refund himself for every network site he adds).
      if (isAdminEmail(user?.email)) {
        const res = await fetch('/api/admin-set-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ website_id: websiteId, plan }),
        });
        const data = await res.json();
        if (res.ok) { if (user) await loadData(user.id); setSavingAutomation(false); return; }
        alert(data.error || 'Tarif konnte nicht gesetzt werden.');
        setSavingAutomation(false);
        return;
      }

      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ website_id: websiteId, plan }),
      });
      const data = await res.json();
      if (res.ok && data.url) { window.location.href = data.url; return; }
      alert(data.error || 'Checkout konnte nicht gestartet werden.');
    } catch {
      alert('Checkout konnte nicht gestartet werden.');
    }
    setSavingAutomation(false);
  };

  const handleToggleAutoPublish = async (enabled: boolean) => {
    setSavingAutomation(true);
    const supabase = createClient();
    await supabase.from('sq_websites').update({ auto_publish: enabled }).eq('id', websiteId);
    setSavingAutomation(false);
    if (user) await loadData(user.id);
  };

  // If we just came back from Stripe Checkout, confirm the session immediately
  // (no webhook — see /api/confirm-checkout).
  useEffect(() => {
    const sessionId = new URLSearchParams(window.location.search).get('session_id');
    if (!sessionId) return;
    fetch(`/api/confirm-checkout?session_id=${sessionId}`)
      .then(() => { if (user) loadData(user.id); })
      .finally(() => window.history.replaceState({}, '', window.location.pathname));
  }, [user, loadData]);

  // Clear the ga_connected / ga_error markers Google's OAuth redirect leaves in the URL.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('ga_error')) { setGaError('Google Analytics konnte nicht verbunden werden.'); window.history.replaceState({}, '', window.location.pathname); }
    else if (params.get('ga_connected')) { window.history.replaceState({}, '', window.location.pathname); }
  }, []);

  // Once connected but no property chosen yet, load the list of GA4 properties to pick from.
  useEffect(() => {
    if (!website?.ga_refresh_token || website.ga_property_id) return;
    setGaLoadingProperties(true);
    fetch(`/api/analytics/properties?websiteId=${websiteId}`)
      .then(res => res.json())
      .then(data => {
        if (data.properties) {
          setGaProperties(data.properties);
          // Auto-pick when the enriched domain matches exactly — no need to search.
          const exact = data.properties.find((p: { domain?: string }) => p.domain === website.domain);
          if (exact) { handleSelectGaProperty(exact); return; }
          // Otherwise pre-fill the search with the site's own domain root (e.g.
          // "turnkey-companies" for turnkey-companies.com).
          setGaPropertyFilter(website.domain.split('.')[0]);
        } else {
          setGaError(data.error || 'Properties konnten nicht geladen werden.');
          if (data.reconnect) setGaNeedsReconnect(true);
        }
      })
      .catch(() => setGaError('Properties konnten nicht geladen werden.'))
      .finally(() => setGaLoadingProperties(false));
  }, [website?.ga_refresh_token, website?.ga_property_id, websiteId]);

  // Once a property is chosen, load the last 30 days of sessions/users.
  useEffect(() => {
    if (!website?.ga_property_id) return;
    setGaChartLoading(true);
    fetch(`/api/analytics/data?websiteId=${websiteId}&days=30`)
      .then(res => res.json())
      .then(data => {
        if (data.rows) { setGaChartData(data.rows); return; }
        setGaError(data.error || 'Daten konnten nicht geladen werden.');
        if (data.reconnect) setGaNeedsReconnect(true);
      })
      .catch(() => setGaError('Daten konnten nicht geladen werden.'))
      .finally(() => setGaChartLoading(false));
  }, [website?.ga_property_id, websiteId]);

  const handleSelectGaProperty = async (p: { property: string; displayName: string }) => {
    await fetch('/api/analytics/select-property', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ websiteId, propertyId: p.property, propertyName: p.displayName }),
    });
    if (user) await loadData(user.id);
  };

  const suggestedVolumes = useKeywordVolumes((website?.suggested_keywords || []).map(k => k.keyword));

  const handleQueueKeyword = async (kw: SuggestedKeyword) => {
    const res = await fetch('/api/keywords/queue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ websiteId, keyword: kw.keyword, rationale: kw.rationale, intent: kw.intent }),
    });
    if (res.ok && user) await loadData(user.id);
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
          {editingFb ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem', maxWidth: 320 }}>
              <a href="/hilfe/facebook" target="_blank" rel="noopener" style={{ fontSize: '0.78rem', color: 'var(--emerald)', fontWeight: 600 }}>📘 Token erstellen →</a>
              <input type="text" value={fbPageIdInput} onChange={e => { setFbPageIdInput(e.target.value); setFbCheckResult(null); }} placeholder="Facebook Page-ID (z. B. 123456789012345)" className="form-input" style={{ fontSize: '0.82rem', padding: '0.4rem 0.7rem' }} />
              <input type="password" value={fbTokenInput} onChange={e => { setFbTokenInput(e.target.value); setFbCheckResult(null); }} placeholder="Page Access Token (EAAxxxxxxx…)" className="form-input" style={{ fontSize: '0.82rem', padding: '0.4rem 0.7rem' }} />
              {fbCheckResult && (
                <div style={{
                  fontSize: '0.78rem',
                  padding: '0.5rem 0.65rem',
                  borderRadius: 6,
                  background: fbCheckResult.ok ? '#e8f7ee' : '#fce8e8',
                  border: `1px solid ${fbCheckResult.ok ? '#8fd4ac' : '#f5a5a5'}`,
                  color: fbCheckResult.ok ? '#1a7a42' : '#b02020',
                }}>
                  {fbCheckResult.ok ? (
                    <>
                      ✓ Gültiges Page-Token für „{fbCheckResult.pageName}" · {fbCheckResult.expiryNote}
                      {fbCheckResult.instagramReady && fbCheckResult.instagram ? (
                        <label style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginTop: '0.4rem', cursor: 'pointer' }}>
                          <input type="checkbox" checked={igEnabled} onChange={e => setIgEnabled(e.target.checked)} />
                          Auch auf Instagram posten{fbCheckResult.instagram.username ? ` (@${fbCheckResult.instagram.username})` : ''}
                        </label>
                      ) : fbCheckResult.instagramIssue ? (
                        <div style={{ marginTop: '0.4rem', color: '#8a5a00' }}>Instagram: {fbCheckResult.instagramIssue}</div>
                      ) : null}
                    </>
                  ) : (
                    <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>
                      {fbCheckResult.issues.map((issue, i) => <li key={i}>{issue}</li>)}
                    </ul>
                  )}
                </div>
              )}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={checkFbToken} disabled={checkingFb || savingFb} className="btn-outline" style={{ padding: '0.4rem 0.9rem', fontSize: '0.78rem' }}>
                  {checkingFb ? 'Prüfe…' : 'Token prüfen'}
                </button>
                <button onClick={handleSaveFb} disabled={savingFb || checkingFb} className="btn-emerald" style={{ padding: '0.4rem 0.9rem', fontSize: '0.78rem' }}>
                  {savingFb ? '…' : 'Speichern'}
                </button>
                <button onClick={() => { setEditingFb(false); setFbCheckResult(null); }} className="btn-outline" style={{ padding: '0.4rem 0.9rem', fontSize: '0.78rem' }}>
                  Abbrechen
                </button>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
              {website.facebook_page_id ? (
                <>📘 Facebook-Seite: {website.facebook_page_id} · </>
              ) : (
                <>📘 Keine Facebook-Seite verknüpft · </>
              )}
              <button
                onClick={() => { setFbPageIdInput(website.facebook_page_id || ''); setFbTokenInput(''); setIgEnabled(true); setEditingFb(true); }}
                style={{ background: 'none', border: 'none', color: 'var(--emerald)', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem', padding: 0, fontFamily: 'var(--font-body)' }}
              >
                {website.facebook_page_id ? 'ändern' : 'jetzt verknüpfen'}
              </button>
              {website.instagram_account_id && (
                <div style={{ marginTop: '0.2rem' }}>📸 Instagram: {website.instagram_username ? `@${website.instagram_username}` : website.instagram_account_id}</div>
              )}
            </div>
          )}
        </div>
        <button onClick={handleAnalyze} disabled={analyzing} className="btn-emerald" style={{ opacity: analyzing ? 0.7 : 1, display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          {analyzing && <span className="spinner" />}
          {analyzing ? 'Analysiere…' : website.suggested_keywords ? 'Erneut analysieren' : 'Website analysieren'}
        </button>
      </div>

      {analyzeError && (
        <div style={{ background: '#fce8e8', border: '1px solid #f5a5a5', padding: '0.85rem', fontSize: '0.85rem', color: '#b02020', borderRadius: 8, marginBottom: '1.5rem' }}>
          {analyzeError}
        </div>
      )}

      {analyzing && (
        <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--white)', border: '1px dashed var(--border)', borderRadius: 12, marginBottom: '2rem' }}>
          <span className="spinner" style={{ width: '1.6rem', height: '1.6rem', color: 'var(--emerald)', marginBottom: '1rem' }} />
          <p className="progress-message" style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginTop: '1rem' }}>
            {analyzeMessage}
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '0.4rem' }}>
            Das kann bei größeren Websites bis zu einer Minute dauern.
          </p>
        </div>
      )}

      {!website.suggested_keywords && !analyzing && (
        <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--white)', border: '1px dashed var(--border)', borderRadius: 12, marginBottom: '2rem' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
            Noch keine Analyse vorhanden. Klicken Sie auf &quot;Website analysieren&quot;, um relevante Suchbegriffe zu finden.
          </p>
        </div>
      )}

      <div className="card" style={{ padding: '1.5rem', marginBottom: '2.5rem' }}>
        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--ink)', marginBottom: '0.75rem' }}>Automatische Veröffentlichung</div>
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Tarif</div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                disabled={!isAdminEmail(user?.email) || savingAutomation || website.plan === 'free'}
                onClick={isAdminEmail(user?.email) ? () => handleUpgrade('free') : undefined}
                className={website.plan === 'free' ? 'btn-emerald' : 'btn-outline'}
                style={{ padding: '0.4rem 0.9rem', fontSize: '0.78rem', opacity: website.plan === 'free' ? 1 : 0.6, cursor: isAdminEmail(user?.email) ? 'pointer' : 'default' }}>
                Free — alle 2 Wochen
              </button>
              <button onClick={() => handleUpgrade('basic')} disabled={savingAutomation || website.plan === 'basic'}
                className={website.plan === 'basic' ? 'btn-emerald' : 'btn-outline'} style={{ padding: '0.4rem 0.9rem', fontSize: '0.78rem' }}>
                Basic — 1×/Woche · 19 €/Monat
              </button>
              <button onClick={() => handleUpgrade('pro')} disabled={savingAutomation || website.plan === 'pro'}
                className={website.plan === 'pro' ? 'btn-emerald' : 'btn-outline'} style={{ padding: '0.4rem 0.9rem', fontSize: '0.78rem' }}>
                Pro — alle 2 Tage · 29 €/Monat
              </button>
              <button onClick={() => handleUpgrade('premium')} disabled={savingAutomation || website.plan === 'premium'}
                className={website.plan === 'premium' ? 'btn-emerald' : 'btn-outline'} style={{ padding: '0.4rem 0.9rem', fontSize: '0.78rem' }}>
                Premium — täglich · 49 €/Monat
              </button>
            </div>
            {website.plan !== 'free' && (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                Abrechnungsstatus: {website.billing_status === 'active' ? 'aktiv' : website.billing_status === 'past_due' ? 'Zahlung überfällig' : website.billing_status}
              </div>
            )}
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
        {website.plan === 'free' && (
          <div style={{ marginTop: '1.1rem', paddingTop: '1.1rem', borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.82rem', color: 'var(--ink)', fontWeight: 600, marginBottom: '0.4rem' }}>
              Badge einbinden {website.badge_status === 'active' ? '✓ erkannt' : website.badge_status === 'missing' ? '— nicht gefunden, bitte einbinden' : '(wird beim nächsten Lauf geprüft)'}
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              Der Free-Tarif läuft nur, solange dieser Badge auf {website.domain} eingebunden ist. Code einfach vor dem schließenden <code>&lt;/body&gt;</code>-Tag einfügen:
            </p>
            <pre style={{ background: 'var(--ink)', color: '#e6e6e6', padding: '0.85rem 1rem', borderRadius: 8, fontSize: '0.72rem', overflowX: 'auto' }}>
{`<a href="https://suchmaschinen.pro" target="_blank" rel="noopener"
   data-suchmaschinen-badge="pro21"
   style="display:inline-block">
  <img src="https://suchmaschinen.pro/badge.png"
       alt="Diese Website wird von suchmaschinen.pro SEO optimiert"
       width="280" height="90" loading="lazy" />
</a>`}
            </pre>
          </div>
        )}
      </div>

      {(GA_FOR_CUSTOMERS || isAdminEmail(user?.email)) && (
      <div className="card" style={{ padding: '1.5rem', marginBottom: '2.5rem' }}>
        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--ink)', marginBottom: '0.75rem' }}>Google Analytics</div>

        {gaError && (
          <div style={{ background: '#fce8e8', border: '1px solid #f5a5a5', padding: '0.7rem 0.9rem', fontSize: '0.82rem', color: '#b02020', borderRadius: 8, marginBottom: '1rem' }}>
            {gaError}
            {gaNeedsReconnect && (
              <div style={{ marginTop: '0.6rem' }}>
                <a href={`/api/analytics/connect?websiteId=${websiteId}`} className="btn-emerald" style={{ padding: '0.45rem 1rem', fontSize: '0.8rem', display: 'inline-block' }}>
                  Mit Google neu verbinden
                </a>
              </div>
            )}
          </div>
        )}

        {!website.ga_refresh_token && (
          <>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.9rem' }}>
              Verbinden Sie Ihr Google-Analytics-4-Konto, um direkt hier zu sehen, ob die veröffentlichten Artikel Besucher bringen.
            </p>
            <a href={`/api/analytics/connect?websiteId=${websiteId}`} className="btn-outline" style={{ padding: '0.5rem 1.1rem', fontSize: '0.82rem', display: 'inline-block' }}>
              Mit Google Analytics verbinden
            </a>
          </>
        )}

        {website.ga_refresh_token && !website.ga_property_id && (
          <>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.9rem' }}>
              Verbunden — bitte wählen Sie die passende Property:
            </p>
            {gaLoadingProperties && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <span className="spinner" style={{ color: 'var(--emerald)' }} />
                <span className="progress-message" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Properties werden geladen — bei vielen Websites im Konto kann das einen Moment dauern…
                </span>
              </div>
            )}
            {gaProperties && gaProperties.length > 0 && (
              <input
                type="text"
                value={gaPropertyFilter}
                onChange={e => setGaPropertyFilter(e.target.value)}
                placeholder="Property suchen…"
                className="form-input"
                style={{ marginBottom: '0.75rem', fontSize: '0.85rem', padding: '0.5rem 0.8rem' }}
              />
            )}
            {gaProperties && gaProperties.length === 0 && (
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Keine GA4-Properties in diesem Google-Konto gefunden.</p>
            )}
            {gaProperties && gaProperties.length > 0 && (() => {
              const q = gaPropertyFilter.toLowerCase();
              const filtered = gaProperties.filter(p =>
                `${p.displayName} ${p.account} ${p.domain || ''}`.toLowerCase().includes(q)
              );
              return (
                <>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                    {filtered.length} von {gaProperties.length} Properties
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 320, overflowY: 'auto' }}>
                    {filtered.length === 0 && (
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Keine Treffer — anderen Suchbegriff versuchen.</p>
                    )}
                    {filtered.map(p => (
                      <button key={p.property} onClick={() => handleSelectGaProperty(p)} className="btn-outline"
                        style={{ padding: '0.55rem 0.9rem', fontSize: '0.82rem', textAlign: 'left' }}>
                        {p.displayName}{' '}
                        {p.domain && <span style={{ color: 'var(--emerald)', fontSize: '0.75rem' }}>· {p.domain}</span>}{' '}
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>({p.account})</span>
                      </button>
                    ))}
                  </div>
                </>
              );
            })()}
          </>
        )}

        {website.ga_property_id && (
          <>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Verbunden mit: {website.ga_property_name || website.ga_property_id} · letzte 30 Tage
            </p>
            {gaChartLoading && (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <span className="spinner" style={{ width: '1.4rem', height: '1.4rem', color: 'var(--emerald)' }} />
              </div>
            )}
            {!gaChartLoading && gaChartData && gaChartData.length > 0 && <AnalyticsChart data={gaChartData} />}
            {!gaChartLoading && gaChartData && gaChartData.length === 0 && (
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Noch keine Daten für diesen Zeitraum.</p>
            )}
          </>
        )}
      </div>
      )}

      {articles.some(a => a.status === 'draft') && (
        <div style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: 'var(--ink)', marginBottom: '1rem' }}>Zu veröffentlichen</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {articles.filter(a => a.status === 'draft').map(article => (
              <div key={article.id} className="card" style={{ padding: '1.1rem 1.4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 220 }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.3rem' }}>
                    <span className="badge badge-pending">Entwurf — noch zu veröffentlichen</span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--ink)' }}>{article.title}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Keyword: {article.keyword}</div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => setPreviewArticle(article)} className="btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.82rem' }}>
                    Vorschau
                  </button>
                  <button
                    onClick={() => { setPublishModal(article); setPublishError(''); }}
                    className="btn-emerald"
                    style={{ padding: '0.5rem 1rem', fontSize: '0.82rem' }}
                  >
                    Veröffentlichen
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isAdminEmail(user?.email) && <RankingOverview websiteId={websiteId} />}

      <KeywordWorkbench
        websiteId={websiteId}
        isAdmin={isAdminEmail(user?.email)}
        usedKeywords={articles.map(a => a.keyword)}
        generatingKeyword={generatingKeyword}
        generateMessage={generateMessage}
        freeLimitReached={website.plan === 'free' && articles.length > 0}
        onGenerate={handleGenerateArticle}
        onQueued={() => { if (user) loadData(user.id); }}
      />

      {website.suggested_keywords && (
        <div style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: 'var(--ink)', marginBottom: '0.25rem' }}>Vorgeschlagene Suchbegriffe</h2>
          {suggestedVolumes.available && <div style={{ marginBottom: '0.5rem' }}><AdsPriceNote /></div>}
          {website.last_analyzed_at && (
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Zuletzt analysiert: {new Date(website.last_analyzed_at).toLocaleString('de-DE')}
            </div>
          )}
          {website.plan === 'free' && (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', background: 'var(--emerald-pale)', padding: '0.7rem 1rem', borderRadius: 8, marginBottom: '1rem' }}>
              Im Free-Tarif ist ein manuell generierter Artikel enthalten{articles.length > 0 ? ' — bereits aufgebraucht.' : '.'} Für weitere Artikel auf Basic oder Pro upgraden.
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {website.suggested_keywords.filter(kw => !articles.some(a => a.keyword === kw.keyword)).map((kw, i) => {
              const freeLimitReached = website.plan === 'free' && articles.length > 0;
              return (
                <div key={i} className="card" style={{ padding: '1.1rem 1.4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--ink)' }}>{kw.keyword}</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{kw.rationale}</div>
                    <div style={{ marginTop: '0.4rem', display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span className="badge badge-pending">{kw.intent}</span>
                      <VolumeLabel info={suggestedVolumes.get(kw.keyword)} />
                      {i === 0 && website.auto_publish && <span style={{ fontSize: '0.76rem', color: 'var(--emerald)' }}>Nächster automatischer Artikel</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {i > 0 && website.auto_publish && (
                    <button onClick={() => handleQueueKeyword(kw)} className="btn-outline" style={{ padding: '0.5rem 0.9rem', fontSize: '0.82rem' }}>
                      Als Nächstes
                    </button>
                  )}
                  <button
                    onClick={() => handleGenerateArticle(kw)}
                    disabled={generatingKeyword === kw.keyword || freeLimitReached}
                    className="btn-outline"
                    style={{ padding: '0.5rem 1.1rem', fontSize: '0.82rem', opacity: freeLimitReached ? 0.5 : 1, display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
                  >
                    {generatingKeyword === kw.keyword && <span className="spinner" />}
                    {generatingKeyword === kw.keyword
                      ? generateMessage
                      : freeLimitReached
                      ? 'Nur im Basic/Pro-Tarif'
                      : 'Artikel generieren'}
                  </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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

      {articles.some(a => a.status === 'published') && (
        <div style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: 'var(--ink)', marginBottom: '0.5rem' }}>Veröffentlichte Artikel</h2>
          {(() => {
            const pub = articles.filter(a => a.status === 'published');
            const checked = pub.filter(a => a.index_status && a.index_status !== 'no_access');
            if (checked.length === 0 && !pub.some(a => a.gsc_updated_at)) return null;
            const indexed = pub.filter(a => a.index_status === 'indexed').length;
            const impressions = pub.reduce((n, a) => n + (a.gsc_impressions || 0), 0);
            const clicks = pub.reduce((n, a) => n + (a.gsc_clicks || 0), 0);
            return (
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Bei Google indexiert: <strong style={{ color: 'var(--ink)' }}>{indexed} von {pub.length}</strong>
                {' · '}letzte 28 Tage: <strong style={{ color: 'var(--ink)' }}>{impressions.toLocaleString('de-DE')}</strong> Impressionen,{' '}
                <strong style={{ color: 'var(--ink)' }}>{clicks.toLocaleString('de-DE')}</strong> Klicks
              </p>
            );
          })()}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {articles.filter(a => a.status === 'published').map(article => (
              <div key={article.id} className="card" style={{ padding: '1.1rem 1.4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 220 }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.3rem' }}>
                    <span className="badge badge-active">Veröffentlicht</span>
                    {article.refreshed_at && (
                      <span className="badge badge-active" title={article.refresh_reason ? `Grund: ${article.refresh_reason}` : undefined}>
                        Aufgefrischt {new Date(article.refreshed_at).toLocaleDateString('de-DE')}
                      </span>
                    )}
                    {article.index_status === 'indexed' && (
                      <span className="badge badge-active" title={article.index_last_crawl ? `Zuletzt von Google gecrawlt: ${new Date(article.index_last_crawl).toLocaleDateString('de-DE')}` : undefined}>Bei Google indexiert</span>
                    )}
                    {(article.index_status === 'not_indexed' || article.index_status === 'unknown') && (
                      <span className="badge badge-pending" title={article.index_coverage || undefined}>
                        {article.index_status === 'unknown' ? 'Google noch unbekannt' : 'Noch nicht indexiert'}
                      </span>
                    )}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--ink)' }}>{article.title}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Keyword: {article.keyword}</div>
                  {article.published_url && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--emerald)', marginTop: '0.2rem' }}>
                      {article.published_url}
                    </div>
                  )}
                  {article.gsc_updated_at && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                      Google, letzte 28 Tage: {(article.gsc_impressions || 0).toLocaleString('de-DE')} Impressionen · {(article.gsc_clicks || 0).toLocaleString('de-DE')} Klicks
                      {article.gsc_position ? ` · Ø Position ${String(article.gsc_position).replace('.', ',')}` : ''}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => setPreviewArticle(article)} className="btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.82rem' }}>
                    Vorschau
                  </button>
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
              <button onClick={handlePublish} disabled={publishing} className="btn-emerald" style={{ padding: '0.6rem 1.2rem', fontSize: '0.85rem', opacity: publishing ? 0.7 : 1, display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                {publishing && <span className="spinner" />}
                {publishing ? publishMessage : 'Jetzt veröffentlichen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
