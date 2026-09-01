import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

export const revalidate = 0;

async function getData(slug: string, articleSlug: string) {
  const supabase = await createClient();
  const { data: website } = await supabase
    .from('sq_public_websites')
    .select('*')
    .eq('public_slug', slug)
    .single();
  if (!website) return null;

  const { data: article } = await supabase
    .from('sq_articles')
    .select('*')
    .eq('website_id', website.id)
    .eq('slug', articleSlug)
    .eq('status', 'published')
    .single();
  if (!article) return null;

  return { website, article };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string; articleSlug: string }> }): Promise<Metadata> {
  const { slug, articleSlug } = await params;
  const data = await getData(slug, articleSlug);
  if (!data) return {};
  return {
    title: data.article.title,
    description: data.article.meta_description || undefined,
  };
}

export default async function PublicArticlePage({ params }: { params: Promise<{ slug: string; articleSlug: string }> }) {
  const { slug, articleSlug } = await params;
  const data = await getData(slug, articleSlug);
  if (!data) return notFound();
  const { website, article } = data;

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '3.5rem 1.5rem' }}>
      <Link href={`/b/${slug}`} style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textDecoration: 'none' }}>&larr; {website.domain} Blog</Link>
      <article style={{ marginTop: '1.5rem', lineHeight: 1.75, color: 'var(--text-primary)' }} dangerouslySetInnerHTML={{ __html: article.content_html }} />
    </div>
  );
}
