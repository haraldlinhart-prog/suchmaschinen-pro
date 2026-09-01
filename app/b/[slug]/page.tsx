import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const revalidate = 0;

export default async function PublicBlogListPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: website } = await supabase
    .from('sq_public_websites')
    .select('*')
    .eq('public_slug', slug)
    .single();

  if (!website) return notFound();

  const { data: articles } = await supabase
    .from('sq_articles')
    .select('id, title, slug, meta_description, published_at')
    .eq('website_id', website.id)
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '3.5rem 1.5rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <div className="section-label">{website.domain}</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: 'var(--ink)', marginTop: '0.4rem' }}>Blog</h1>
      </div>

      {(!articles || articles.length === 0) ? (
        <p style={{ color: 'var(--text-muted)' }}>Noch keine Artikel veröffentlicht.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {articles.map(a => (
            <Link key={a.id} href={`/b/${slug}/${a.slug}`} className="card" style={{ padding: '1.5rem', textDecoration: 'none', display: 'block' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: 'var(--ink)', marginBottom: '0.4rem' }}>{a.title}</h2>
              {a.meta_description && <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: 0 }}>{a.meta_description}</p>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
