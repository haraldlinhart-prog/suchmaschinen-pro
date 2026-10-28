-- Merged articles, topic locks and rejected drafts (27.10.2026).
-- Conny merged 45 duplicate blog articles on kaputte-links.de, pagespeed-plus.de,
-- companyking.de, rentyourcompany.com and lighthouse-mauritius.com into main articles (301 from
-- the old URLs). Their rows stay in sq_articles — deleting them would free their keywords and
-- the generator would write the same duplicates again — but with status 'merged', which the
-- sitemap, news index and related-links queries skip (they read status = 'published' only).

-- 1. New statuses: 'merged' (went into another article), 'rejected' (draft failed the
--    quality check and must never be published, see lib/content/articleQuality.ts).
alter table sq_articles drop constraint if exists sq_articles_status_check;
alter table sq_articles add constraint sq_articles_status_check
  check (status in ('draft', 'published', 'withdrawn', 'merged', 'rejected'));

alter table sq_articles add column if not exists merged_into uuid references sq_articles(id) on delete set null;
alter table sq_articles add column if not exists merged_at timestamptz;
-- Main articles edited by hand in the repo: the database copy of content_html is outdated,
-- so the Premium jobs (refresh, backlink injection) must not republish them from it.
alter table sq_articles add column if not exists content_locked boolean not null default false;

comment on column sq_articles.merged_into is 'Main article this one was merged into (status = merged); the old URL 301-redirects there.';
comment on column sq_articles.content_locked is 'true = content was edited by hand in the repo; never republish this row from content_html.';

-- 2. Topic locks: no new article on these topics; new demand extends the main article instead.
create table if not exists sq_topic_locks (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  website_id uuid not null references sq_websites(id) on delete cascade,
  topic text not null,
  keywords text[] not null default '{}',
  target_article_id uuid references sq_articles(id) on delete set null,
  target_url text not null,
  -- Keywords the generator wanted to write about but were blocked by this lock: input for
  -- whoever extends the main article.
  blocked_keywords text[] not null default '{}',
  note text
);
create index if not exists sq_topic_locks_website_id_idx on sq_topic_locks (website_id);

alter table sq_topic_locks enable row level security;
drop policy if exists "Users can view own sq_topic_locks" on sq_topic_locks;
create policy "Users can view own sq_topic_locks"
  on sq_topic_locks for select
  using (exists (select 1 from sq_websites w where w.id = website_id and w.user_id = auth.uid()));

create or replace function sq_topic_lock_add_keyword(p_lock_id uuid, p_keyword text)
returns void
language sql
security definer
set search_path = public
as $$
  update sq_topic_locks
     set blocked_keywords = array_append(blocked_keywords, p_keyword)
   where id = p_lock_id
     and not (p_keyword = any (blocked_keywords));
$$;
revoke all on function sq_topic_lock_add_keyword(uuid, text) from public, anon, authenticated;
grant execute on function sq_topic_lock_add_keyword(uuid, text) to service_role;
