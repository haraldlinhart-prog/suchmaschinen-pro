// Calibration data for lib/content/topicGuard.ts: the keywords of the five sites whose
// duplicates Conny merged on 27.10.2026, and which article went into which main article.
// After changing the synonym table or the threshold, re-run calibrationPairs() and compare
// hits/false alarms with the numbers at SIMILARITY_THRESHOLD.

/** site → [slug, keyword] of every article (main articles, merged ones and the rest). */
export const SITE_KEYWORDS: Record<string, Array<[string, string]>> = {
  'companyking.de': [
    ['anonyme-firmengrundung-ihre-optionen-fur-maximale-diskretion-bei-der-u', 'anonyme Firmengründung'],
    ['asset-protection-offshore-warum-internationale-strukturen-fur-ernsthaf', 'Asset Protection Offshore'],
    ['company-secretary-hong-kong-was-diese-pflichtrolle-fur-ihre-firmengrun', 'Company Secretary Hong Kong'],
    ['englische-limited-grunden-ihr-leitfaden-zur-britischen-rechtsform', 'englische Limited gründen'],
    ['firmengrundung-beratung-warum-professionelle-unterstutzung-ihre-erfolg', 'Firmengründung Beratung'],
    ['firmengrundung-in-deutschland-der-umfassende-leitfaden-fur-angehende-u', 'Firmengründung'],
    ['firmengrundung-online-wie-sie-ihr-unternehmen-digital-und-effizient-in', 'Firmengründung online'],
    ['gmbh-grunden-der-umfassende-leitfaden-fur-ihre-firmengrundung', 'GmbH gründen'],
    ['hong-kong-firma-grunden-ihr-gateway-zum-asiatischen-markt', 'Hong Kong Firma gründen'],
    ['irische-limited-grunden-effiziente-firmengrundung-in-der-grunen-insel-', 'irische Limited gründen'],
    ['limited-company-grunden-wie-sie-die-richtige-jurisdiktion-fur-ihre-int', 'Limited Company gründen'],
    ['ltd-grunden-praxisnahe-anleitung-fur-deutsche-unternehmer', 'LTD gründen'],
    ['nevis-offshore-vermogensschutz-strategien-fur-anspruchsvolle-unternehm', 'Nevis Offshore'],
    ['ug-grunden-der-komplette-leitfaden-fur-ihre-unternehmergesellschaft', 'UG gründen'],
    ['ug-oder-gmbh-welche-rechtsform-ist-die-richtige-wahl-fur-ihre-grundung', 'UG oder GmbH'],
    ['uk-limited-grunden-so-etablieren-sie-ihre-britische-kapitalgesellschaf', 'UK Limited gründen'],
    ['was-ist-eine-limited-die-britische-rechtsform-verstandlich-erklart', 'was ist eine Limited'],
    ['was-kostet-eine-ug-grundung-detaillierte-kostenaufstellung-und-preisve', 'was kostet eine UG Gründung'],
    ['wie-grunde-ich-eine-ug-4-konkrete-schritte-zur-eigenen-unternehmergese', 'wie gründe ich eine UG'],
  ],
  'kaputte-links.de': [
    ['404-fehler-finden-so-spuren-sie-defekte-links-auf-ihrer-website-auf', '404 fehler finden'],
    ['broken-link-checker-deutsch-effiziente-werkzeuge-fur-fehlerfreie-websi', 'broken link checker deutsch'],
    ['broken-links-checker-werkzeuge-und-strategien-fur-eine-fehlerfreie-web', 'broken links checker'],
    ['broken-links-seo-und-ranking-verlust-die-unterschatzte-gefahr-fur-ihre', 'broken links seo ranking verlust'],
    ['defekte-links-checker-kostenlos-so-finden-und-beheben-sie-kaputte-link', 'defekte links checker kostenlos'],
    ['defekte-links-prufen-so-finden-und-beheben-sie-kaputte-links-effizient', 'defekte links prüfen'],
    ['externe-links-prufen-so-stellen-sie-die-qualitat-ihrer-outbound-links-', 'externe links prüfen'],
    ['http-status-code-checker-tool-prazise-diagnose-fur-technisch-einwandfr', 'http status code checker tool'],
    ['kaputte-links-finden-so-entdecken-und-beheben-sie-defekte-verlinkungen', 'kaputte links finden'],
    ['link-checker-service-professionelle-losungen-fur-fehlerfreie-websites', 'link checker service'],
    ['link-monitoring-tool-automatische-uberwachung-fur-dauerhaft-fehlerfrei', 'link monitoring tool'],
    ['link-validierung-automatisch-wie-moderne-tools-ihre-website-fehlerfrei', 'link validierung automatisch'],
    ['linkcheck-e-mail-benachrichtigung-bleiben-sie-automatisch-uber-defekte', 'linkcheck e-mail benachrichtigung'],
    ['linkcheck-tool-so-finden-und-beheben-sie-defekte-links-auf-ihrer-websi', 'linkcheck tool'],
    ['seo-link-checker-ihr-unverzichtbares-werkzeug-fur-bessere-rankings', 'seo link checker'],
    ['tote-links-finden-der-ultimative-leitfaden-zur-erkennung-defekter-verl', 'tote links finden'],
    ['tote-urls-finden-warum-defekte-webadressen-ihrer-seo-schaden-und-wie-s', 'tote urls finden'],
    ['website-audit-links-professionelle-linkprufung-fur-nachhaltige-qualita', 'website audit links'],
    ['website-fehler-finden-haufige-probleme-erkennen-und-systematisch-beheb', 'website fehler finden'],
    ['website-link-checker-kaputter-links-finden-und-beheben', 'website link checker'],
    ['website-links-testen-so-uberprufen-sie-ihre-webseite-auf-defekte-links', 'website links testen'],
    ['website-pflege-defekte-links-warum-regelmassige-wartung-ihre-online-pr', 'website pflege defekte links'],
  ],
  'lighthouse-mauritius.com': [
    ['authorised-company-mauritius-die-flexible-alternative-zur-global-busin', 'Authorised Company Mauritius'],
    ['doppelbesteuerungsabkommen-mauritius-45-internationale-steuerabkommen-', 'Doppelbesteuerungsabkommen Mauritius'],
    ['effective-tax-mauritius-3-wie-der-niedrige-steuersatz-ihr-unternehmen-', 'Effective Tax Mauritius 3%'],
    ['firma-in-mauritius-grunden-kosten-gebuhren-und-investitionen-im-detail', 'Firma in Mauritius gründen Kosten'],
    ['firmengrundung-mauritius-der-ultimative-leitfaden-fur-ihre-unternehmen', 'Firmengründung Mauritius'],
    ['fsc-mauritius-reguliert-warum-die-finanzaufsicht-fur-ihr-business-ents', 'FSC Mauritius reguliert'],
    ['gbc-mauritius-grunden-ihr-weg-zur-global-business-company', 'GBC Mauritius gründen'],
    ['gbc-mauritius-steuern-alle-wichtigen-steueraspekte-fur-ihre-global-bus', 'GBC Mauritius Steuern'],
    ['global-business-company-mauritius-ihre-internationale-geschaftsplattfo', 'Global Business Company Mauritius'],
    ['global-business-company-mauritius-was-sie-uber-diese-unternehmensform-', 'Global Business Company Mauritius'],
    ['investitionen-afrika-mauritius-wie-die-insel-zum-strategischen-tor-fur', 'Investitionen Afrika Mauritius'],
    ['mauritius-company-formation-professionelle-firmengrundung-mit-lighthou', 'Mauritius Company Formation'],
    ['mauritius-dba-deutschland-so-profitieren-sie-vom-doppelbesteuerungsabk', 'Mauritius DBA Deutschland'],
    ['mauritius-finanzzentrum-warum-der-inselstaat-zur-ersten-adresse-fur-af', 'Mauritius Finanzzentrum'],
    ['mauritius-holding-gesellschaft-steueroptimierte-unternehmensstruktur-f', 'Mauritius Holding Gesellschaft'],
    ['mauritius-offshore-steuer-wie-sie-legale-steuervorteile-fur-ihr-intern', 'Mauritius Offshore Steuer'],
    ['mauritius-steuervorteile-warum-internationale-unternehmer-auf-den-inse', 'Mauritius Steuervorteile'],
    ['mauritius-trust-grunden-professionelle-vermogensstrukturierung-mit-lig', 'Mauritius Trust gründen'],
    ['mauritius-unternehmenssteuer-was-grunder-und-investoren-wirklich-wisse', 'Mauritius Unternehmenssteuer'],
    ['oecd-whitelist-mauritius-was-die-anerkennung-fur-internationale-invest', 'OECD Whitelist Mauritius'],
    ['offshore-firma-mauritius-strategische-vorteile-und-professionelle-grun', 'Offshore Firma Mauritius'],
    ['steuern-mauritius-unternehmen-der-umfassende-leitfaden-zur-unternehmen', 'Steuern Mauritius Unternehmen'],
  ],
  'pagespeed-plus.de': [
    ['core-web-vitals-messen-der-vollstandige-leitfaden-fur-bessere-website-', 'core web vitals messen'],
    ['google-pagespeed-api-automatisierte-performance-analysen-fur-professio', 'google pagespeed api'],
    ['google-pagespeed-insights-der-ultimative-guide-fur-schnellere-websites', 'google pagespeed insights'],
    ['google-search-console-performance-wie-sie-website-daten-richtig-interp', 'google search console performance'],
    ['ladegeschwindigkeit-website-messen-professionelle-messtechniken-fur-op', 'ladegeschwindigkeit website messen'],
    ['ladezeit-website-prufen-so-messen-sie-die-performance-ihrer-webseite', 'ladezeit website prüfen'],
    ['lighthouse-score-testen-professionelle-website-analyse-mit-google-ligh', 'lighthouse score testen'],
    ['pagespeed-check-kostenlos-website-geschwindigkeit-professionell-testen', 'pagespeed check kostenlos'],
    ['pagespeed-insights-alternative-welche-tools-bieten-mehr-funktionen-und', 'pagespeed insights alternative'],
    ['pagespeed-test-website-geschwindigkeit-messen-und-optimieren', 'pagespeed test'],
    ['performance-score-website-was-der-wert-bedeutet-und-wie-sie-ihn-verbes', 'performance score website'],
    ['seo-test-kostenlos-umfassende-analyse-fur-bessere-rankings', 'seo test kostenlos'],
    ['was-sind-core-web-vitals-die-google-metriken-fur-website-geschwindigke', 'was sind core web vitals'],
    ['web-vitals-test-erfolgskritische-metriken-prazise-messen-und-auswerten', 'web vitals test'],
    ['website-analyse-tool-kostenlos-die-besten-losungen-fur-ihre-website-op', 'website analyse tool kostenlos'],
    ['website-barrierefreiheit-testen-ihr-umfassender-leitfaden-fur-digitale', 'website barrierefreiheit testen'],
    ['website-geschwindigkeit-optimieren-praktische-tipps-fur-schnellere-lad', 'website geschwindigkeit optimieren'],
    ['website-geschwindigkeit-testen-so-optimieren-sie-die-ladezeit-ihrer-we', 'website geschwindigkeit testen'],
    ['website-ladezeit-analyse-professionelle-messtechniken-und-konkrete-han', 'website ladezeit analyse'],
    ['website-performance-analyse-methoden-und-tools-fur-messbar-schnellere-', 'website performance analyse'],
    ['website-performance-badge-zeigen-sie-ihre-geschwindigkeit-mit-stolz', 'website performance badge'],
    ['website-performance-messen-methoden-und-tools-fur-messbare-erfolge', 'website performance messen'],
  ],
  'rentyourcompany.com': [
    ['briefkastenfirma-deutschland-legal-mieten-so-nutzen-sie-legitime-gesch', 'Briefkastenfirma Deutschland legal mieten'],
    ['firma-auf-zeit-flexibel-und-rechtssicher-zum-eigenen-unternehmen', 'Firma auf Zeit'],
    ['firma-mieten-schneller-und-flexibler-start-fur-ihr-geschaft', 'Firma mieten'],
    ['firma-mit-bonitat-mieten-direkter-zugang-zu-geschafts-und-kreditfahigk', 'Firma mit Bonität mieten'],
    ['firma-zuruckgeben-nach-projekt-so-funktioniert-die-reibungslose-ruckab', 'Firma zurückgeben nach Projekt'],
    ['flexible-firmenlosung-wie-unternehmen-heute-ohne-grundungsaufwand-durc', 'Flexible Firmenlösung'],
    ['geschaftsadresse-deutschland-geschaftlich-warum-der-richtige-standort-', 'Geschäftsadresse Deutschland geschäftlich'],
    ['geschaftsfuhrer-auf-treuhandbasis-kosten-was-sie-bei-rentyourcompany-c', 'Geschäftsführer auf Treuhandbasis Kosten'],
    ['geschaftsfuhrer-auf-zeit-die-flexible-losung-fur-ihre-unternehmensfuhr', 'Geschäftsführer auf Zeit'],
    ['gmbh-miete-de-ihr-direkter-zugang-zur-sofort-einsatzbereiten-kapitalge', 'GmbH-Miete.de'],
    ['gmbh-mieten-der-schnelle-weg-zur-eigenen-kapitalgesellschaft', 'GmbH mieten'],
    ['gmbh-mieten-erfahrungen-was-unternehmer-wirklich-berichten', 'GmbH mieten Erfahrungen'],
    ['gmbh-ohne-eigenen-geschaftsfuhrer-betreiben-nominee-losungen-fur-opera', 'GmbH ohne eigenen Geschäftsführer betreiben'],
    ['gmbh-vermietung-flexible-unternehmensnutzung-ohne-grundungsaufwand', 'GmbH Vermietung'],
    ['handelsregister-name-andern-was-beim-firmennamenwechsel-nach-der-ruckg', 'Handelsregister Name ändern'],
    ['handelsregistereintrag-bei-gemieteter-firma-was-sie-zur-rechtslage-wis', 'Handelsregistereintrag bei gemieteter Firma'],
    ['kann-man-eine-firma-zeitlich-befristet-ubernehmen-rechtliche-moglichke', 'Kann man eine Firma zeitlich befristet übernehmen'],
    ['mantelgesellschaft-mieten-schneller-start-fur-ihr-unternehmen', 'Mantelgesellschaft mieten'],
    ['nominee-director-kosten-preise-leistungen-und-versteckte-gebuhren-bei-', 'Nominee Director Kosten'],
    ['treuhander-geschaftsfuhrer-wann-diese-losung-fur-ihr-unternehmen-sinnv', 'Treuhänder Geschäftsführer'],
    ['ug-mieten-die-flexible-alternative-zur-grundung-einer-unternehmergesel', 'UG mieten'],
    ['vorratsgesellschaft-deutschland-ihre-schnelle-losung-fur-den-geschafts', 'Vorratsgesellschaft Deutschland'],
    ['vorratsgesellschaft-mieten-schneller-start-in-die-selbststandigkeit', 'Vorratsgesellschaft mieten'],
  ],
};

/** merged slug → main article slug (Conny, 27.10.2026). */
export const MERGED_INTO: Record<string, string> = {
  'broken-link-checker-deutsch-effiziente-werkzeuge-fur-fehlerfreie-websi': 'link-checker-service-professionelle-losungen-fur-fehlerfreie-websites',
  'broken-links-checker-werkzeuge-und-strategien-fur-eine-fehlerfreie-web': 'link-checker-service-professionelle-losungen-fur-fehlerfreie-websites',
  'defekte-links-checker-kostenlos-so-finden-und-beheben-sie-kaputte-link': 'link-checker-service-professionelle-losungen-fur-fehlerfreie-websites',
  'linkcheck-tool-so-finden-und-beheben-sie-defekte-links-auf-ihrer-websi': 'link-checker-service-professionelle-losungen-fur-fehlerfreie-websites',
  'website-link-checker-kaputter-links-finden-und-beheben': 'link-checker-service-professionelle-losungen-fur-fehlerfreie-websites',
  'seo-link-checker-ihr-unverzichtbares-werkzeug-fur-bessere-rankings': 'link-checker-service-professionelle-losungen-fur-fehlerfreie-websites',
  'kaputte-links-finden-so-entdecken-und-beheben-sie-defekte-verlinkungen': 'defekte-links-prufen-so-finden-und-beheben-sie-kaputte-links-effizient',
  'tote-links-finden-der-ultimative-leitfaden-zur-erkennung-defekter-verl': 'defekte-links-prufen-so-finden-und-beheben-sie-kaputte-links-effizient',
  'website-links-testen-so-uberprufen-sie-ihre-webseite-auf-defekte-links': 'defekte-links-prufen-so-finden-und-beheben-sie-kaputte-links-effizient',
  'tote-urls-finden-warum-defekte-webadressen-ihrer-seo-schaden-und-wie-s': 'defekte-links-prufen-so-finden-und-beheben-sie-kaputte-links-effizient',
  'link-validierung-automatisch-wie-moderne-tools-ihre-website-fehlerfrei': 'link-monitoring-tool-automatische-uberwachung-fur-dauerhaft-fehlerfrei',
  'linkcheck-e-mail-benachrichtigung-bleiben-sie-automatisch-uber-defekte': 'link-monitoring-tool-automatische-uberwachung-fur-dauerhaft-fehlerfrei',
  'website-pflege-defekte-links-warum-regelmassige-wartung-ihre-online-pr': 'link-monitoring-tool-automatische-uberwachung-fur-dauerhaft-fehlerfrei',
  'website-geschwindigkeit-testen-so-optimieren-sie-die-ladezeit-ihrer-we': 'pagespeed-test-website-geschwindigkeit-messen-und-optimieren',
  'ladezeit-website-prufen-so-messen-sie-die-performance-ihrer-webseite': 'pagespeed-test-website-geschwindigkeit-messen-und-optimieren',
  'ladegeschwindigkeit-website-messen-professionelle-messtechniken-fur-op': 'pagespeed-test-website-geschwindigkeit-messen-und-optimieren',
  'website-ladezeit-analyse-professionelle-messtechniken-und-konkrete-han': 'pagespeed-test-website-geschwindigkeit-messen-und-optimieren',
  'pagespeed-check-kostenlos-website-geschwindigkeit-professionell-testen': 'pagespeed-test-website-geschwindigkeit-messen-und-optimieren',
  'website-performance-messen-methoden-und-tools-fur-messbare-erfolge': 'pagespeed-test-website-geschwindigkeit-messen-und-optimieren',
  'website-performance-analyse-methoden-und-tools-fur-messbar-schnellere-': 'pagespeed-test-website-geschwindigkeit-messen-und-optimieren',
  'was-sind-core-web-vitals-die-google-metriken-fur-website-geschwindigke': 'core-web-vitals-messen-der-vollstandige-leitfaden-fur-bessere-website-',
  'web-vitals-test-erfolgskritische-metriken-prazise-messen-und-auswerten': 'core-web-vitals-messen-der-vollstandige-leitfaden-fur-bessere-website-',
  'website-analyse-tool-kostenlos-die-besten-losungen-fur-ihre-website-op': 'seo-test-kostenlos-umfassende-analyse-fur-bessere-rankings',
  'wie-grunde-ich-eine-ug-4-konkrete-schritte-zur-eigenen-unternehmergese': 'ug-grunden-der-komplette-leitfaden-fur-ihre-unternehmergesellschaft',
  'firmengrundung-online-wie-sie-ihr-unternehmen-digital-und-effizient-in': 'firmengrundung-in-deutschland-der-umfassende-leitfaden-fur-angehende-u',
  'firmengrundung-beratung-warum-professionelle-unterstutzung-ihre-erfolg': 'firmengrundung-in-deutschland-der-umfassende-leitfaden-fur-angehende-u',
  'englische-limited-grunden-ihr-leitfaden-zur-britischen-rechtsform': 'ltd-grunden-praxisnahe-anleitung-fur-deutsche-unternehmer',
  'uk-limited-grunden-so-etablieren-sie-ihre-britische-kapitalgesellschaf': 'ltd-grunden-praxisnahe-anleitung-fur-deutsche-unternehmer',
  'firma-mieten-schneller-und-flexibler-start-fur-ihr-geschaft': 'gmbh-mieten-der-schnelle-weg-zur-eigenen-kapitalgesellschaft',
  'gmbh-vermietung-flexible-unternehmensnutzung-ohne-grundungsaufwand': 'gmbh-mieten-der-schnelle-weg-zur-eigenen-kapitalgesellschaft',
  'flexible-firmenlosung-wie-unternehmen-heute-ohne-grundungsaufwand-durc': 'gmbh-mieten-der-schnelle-weg-zur-eigenen-kapitalgesellschaft',
  'firma-auf-zeit-flexibel-und-rechtssicher-zum-eigenen-unternehmen': 'gmbh-mieten-der-schnelle-weg-zur-eigenen-kapitalgesellschaft',
  'gmbh-miete-de-ihr-direkter-zugang-zur-sofort-einsatzbereiten-kapitalge': 'gmbh-mieten-der-schnelle-weg-zur-eigenen-kapitalgesellschaft',
  'vorratsgesellschaft-deutschland-ihre-schnelle-losung-fur-den-geschafts': 'vorratsgesellschaft-mieten-schneller-start-in-die-selbststandigkeit',
  'gmbh-ohne-eigenen-geschaftsfuhrer-betreiben-nominee-losungen-fur-opera': 'treuhander-geschaftsfuhrer-wann-diese-losung-fur-ihr-unternehmen-sinnv',
  'geschaftsfuhrer-auf-treuhandbasis-kosten-was-sie-bei-rentyourcompany-c': 'nominee-director-kosten-preise-leistungen-und-versteckte-gebuhren-bei-',
  'briefkastenfirma-deutschland-legal-mieten-so-nutzen-sie-legitime-gesch': 'geschaftsadresse-deutschland-geschaftlich-warum-der-richtige-standort-',
  'global-business-company-mauritius-ihre-internationale-geschaftsplattfo': 'gbc-mauritius-grunden-ihr-weg-zur-global-business-company',
  'global-business-company-mauritius-was-sie-uber-diese-unternehmensform-': 'gbc-mauritius-grunden-ihr-weg-zur-global-business-company',
  'mauritius-unternehmenssteuer-was-grunder-und-investoren-wirklich-wisse': 'steuern-mauritius-unternehmen-der-umfassende-leitfaden-zur-unternehmen',
  'effective-tax-mauritius-3-wie-der-niedrige-steuersatz-ihr-unternehmen-': 'steuern-mauritius-unternehmen-der-umfassende-leitfaden-zur-unternehmen',
  'mauritius-offshore-steuer-wie-sie-legale-steuervorteile-fur-ihr-intern': 'steuern-mauritius-unternehmen-der-umfassende-leitfaden-zur-unternehmen',
  'gbc-mauritius-steuern-alle-wichtigen-steueraspekte-fur-ihre-global-bus': 'steuern-mauritius-unternehmen-der-umfassende-leitfaden-zur-unternehmen',
  'doppelbesteuerungsabkommen-mauritius-45-internationale-steuerabkommen-': 'mauritius-dba-deutschland-so-profitieren-sie-vom-doppelbesteuerungsabk',
  'investitionen-afrika-mauritius-wie-die-insel-zum-strategischen-tor-fur': 'mauritius-finanzzentrum-warum-der-inselstaat-zur-ersten-adresse-fur-af',
};

/** site → topic locks as in sq_topic_locks (same data as supabase/migrations/20261028_merged_articles_data.sql). */
export const TOPIC_LOCKS: Record<string, Array<{ topic: string; target_slug: string; keywords: string[] }>> = {
  'companyking.de': [
    { topic: 'Firmengründung allgemein', target_slug: 'firmengrundung-in-deutschland-der-umfassende-leitfaden-fur-angehende-u', keywords: ['firmengründung', 'firmengründung deutschland', 'firmengründung online', 'firmengründung beratung'] },
    { topic: 'Limited gründen', target_slug: 'ltd-grunden-praxisnahe-anleitung-fur-deutsche-unternehmer', keywords: ['ltd gründen', 'uk limited gründen', 'englische limited gründen'] },
    { topic: 'UG gründen', target_slug: 'ug-grunden-der-komplette-leitfaden-fur-ihre-unternehmergesellschaft', keywords: ['ug gründen', 'unternehmergesellschaft gründen', 'wie gründe ich eine ug', 'ug gründung'] },
  ],
  'kaputte-links.de': [
    { topic: 'Automatisches Link-Monitoring', target_slug: 'link-monitoring-tool-automatische-uberwachung-fur-dauerhaft-fehlerfrei', keywords: ['link monitoring', 'link monitoring tool', 'link validierung automatisch', 'linkcheck benachrichtigung', 'linkcheck e-mail benachrichtigung', 'website pflege defekte links'] },
    { topic: 'Kaputte/tote Links finden & prüfen', target_slug: 'defekte-links-prufen-so-finden-und-beheben-sie-kaputte-links-effizient', keywords: ['defekte links prüfen', 'tote links finden', 'kaputte links finden', 'website links testen', 'tote urls finden'] },
    { topic: 'Link-Checker-Tool', target_slug: 'link-checker-service-professionelle-losungen-fur-fehlerfreie-websites', keywords: ['link checker', 'link checker service', 'broken link checker', 'broken link checker deutsch', 'broken links checker', 'defekte links checker kostenlos', 'linkcheck tool', 'website link checker', 'seo link checker', 'links prüfen', 'links checken', '404 checker'] },
  ],
  'lighthouse-mauritius.com': [
    { topic: 'DBA', target_slug: 'mauritius-dba-deutschland-so-profitieren-sie-vom-doppelbesteuerungsabk', keywords: ['doppelbesteuerungsabkommen mauritius', 'dba mauritius deutschland', 'mauritius dba deutschland'] },
    { topic: 'Finanzzentrum/Tor nach Afrika', target_slug: 'mauritius-finanzzentrum-warum-der-inselstaat-zur-ersten-adresse-fur-af', keywords: ['mauritius finanzzentrum', 'investitionen afrika mauritius'] },
    { topic: 'GBC gründen/Überblick', target_slug: 'gbc-mauritius-grunden-ihr-weg-zur-global-business-company', keywords: ['gbc mauritius', 'gbc mauritius gründen', 'global business company mauritius', 'gbc gründen'] },
    { topic: 'Unternehmenssteuern Mauritius', target_slug: 'steuern-mauritius-unternehmen-der-umfassende-leitfaden-zur-unternehmen', keywords: ['steuern mauritius', 'steuern mauritius unternehmen', 'unternehmenssteuer mauritius', 'mauritius unternehmenssteuer', 'effective tax mauritius 3%', 'gbc mauritius steuern', 'gbc steuern', 'offshore steuer mauritius', 'mauritius offshore steuer'] },
  ],
  'pagespeed-plus.de': [
    { topic: 'Core Web Vitals', target_slug: 'core-web-vitals-messen-der-vollstandige-leitfaden-fur-bessere-website-', keywords: ['core web vitals', 'core web vitals messen', 'web vitals test', 'was sind core web vitals'] },
    { topic: 'Kostenlose SEO-/Website-Analyse-Tools', target_slug: 'seo-test-kostenlos-umfassende-analyse-fur-bessere-rankings', keywords: ['seo test kostenlos', 'website analyse tool kostenlos'] },
    { topic: 'Website-Geschwindigkeit/Ladezeit/Performance', target_slug: 'pagespeed-test-website-geschwindigkeit-messen-und-optimieren', keywords: ['pagespeed test', 'pagespeed check kostenlos', 'website geschwindigkeit testen', 'ladezeit prüfen', 'ladezeit messen', 'ladezeit website prüfen', 'ladegeschwindigkeit website messen', 'website ladezeit analyse', 'website performance messen', 'website performance analyse'] },
  ],
  'rentyourcompany.com': [
    { topic: 'Geschäftsadresse/Briefkastenfirma', target_slug: 'geschaftsadresse-deutschland-geschaftlich-warum-der-richtige-standort-', keywords: ['geschäftsadresse deutschland', 'geschäftsadresse deutschland geschäftlich', 'briefkastenfirma legal', 'briefkastenfirma deutschland legal mieten'] },
    { topic: 'GmbH/Firma mieten', target_slug: 'gmbh-mieten-der-schnelle-weg-zur-eigenen-kapitalgesellschaft', keywords: ['gmbh mieten', 'firma mieten', 'gmbh vermietung', 'firma auf zeit', 'flexible firmenlösung', 'gmbh-miete.de'] },
    { topic: 'Kosten Nominee/Treuhand-GF', target_slug: 'nominee-director-kosten-preise-leistungen-und-versteckte-gebuhren-bei-', keywords: ['nominee director kosten', 'geschäftsführer treuhand kosten', 'geschäftsführer auf treuhandbasis kosten'] },
    { topic: 'Treuhänder-/Nominee-Geschäftsführer', target_slug: 'treuhander-geschaftsfuhrer-wann-diese-losung-fur-ihr-unternehmen-sinnv', keywords: ['treuhänder geschäftsführer', 'gmbh ohne eigenen geschäftsführer', 'gmbh ohne eigenen geschäftsführer betreiben', 'nominee geschäftsführer'] },
    { topic: 'Vorratsgesellschaft', target_slug: 'vorratsgesellschaft-mieten-schneller-start-in-die-selbststandigkeit', keywords: ['vorratsgesellschaft', 'vorratsgesellschaft mieten', 'vorratsgesellschaft deutschland'] },
  ],
};

/** The pairs from the task that must be caught. */
export const MUST_MATCH: Array<[string, string]> = [
  ['ladezeit messen', 'ladegeschwindigkeit messen'],
  ['broken link checker', 'linkcheck tool'],
];

export interface PairResult { site: string; a: string; b: string; score: number }

/**
 * Scores every keyword pair of every site. Positive = merged article vs. its main article
 * (should be >= threshold), negative = articles in different groups (should stay below).
 */
export function calibrationPairs(makeSimilarity: (siteKeywords: string[]) => (a: string, b: string) => number): { positive: PairResult[]; negative: PairResult[] } {
  const positive: PairResult[] = [];
  const negative: PairResult[] = [];
  for (const [site, rows] of Object.entries(SITE_KEYWORDS)) {
    const similarity = makeSimilarity(rows.map(r => r[1]));
    const kw = new Map(rows);
    const group = (slug: string) => MERGED_INTO[slug] ?? slug;
    for (const [slug, main] of Object.entries(MERGED_INTO)) {
      if (kw.has(slug) && kw.has(main)) positive.push({ site, a: kw.get(slug)!, b: kw.get(main)!, score: similarity(kw.get(slug)!, kw.get(main)!) });
    }
    for (let i = 0; i < rows.length; i++) {
      for (let j = i + 1; j < rows.length; j++) {
        if (group(rows[i][0]) === group(rows[j][0])) continue;
        negative.push({ site, a: rows[i][1], b: rows[j][1], score: similarity(rows[i][1], rows[j][1]) });
      }
    }
  }
  // The task's examples, weighted like on the site they come from.
  const onSite = (site: string) => makeSimilarity(SITE_KEYWORDS[site].map(r => r[1]));
  positive.push({ site: '(Aufgabe)', a: MUST_MATCH[0][0], b: MUST_MATCH[0][1], score: onSite('pagespeed-plus.de')(MUST_MATCH[0][0], MUST_MATCH[0][1]) });
  positive.push({ site: '(Aufgabe)', a: MUST_MATCH[1][0], b: MUST_MATCH[1][1], score: onSite('kaputte-links.de')(MUST_MATCH[1][0], MUST_MATCH[1][1]) });
  return { positive, negative };
}
