-- Follow-up to 20261028_merged_articles_data.sql (28.10.2026). Of the 7 empty articles that were
-- live (see lib/content/articleQuality.ts), Conny 301-redirected three to an existing article
-- (folder deleted, out of sitemap and blog index, internal links changed); the other four were
-- rewritten by hand in their site repos. Same rules as the first migration: articles by
-- website_id + slug, idempotent, blocked_keywords of a lock are kept.
-- website_id: c8532e5d… pan-finanzvertrieb.de, 83ad9561… pan21.org, d9e6e5f2… companyking.de.

create or replace function pg_temp.main_article(p_website_id uuid, p_slug text) returns uuid
language sql stable as $$
  select id from sq_articles
   where website_id = p_website_id and slug = p_slug and status <> 'merged'
   order by published_at desc nulls last, created_at desc
   limit 1;
$$;

-- 1. The three redirected articles.
update sq_articles a
   set status = 'merged',
       merged_into = pg_temp.main_article(m.website_id, m.into_slug),
       merged_at = coalesce(a.merged_at, timestamptz '2026-10-28 00:00:00+00')
  from (values
    ('c8532e5d-8368-4bc7-9720-466f1a628863'::uuid, 'finanz-affiliate-chancen-und-moglichkeiten-im-finanzvertrieb', 'finance-affiliate-network-deutschland-warum-sie-als-partner-im-finanzv'),
    ('83ad9561-40e4-4958-ac41-3e8f43a872a2'::uuid, 'llc-grunden-delaware-warum-dieser-bundesstaat-fur-europaische-unterneh', 'llc-grunden-delaware-warum-deutsche-unternehmer-den-first-state-wahlen'),
    ('d9e6e5f2-7423-4c76-8a7b-7ea6e0ffa73a'::uuid, 'limited-company-grunden-wie-sie-die-richtige-jurisdiktion-fur-ihre-int', 'ltd-grunden-praxisnahe-anleitung-fur-deutsche-unternehmer')
  ) as m(website_id, slug, into_slug)
 where a.website_id = m.website_id
   and a.slug = m.slug
   and (a.status is distinct from 'merged'
        or a.merged_into is distinct from pg_temp.main_article(m.website_id, m.into_slug)
        or a.merged_at is null);

-- 2. The four rewritten articles: the text now lives in the site repo, content_html in the
--    database is still the empty generator answer. Never republish them from it (Premium refresh,
--    backlink injection).
update sq_articles a
   set content_locked = true
  from (values
    ('gmbh-verkauf.com', 'gmbh-ubernahme-strategien-und-erfolgsfaktoren-fur-kaufer'),
    ('impressum-free.de', 'impressum-onlineshop-erstellen-pflichtangaben-und-rechtssichere-umsetz'),
    ('pan21.de', 'virtuelle-buros-deutschland-professionelle-geschaftsprasenz-mit-8-stra'),
    ('site-ok.de', 'website-statusseite-erstellen-transparenz-schaffen-und-kundenvertrauen')
  ) as r(domain, slug)
  join sq_websites w on w.domain = r.domain
 where a.website_id = w.id
   and a.slug = r.slug
   and not a.content_locked;

-- 3. Topic locks.
--    pan21.org: both articles had the same keyword "LLC gründen Delaware".
--    pan-finanzvertrieb.de: "finanz affiliate" went into "Finance Affiliate Network Deutschland".
--    The lock is kept narrow: "affiliate" is in most keywords of the site, so the similarity
--    check gives it little weight and variants ("Finanz Affiliate Programm") would pass;
--    topicGuard.test.ts checks that no other keyword of the site falls under this lock.
insert into sq_topic_locks (website_id, topic, keywords, target_article_id, target_url, note)
select l.website_id, l.topic, l.keywords, pg_temp.main_article(l.website_id, l.target_slug), l.target_url,
       'Leere Artikel, 301 durch Conny 28.10.2026'
  from (values
    ('83ad9561-40e4-4958-ac41-3e8f43a872a2'::uuid, 'LLC Delaware gründen',
     array['llc gründen delaware', 'llc delaware gründen', 'delaware llc gründen', 'delaware llc'],
     'llc-grunden-delaware-warum-deutsche-unternehmer-den-first-state-wahlen',
     'https://www.pan21.org/blog/llc-grunden-delaware-warum-deutsche-unternehmer-den-first-state-wahlen/'),
    ('c8532e5d-8368-4bc7-9720-466f1a628863'::uuid, 'Finanz-Affiliate-Netzwerk',
     array['finanz affiliate', 'finance affiliate', 'finance affiliate network', 'finance affiliate network deutschland', 'finanz affiliate netzwerk'],
     'finance-affiliate-network-deutschland-warum-sie-als-partner-im-finanzv',
     'https://www.pan-finanzvertrieb.de/blog/finance-affiliate-network-deutschland-warum-sie-als-partner-im-finanzv/')
  ) as l(website_id, topic, keywords, target_slug, target_url)
 where exists (select 1 from sq_websites w where w.id = l.website_id)
on conflict (website_id, topic) do update
   set keywords = excluded.keywords,
       target_article_id = excluded.target_article_id,
       target_url = excluded.target_url,
       note = excluded.note
 where (sq_topic_locks.keywords, sq_topic_locks.target_article_id, sq_topic_locks.target_url, sq_topic_locks.note)
       is distinct from (excluded.keywords, excluded.target_article_id, excluded.target_url, excluded.note);

--    companyking.de: "Limited Company gründen" joins the existing lock "Limited gründen".
update sq_topic_locks
   set keywords = array_append(keywords, 'limited company gründen')
 where website_id = 'd9e6e5f2-7423-4c76-8a7b-7ea6e0ffa73a'
   and topic = 'Limited gründen'
   and not ('limited company gründen' = any (keywords));

-- 4. Report what was not found.
do $$
declare
  n_merged int;
  n_locked int;
begin
  select count(*) into n_merged from sq_articles
   where status = 'merged' and merged_into is not null
     and slug in ('finanz-affiliate-chancen-und-moglichkeiten-im-finanzvertrieb',
                  'llc-grunden-delaware-warum-dieser-bundesstaat-fur-europaische-unterneh',
                  'limited-company-grunden-wie-sie-die-richtige-jurisdiktion-fur-ihre-int');
  select count(*) into n_locked from sq_articles a join sq_websites w on w.id = a.website_id
   where a.content_locked
     and (w.domain, a.slug) in (('gmbh-verkauf.com', 'gmbh-ubernahme-strategien-und-erfolgsfaktoren-fur-kaufer'),
                                ('impressum-free.de', 'impressum-onlineshop-erstellen-pflichtangaben-und-rechtssichere-umsetz'),
                                ('pan21.de', 'virtuelle-buros-deutschland-professionelle-geschaftsprasenz-mit-8-stra'),
                                ('site-ok.de', 'website-statusseite-erstellen-transparenz-schaffen-und-kundenvertrauen'));
  if n_merged <> 3 or n_locked <> 4 then
    raise warning 'follow-up: % of 3 merged, % of 4 rewritten articles locked', n_merged, n_locked;
  end if;
end $$;
