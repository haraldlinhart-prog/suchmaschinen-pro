-- worldstructures.net (28.10.2026, review of worldstructures#1): the blog article
-- "Firmengründung Ausland" has the same search intent as the new hand-written pillar page
-- /de/firma-im-ausland-gruenden. Its URL 301-redirects there (next.config.ts redirects() in the
-- worldstructures repo; folder deleted, out of sitemap-blog.xml and the blog index).
-- The pillar page is not an sq_articles row, so merged_into stays null; the lock points at its
-- URL instead (target_article_id null, target_url set). Same rules as 20261029/20261030:
-- article by website_id + slug, idempotent, blocked_keywords of a lock are kept.
-- website_id 85e986ab… = worldstructures.net.

-- 1. The blog article went into the pillar page.
update sq_articles a
   set status = 'merged',
       merged_into = null,
       merged_at = coalesce(a.merged_at, timestamptz '2026-10-28 00:00:00+00')
 where a.website_id = '85e986ab-cedc-4b3c-b922-c5693fbc7141'
   and a.slug = 'firmengrundung-ausland-standortwahl-steueroptimierung-und-rechtliche-r'
   and (a.status is distinct from 'merged' or a.merged_at is null);

-- 2. Topic lock. Every keyword contains "Ausland": "gründen" and "Firma" are in many keywords of
--    the site (GmbH/UG/Trust gründen, Offshore Gesellschaft gründen, Firmenmantel kaufen) and must
--    stay free. "Offshore Gesellschaft gründen" still scores 0.49 against "firmengründung ausland",
--    but the merged keyword already blocks it by similarity; topicGuard.test.ts checks that the lock
--    blocks no keyword of the site that would otherwise be free.
insert into sq_topic_locks (website_id, topic, keywords, target_article_id, target_url, note)
select '85e986ab-cedc-4b3c-b922-c5693fbc7141'::uuid, 'Firmengründung Ausland',
       array['firmengründung ausland', 'firmengründung im ausland', 'firma im ausland gründen', 'firma ausland gründen', 'auslandsfirma gründen'],
       null,
       'https://www.worldstructures.net/de/firma-im-ausland-gruenden',
       'Blogartikel in Pillar-Seite zusammengeführt, 301 laut Review worldstructures#1 (28.10.2026)'
 where exists (select 1 from sq_websites w where w.id = '85e986ab-cedc-4b3c-b922-c5693fbc7141')
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
                  where website_id = '85e986ab-cedc-4b3c-b922-c5693fbc7141'
                    and slug = 'firmengrundung-ausland-standortwahl-steueroptimierung-und-rechtliche-r'
                    and status = 'merged') then
    raise warning 'worldstructures pillar merge: article not found';
  end if;
end $$;
