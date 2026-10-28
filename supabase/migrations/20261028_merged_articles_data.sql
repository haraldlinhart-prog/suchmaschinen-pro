-- Data of Conny's duplicate merge (27.10.2026), so the database state can be traced and rebuilt.
-- Needs 20261027_merged_articles_topic_locks.sql (statuses, merged_into, content_locked,
-- sq_topic_locks). Articles are found by website_id + slug, never by article UUID; where a slug
-- exists twice on a site (kaputte-links.de "link-checker-service…", published twice on 06.10.)
-- the most recently published row is the main article. Idempotent: on a database that already
-- has this state, nothing changes; keywords the generator noted on a lock (blocked_keywords)
-- are kept.

-- 1. Which article went into which main article. website_id: 177a49d8… rentyourcompany.com,
--    97f12137… pagespeed-plus.de, d9e6e5f2… companyking.de, e26daceb… kaputte-links.de,
--    ff300f09… lighthouse-mauritius.com.
drop table if exists pg_temp._merge_map;
create temporary table _merge_map (website_id uuid, slug text, into_slug text);
insert into _merge_map values
  ('d9e6e5f2-7423-4c76-8a7b-7ea6e0ffa73a', 'firmengrundung-beratung-warum-professionelle-unterstutzung-ihre-erfolg', 'firmengrundung-in-deutschland-der-umfassende-leitfaden-fur-angehende-u'),
  ('d9e6e5f2-7423-4c76-8a7b-7ea6e0ffa73a', 'firmengrundung-online-wie-sie-ihr-unternehmen-digital-und-effizient-in', 'firmengrundung-in-deutschland-der-umfassende-leitfaden-fur-angehende-u'),
  ('d9e6e5f2-7423-4c76-8a7b-7ea6e0ffa73a', 'englische-limited-grunden-ihr-leitfaden-zur-britischen-rechtsform', 'ltd-grunden-praxisnahe-anleitung-fur-deutsche-unternehmer'),
  ('d9e6e5f2-7423-4c76-8a7b-7ea6e0ffa73a', 'uk-limited-grunden-so-etablieren-sie-ihre-britische-kapitalgesellschaf', 'ltd-grunden-praxisnahe-anleitung-fur-deutsche-unternehmer'),
  ('d9e6e5f2-7423-4c76-8a7b-7ea6e0ffa73a', 'wie-grunde-ich-eine-ug-4-konkrete-schritte-zur-eigenen-unternehmergese', 'ug-grunden-der-komplette-leitfaden-fur-ihre-unternehmergesellschaft'),
  ('e26daceb-2e4c-4925-b5ff-dda5767715c1', 'kaputte-links-finden-so-entdecken-und-beheben-sie-defekte-verlinkungen', 'defekte-links-prufen-so-finden-und-beheben-sie-kaputte-links-effizient'),
  ('e26daceb-2e4c-4925-b5ff-dda5767715c1', 'tote-links-finden-der-ultimative-leitfaden-zur-erkennung-defekter-verl', 'defekte-links-prufen-so-finden-und-beheben-sie-kaputte-links-effizient'),
  ('e26daceb-2e4c-4925-b5ff-dda5767715c1', 'tote-urls-finden-warum-defekte-webadressen-ihrer-seo-schaden-und-wie-s', 'defekte-links-prufen-so-finden-und-beheben-sie-kaputte-links-effizient'),
  ('e26daceb-2e4c-4925-b5ff-dda5767715c1', 'website-links-testen-so-uberprufen-sie-ihre-webseite-auf-defekte-links', 'defekte-links-prufen-so-finden-und-beheben-sie-kaputte-links-effizient'),
  ('e26daceb-2e4c-4925-b5ff-dda5767715c1', 'broken-link-checker-deutsch-effiziente-werkzeuge-fur-fehlerfreie-websi', 'link-checker-service-professionelle-losungen-fur-fehlerfreie-websites'),
  ('e26daceb-2e4c-4925-b5ff-dda5767715c1', 'broken-links-checker-werkzeuge-und-strategien-fur-eine-fehlerfreie-web', 'link-checker-service-professionelle-losungen-fur-fehlerfreie-websites'),
  ('e26daceb-2e4c-4925-b5ff-dda5767715c1', 'defekte-links-checker-kostenlos-so-finden-und-beheben-sie-kaputte-link', 'link-checker-service-professionelle-losungen-fur-fehlerfreie-websites'),
  ('e26daceb-2e4c-4925-b5ff-dda5767715c1', 'linkcheck-tool-so-finden-und-beheben-sie-defekte-links-auf-ihrer-websi', 'link-checker-service-professionelle-losungen-fur-fehlerfreie-websites'),
  ('e26daceb-2e4c-4925-b5ff-dda5767715c1', 'seo-link-checker-ihr-unverzichtbares-werkzeug-fur-bessere-rankings', 'link-checker-service-professionelle-losungen-fur-fehlerfreie-websites'),
  ('e26daceb-2e4c-4925-b5ff-dda5767715c1', 'website-link-checker-kaputter-links-finden-und-beheben', 'link-checker-service-professionelle-losungen-fur-fehlerfreie-websites'),
  ('e26daceb-2e4c-4925-b5ff-dda5767715c1', 'link-validierung-automatisch-wie-moderne-tools-ihre-website-fehlerfrei', 'link-monitoring-tool-automatische-uberwachung-fur-dauerhaft-fehlerfrei'),
  ('e26daceb-2e4c-4925-b5ff-dda5767715c1', 'linkcheck-e-mail-benachrichtigung-bleiben-sie-automatisch-uber-defekte', 'link-monitoring-tool-automatische-uberwachung-fur-dauerhaft-fehlerfrei'),
  ('e26daceb-2e4c-4925-b5ff-dda5767715c1', 'website-pflege-defekte-links-warum-regelmassige-wartung-ihre-online-pr', 'link-monitoring-tool-automatische-uberwachung-fur-dauerhaft-fehlerfrei'),
  ('ff300f09-4763-4f53-b0ea-fb02dfe6626d', 'global-business-company-mauritius-ihre-internationale-geschaftsplattfo', 'gbc-mauritius-grunden-ihr-weg-zur-global-business-company'),
  ('ff300f09-4763-4f53-b0ea-fb02dfe6626d', 'global-business-company-mauritius-was-sie-uber-diese-unternehmensform-', 'gbc-mauritius-grunden-ihr-weg-zur-global-business-company'),
  ('ff300f09-4763-4f53-b0ea-fb02dfe6626d', 'doppelbesteuerungsabkommen-mauritius-45-internationale-steuerabkommen-', 'mauritius-dba-deutschland-so-profitieren-sie-vom-doppelbesteuerungsabk'),
  ('ff300f09-4763-4f53-b0ea-fb02dfe6626d', 'investitionen-afrika-mauritius-wie-die-insel-zum-strategischen-tor-fur', 'mauritius-finanzzentrum-warum-der-inselstaat-zur-ersten-adresse-fur-af'),
  ('ff300f09-4763-4f53-b0ea-fb02dfe6626d', 'effective-tax-mauritius-3-wie-der-niedrige-steuersatz-ihr-unternehmen-', 'steuern-mauritius-unternehmen-der-umfassende-leitfaden-zur-unternehmen'),
  ('ff300f09-4763-4f53-b0ea-fb02dfe6626d', 'gbc-mauritius-steuern-alle-wichtigen-steueraspekte-fur-ihre-global-bus', 'steuern-mauritius-unternehmen-der-umfassende-leitfaden-zur-unternehmen'),
  ('ff300f09-4763-4f53-b0ea-fb02dfe6626d', 'mauritius-offshore-steuer-wie-sie-legale-steuervorteile-fur-ihr-intern', 'steuern-mauritius-unternehmen-der-umfassende-leitfaden-zur-unternehmen'),
  ('ff300f09-4763-4f53-b0ea-fb02dfe6626d', 'mauritius-unternehmenssteuer-was-grunder-und-investoren-wirklich-wisse', 'steuern-mauritius-unternehmen-der-umfassende-leitfaden-zur-unternehmen'),
  ('97f12137-24f3-4ca1-a890-a812fea49a8d', 'was-sind-core-web-vitals-die-google-metriken-fur-website-geschwindigke', 'core-web-vitals-messen-der-vollstandige-leitfaden-fur-bessere-website-'),
  ('97f12137-24f3-4ca1-a890-a812fea49a8d', 'web-vitals-test-erfolgskritische-metriken-prazise-messen-und-auswerten', 'core-web-vitals-messen-der-vollstandige-leitfaden-fur-bessere-website-'),
  ('97f12137-24f3-4ca1-a890-a812fea49a8d', 'ladegeschwindigkeit-website-messen-professionelle-messtechniken-fur-op', 'pagespeed-test-website-geschwindigkeit-messen-und-optimieren'),
  ('97f12137-24f3-4ca1-a890-a812fea49a8d', 'ladezeit-website-prufen-so-messen-sie-die-performance-ihrer-webseite', 'pagespeed-test-website-geschwindigkeit-messen-und-optimieren'),
  ('97f12137-24f3-4ca1-a890-a812fea49a8d', 'pagespeed-check-kostenlos-website-geschwindigkeit-professionell-testen', 'pagespeed-test-website-geschwindigkeit-messen-und-optimieren'),
  ('97f12137-24f3-4ca1-a890-a812fea49a8d', 'website-geschwindigkeit-testen-so-optimieren-sie-die-ladezeit-ihrer-we', 'pagespeed-test-website-geschwindigkeit-messen-und-optimieren'),
  ('97f12137-24f3-4ca1-a890-a812fea49a8d', 'website-ladezeit-analyse-professionelle-messtechniken-und-konkrete-han', 'pagespeed-test-website-geschwindigkeit-messen-und-optimieren'),
  ('97f12137-24f3-4ca1-a890-a812fea49a8d', 'website-performance-analyse-methoden-und-tools-fur-messbar-schnellere-', 'pagespeed-test-website-geschwindigkeit-messen-und-optimieren'),
  ('97f12137-24f3-4ca1-a890-a812fea49a8d', 'website-performance-messen-methoden-und-tools-fur-messbare-erfolge', 'pagespeed-test-website-geschwindigkeit-messen-und-optimieren'),
  ('97f12137-24f3-4ca1-a890-a812fea49a8d', 'website-analyse-tool-kostenlos-die-besten-losungen-fur-ihre-website-op', 'seo-test-kostenlos-umfassende-analyse-fur-bessere-rankings'),
  ('177a49d8-e9b0-4fe9-9fe5-20fffc9e83b6', 'briefkastenfirma-deutschland-legal-mieten-so-nutzen-sie-legitime-gesch', 'geschaftsadresse-deutschland-geschaftlich-warum-der-richtige-standort-'),
  ('177a49d8-e9b0-4fe9-9fe5-20fffc9e83b6', 'firma-auf-zeit-flexibel-und-rechtssicher-zum-eigenen-unternehmen', 'gmbh-mieten-der-schnelle-weg-zur-eigenen-kapitalgesellschaft'),
  ('177a49d8-e9b0-4fe9-9fe5-20fffc9e83b6', 'firma-mieten-schneller-und-flexibler-start-fur-ihr-geschaft', 'gmbh-mieten-der-schnelle-weg-zur-eigenen-kapitalgesellschaft'),
  ('177a49d8-e9b0-4fe9-9fe5-20fffc9e83b6', 'flexible-firmenlosung-wie-unternehmen-heute-ohne-grundungsaufwand-durc', 'gmbh-mieten-der-schnelle-weg-zur-eigenen-kapitalgesellschaft'),
  ('177a49d8-e9b0-4fe9-9fe5-20fffc9e83b6', 'gmbh-miete-de-ihr-direkter-zugang-zur-sofort-einsatzbereiten-kapitalge', 'gmbh-mieten-der-schnelle-weg-zur-eigenen-kapitalgesellschaft'),
  ('177a49d8-e9b0-4fe9-9fe5-20fffc9e83b6', 'gmbh-vermietung-flexible-unternehmensnutzung-ohne-grundungsaufwand', 'gmbh-mieten-der-schnelle-weg-zur-eigenen-kapitalgesellschaft'),
  ('177a49d8-e9b0-4fe9-9fe5-20fffc9e83b6', 'geschaftsfuhrer-auf-treuhandbasis-kosten-was-sie-bei-rentyourcompany-c', 'nominee-director-kosten-preise-leistungen-und-versteckte-gebuhren-bei-'),
  ('177a49d8-e9b0-4fe9-9fe5-20fffc9e83b6', 'gmbh-ohne-eigenen-geschaftsfuhrer-betreiben-nominee-losungen-fur-opera', 'treuhander-geschaftsfuhrer-wann-diese-losung-fur-ihr-unternehmen-sinnv'),
  ('177a49d8-e9b0-4fe9-9fe5-20fffc9e83b6', 'vorratsgesellschaft-deutschland-ihre-schnelle-losung-fur-den-geschafts', 'vorratsgesellschaft-mieten-schneller-start-in-die-selbststandigkeit');

-- Main article of a slug on a site: the most recently published row that is not itself merged.
create or replace function pg_temp.main_article(p_website_id uuid, p_slug text) returns uuid
language sql stable as $$
  select id from sq_articles
   where website_id = p_website_id and slug = p_slug and status <> 'merged'
   order by published_at desc nulls last, created_at desc
   limit 1;
$$;

-- 2. Merged articles: status 'merged' + main article. merged_at keeps its first value.
update sq_articles a
   set status = 'merged',
       merged_into = pg_temp.main_article(m.website_id, m.into_slug),
       merged_at = coalesce(a.merged_at, timestamptz '2026-10-27 09:42:35+00')
  from _merge_map m
 where a.website_id = m.website_id
   and a.slug = m.slug
   and (a.status is distinct from 'merged'
        or a.merged_into is distinct from pg_temp.main_article(m.website_id, m.into_slug)
        or a.merged_at is null);

-- 3. Main articles were edited by hand in the site repos: never republish them from content_html.
--    All rows of the slug (the doubled link-checker row too).
update sq_articles a
   set content_locked = true
  from (select distinct website_id, into_slug from _merge_map) m
 where a.website_id = m.website_id
   and a.slug = m.into_slug
   and not a.content_locked;

-- 4. Topic locks. One lock per site and topic; an existing lock keeps its blocked_keywords,
--    keywords, target and note are set to this state.
create unique index if not exists sq_topic_locks_website_topic_key on sq_topic_locks (website_id, topic);

insert into sq_topic_locks (website_id, topic, keywords, target_article_id, target_url, note)
select l.website_id, l.topic, l.keywords, pg_temp.main_article(l.website_id, l.target_slug), l.target_url,
       'Dubletten-Zusammenführung Conny 27.10.2026'
  from (values
    ('d9e6e5f2-7423-4c76-8a7b-7ea6e0ffa73a'::uuid, 'Firmengründung allgemein',
     array['firmengründung', 'firmengründung deutschland', 'firmengründung online', 'firmengründung beratung'],
     'firmengrundung-in-deutschland-der-umfassende-leitfaden-fur-angehende-u',
     'https://companyking.de/blog/firmengrundung-in-deutschland-der-umfassende-leitfaden-fur-angehende-u/'),
    ('d9e6e5f2-7423-4c76-8a7b-7ea6e0ffa73a'::uuid, 'Limited gründen',
     array['ltd gründen', 'uk limited gründen', 'englische limited gründen'],
     'ltd-grunden-praxisnahe-anleitung-fur-deutsche-unternehmer',
     'https://www.companyking.de/blog/ltd-grunden-praxisnahe-anleitung-fur-deutsche-unternehmer/'),
    ('d9e6e5f2-7423-4c76-8a7b-7ea6e0ffa73a'::uuid, 'UG gründen',
     array['ug gründen', 'unternehmergesellschaft gründen', 'wie gründe ich eine ug', 'ug gründung'],
     'ug-grunden-der-komplette-leitfaden-fur-ihre-unternehmergesellschaft',
     'https://www.companyking.de/blog/ug-grunden-der-komplette-leitfaden-fur-ihre-unternehmergesellschaft/'),
    ('e26daceb-2e4c-4925-b5ff-dda5767715c1'::uuid, 'Automatisches Link-Monitoring',
     array['link monitoring', 'link monitoring tool', 'link validierung automatisch', 'linkcheck benachrichtigung', 'linkcheck e-mail benachrichtigung', 'website pflege defekte links'],
     'link-monitoring-tool-automatische-uberwachung-fur-dauerhaft-fehlerfrei',
     'https://www.kaputte-links.de/blog/link-monitoring-tool-automatische-uberwachung-fur-dauerhaft-fehlerfrei/'),
    ('e26daceb-2e4c-4925-b5ff-dda5767715c1'::uuid, 'Kaputte/tote Links finden & prüfen',
     array['defekte links prüfen', 'tote links finden', 'kaputte links finden', 'website links testen', 'tote urls finden'],
     'defekte-links-prufen-so-finden-und-beheben-sie-kaputte-links-effizient',
     'https://kaputte-links.de/blog/defekte-links-prufen-so-finden-und-beheben-sie-kaputte-links-effizient/'),
    ('e26daceb-2e4c-4925-b5ff-dda5767715c1'::uuid, 'Link-Checker-Tool',
     array['link checker', 'link checker service', 'broken link checker', 'broken link checker deutsch', 'broken links checker', 'defekte links checker kostenlos', 'linkcheck tool', 'website link checker', 'seo link checker', 'links prüfen', 'links checken', '404 checker'],
     'link-checker-service-professionelle-losungen-fur-fehlerfreie-websites',
     'https://www.kaputte-links.de/blog/link-checker-service-professionelle-losungen-fur-fehlerfreie-websites/'),
    ('ff300f09-4763-4f53-b0ea-fb02dfe6626d'::uuid, 'DBA',
     array['doppelbesteuerungsabkommen mauritius', 'dba mauritius deutschland', 'mauritius dba deutschland'],
     'mauritius-dba-deutschland-so-profitieren-sie-vom-doppelbesteuerungsabk',
     'https://www.lighthouse-mauritius.com/blog/mauritius-dba-deutschland-so-profitieren-sie-vom-doppelbesteuerungsabk/'),
    ('ff300f09-4763-4f53-b0ea-fb02dfe6626d'::uuid, 'Finanzzentrum/Tor nach Afrika',
     array['mauritius finanzzentrum', 'investitionen afrika mauritius'],
     'mauritius-finanzzentrum-warum-der-inselstaat-zur-ersten-adresse-fur-af',
     'https://www.lighthouse-mauritius.com/blog/mauritius-finanzzentrum-warum-der-inselstaat-zur-ersten-adresse-fur-af/'),
    ('ff300f09-4763-4f53-b0ea-fb02dfe6626d'::uuid, 'GBC gründen/Überblick',
     array['gbc mauritius', 'gbc mauritius gründen', 'global business company mauritius', 'gbc gründen'],
     'gbc-mauritius-grunden-ihr-weg-zur-global-business-company',
     'https://www.lighthouse-mauritius.com/blog/gbc-mauritius-grunden-ihr-weg-zur-global-business-company/'),
    ('ff300f09-4763-4f53-b0ea-fb02dfe6626d'::uuid, 'Unternehmenssteuern Mauritius',
     array['steuern mauritius', 'steuern mauritius unternehmen', 'unternehmenssteuer mauritius', 'mauritius unternehmenssteuer', 'effective tax mauritius 3%', 'gbc mauritius steuern', 'gbc steuern', 'offshore steuer mauritius', 'mauritius offshore steuer'],
     'steuern-mauritius-unternehmen-der-umfassende-leitfaden-zur-unternehmen',
     'https://www.lighthouse-mauritius.com/blog/steuern-mauritius-unternehmen-der-umfassende-leitfaden-zur-unternehmen/'),
    ('97f12137-24f3-4ca1-a890-a812fea49a8d'::uuid, 'Core Web Vitals',
     array['core web vitals', 'core web vitals messen', 'web vitals test', 'was sind core web vitals'],
     'core-web-vitals-messen-der-vollstandige-leitfaden-fur-bessere-website-',
     'https://pagespeed-plus.de/blog/core-web-vitals-messen-der-vollstandige-leitfaden-fur-bessere-website-/'),
    ('97f12137-24f3-4ca1-a890-a812fea49a8d'::uuid, 'Kostenlose SEO-/Website-Analyse-Tools',
     array['seo test kostenlos', 'website analyse tool kostenlos'],
     'seo-test-kostenlos-umfassende-analyse-fur-bessere-rankings',
     'https://pagespeed-plus.de/blog/seo-test-kostenlos-umfassende-analyse-fur-bessere-rankings/'),
    ('97f12137-24f3-4ca1-a890-a812fea49a8d'::uuid, 'Website-Geschwindigkeit/Ladezeit/Performance',
     array['pagespeed test', 'pagespeed check kostenlos', 'website geschwindigkeit testen', 'ladezeit prüfen', 'ladezeit messen', 'ladezeit website prüfen', 'ladegeschwindigkeit website messen', 'website ladezeit analyse', 'website performance messen', 'website performance analyse'],
     'pagespeed-test-website-geschwindigkeit-messen-und-optimieren',
     'https://pagespeed-plus.de/blog/pagespeed-test-website-geschwindigkeit-messen-und-optimieren/'),
    ('177a49d8-e9b0-4fe9-9fe5-20fffc9e83b6'::uuid, 'Geschäftsadresse/Briefkastenfirma',
     array['geschäftsadresse deutschland', 'geschäftsadresse deutschland geschäftlich', 'briefkastenfirma legal', 'briefkastenfirma deutschland legal mieten'],
     'geschaftsadresse-deutschland-geschaftlich-warum-der-richtige-standort-',
     'https://www.rentyourcompany.com/blog/geschaftsadresse-deutschland-geschaftlich-warum-der-richtige-standort-/'),
    ('177a49d8-e9b0-4fe9-9fe5-20fffc9e83b6'::uuid, 'GmbH/Firma mieten',
     array['gmbh mieten', 'firma mieten', 'gmbh vermietung', 'firma auf zeit', 'flexible firmenlösung', 'gmbh-miete.de'],
     'gmbh-mieten-der-schnelle-weg-zur-eigenen-kapitalgesellschaft',
     'https://rentyourcompany.com/blog/gmbh-mieten-der-schnelle-weg-zur-eigenen-kapitalgesellschaft/'),
    ('177a49d8-e9b0-4fe9-9fe5-20fffc9e83b6'::uuid, 'Kosten Nominee/Treuhand-GF',
     array['nominee director kosten', 'geschäftsführer treuhand kosten', 'geschäftsführer auf treuhandbasis kosten'],
     'nominee-director-kosten-preise-leistungen-und-versteckte-gebuhren-bei-',
     'https://www.rentyourcompany.com/blog/nominee-director-kosten-preise-leistungen-und-versteckte-gebuhren-bei-/'),
    ('177a49d8-e9b0-4fe9-9fe5-20fffc9e83b6'::uuid, 'Treuhänder-/Nominee-Geschäftsführer',
     array['treuhänder geschäftsführer', 'gmbh ohne eigenen geschäftsführer', 'gmbh ohne eigenen geschäftsführer betreiben', 'nominee geschäftsführer'],
     'treuhander-geschaftsfuhrer-wann-diese-losung-fur-ihr-unternehmen-sinnv',
     'https://www.rentyourcompany.com/blog/treuhander-geschaftsfuhrer-wann-diese-losung-fur-ihr-unternehmen-sinnv/'),
    ('177a49d8-e9b0-4fe9-9fe5-20fffc9e83b6'::uuid, 'Vorratsgesellschaft',
     array['vorratsgesellschaft', 'vorratsgesellschaft mieten', 'vorratsgesellschaft deutschland'],
     'vorratsgesellschaft-mieten-schneller-start-in-die-selbststandigkeit',
     'https://rentyourcompany.com/blog/vorratsgesellschaft-mieten-schneller-start-in-die-selbststandigkeit/')
  ) as l(website_id, topic, keywords, target_slug, target_url)
 where exists (select 1 from sq_websites w where w.id = l.website_id)
on conflict (website_id, topic) do update
   set keywords = excluded.keywords,
       target_article_id = excluded.target_article_id,
       target_url = excluded.target_url,
       note = excluded.note
 where (sq_topic_locks.keywords, sq_topic_locks.target_article_id, sq_topic_locks.target_url, sq_topic_locks.note)
       is distinct from (excluded.keywords, excluded.target_article_id, excluded.target_url, excluded.note);

-- 5. Report rows that were not found (e.g. a database without these sites' articles).
do $$
declare
  missing text;
begin
  select string_agg(m.slug, ', ') into missing
    from _merge_map m
   where not exists (select 1 from sq_articles a where a.website_id = m.website_id and a.slug = m.slug and a.status = 'merged')
      or pg_temp.main_article(m.website_id, m.into_slug) is null;
  if missing is not null then
    raise warning 'merged articles: not found or main article missing: %', missing;
  end if;
end $$;

drop table _merge_map;
