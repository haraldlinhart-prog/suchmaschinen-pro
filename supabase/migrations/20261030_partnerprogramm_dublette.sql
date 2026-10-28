-- pan-finanzvertrieb.de published "Finanzvertrieb Partnerprogramm Registrierung" twice on
-- 06.10.2026, 41 seconds apart. Conny 301-redirected the younger article to the older one
-- (pan-affiliate#2: folder deleted, out of sitemap and blog index, internal links changed).
-- Same rules as 20261028/20261029: articles by website_id + slug, idempotent, blocked_keywords
-- of a lock are kept. website_id c8532e5d… = pan-finanzvertrieb.de.

create or replace function pg_temp.main_article(p_website_id uuid, p_slug text) returns uuid
language sql stable as $$
  select id from sq_articles
   where website_id = p_website_id and slug = p_slug and status <> 'merged'
   order by published_at desc nulls last, created_at desc
   limit 1;
$$;

-- 1. The younger article went into the older one.
update sq_articles a
   set status = 'merged',
       merged_into = pg_temp.main_article(a.website_id, 'finanzvertrieb-partnerprogramm-registrierung-so-starten-sie-erfolgreic'),
       merged_at = coalesce(a.merged_at, timestamptz '2026-10-28 00:00:00+00')
 where a.website_id = 'c8532e5d-8368-4bc7-9720-466f1a628863'
   and a.slug = 'finanzvertrieb-partnerprogramm-registrierung-so-gelingt-ihr-einstieg-b'
   and (a.status is distinct from 'merged'
        or a.merged_into is distinct from pg_temp.main_article(a.website_id, 'finanzvertrieb-partnerprogramm-registrierung-so-starten-sie-erfolgreic')
        or a.merged_at is null);

-- 2. Topic lock, kept narrow like "Finanz-Affiliate-Netzwerk": "partnerprogramm" is in several
--    keywords of the site (Provisionsauszahlung, Conversion nachverfolgen), so the lock lists only
--    the registration topic; topicGuard.test.ts checks that the other keywords stay free.
insert into sq_topic_locks (website_id, topic, keywords, target_article_id, target_url, note)
select 'c8532e5d-8368-4bc7-9720-466f1a628863'::uuid, 'Partnerprogramm-Registrierung',
       array['finanzvertrieb partnerprogramm registrierung', 'partnerprogramm registrierung', 'finanzvertrieb partnerprogramm anmelden'],
       pg_temp.main_article('c8532e5d-8368-4bc7-9720-466f1a628863', 'finanzvertrieb-partnerprogramm-registrierung-so-starten-sie-erfolgreic'),
       'https://www.pan-finanzvertrieb.de/blog/finanzvertrieb-partnerprogramm-registrierung-so-starten-sie-erfolgreic/',
       'Dublette, 301 durch Conny 28.10.2026'
 where exists (select 1 from sq_websites w where w.id = 'c8532e5d-8368-4bc7-9720-466f1a628863')
on conflict (website_id, topic) do update
   set keywords = excluded.keywords,
       target_article_id = excluded.target_article_id,
       target_url = excluded.target_url,
       note = excluded.note
 where (sq_topic_locks.keywords, sq_topic_locks.target_article_id, sq_topic_locks.target_url, sq_topic_locks.note)
       is distinct from (excluded.keywords, excluded.target_article_id, excluded.target_url, excluded.note);

-- 3. Report what was not found.
do $$
begin
  if not exists (select 1 from sq_articles
                  where website_id = 'c8532e5d-8368-4bc7-9720-466f1a628863'
                    and slug = 'finanzvertrieb-partnerprogramm-registrierung-so-gelingt-ihr-einstieg-b'
                    and status = 'merged' and merged_into is not null) then
    raise warning 'partnerprogramm duplicate: merged row or main article not found';
  end if;
end $$;
