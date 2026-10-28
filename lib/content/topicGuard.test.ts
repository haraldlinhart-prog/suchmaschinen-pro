// Runs the merge data of 27.10.2026 (topicGuard.testData.ts) through checkTopic(): every
// keyword Conny merged must be blocked again, pointing at its main article. `npm test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkTopic, siteWeights, topicSimilarity, SIMILARITY_THRESHOLD, type TopicLock } from './topicGuard.ts';
import { SITE_KEYWORDS, MERGED_INTO, MUST_MATCH, TOPIC_LOCKS, FOLLOWUP_SITE_KEYWORDS, FOLLOWUP_MERGED_INTO, FOLLOWUP_LOCKS, calibrationPairs } from './topicGuard.testData.ts';

const locksOf = (site: string): TopicLock[] =>
  (TOPIC_LOCKS[site] ?? []).map(l => ({ id: l.target_slug, topic: l.topic, keywords: l.keywords, target_url: l.target_slug }));

test('test data: 45 merged articles, each with its main article on the same site', () => {
  assert.equal(Object.keys(MERGED_INTO).length, 45);
  for (const [slug, main] of Object.entries(MERGED_INTO)) {
    const site = Object.keys(SITE_KEYWORDS).find(s => SITE_KEYWORDS[s].some(r => r[0] === slug));
    assert.ok(site, `${slug} missing in SITE_KEYWORDS`);
    assert.ok(SITE_KEYWORDS[site].some(r => r[0] === main), `${main} missing on ${site}`);
    assert.ok(TOPIC_LOCKS[site].some(l => l.target_slug === main), `no lock for ${main}`);
  }
});

test('every merged keyword is blocked again and points to its main article', () => {
  for (const [site, rows] of Object.entries(SITE_KEYWORDS)) {
    const group = (slug: string) => MERGED_INTO[slug] ?? slug;
    for (const [slug, keyword] of rows) {
      const main = MERGED_INTO[slug];
      if (!main) continue;
      // The site as it is now, minus the keyword under test (as if it came up for the first time).
      const existing = rows.filter(r => r[0] !== slug).map(r => r[1]);
      const verdict = checkTopic(keyword, existing, locksOf(site));
      assert.equal(verdict.ok, false, `${site}: "${keyword}" was not blocked`);
      if (verdict.reason === 'lock') {
        assert.equal(verdict.targetUrl, main, `${site}: "${keyword}" blocked by the lock of ${verdict.targetUrl}, belongs to ${main}`);
      } else {
        const hit = rows.find(r => r[1] === verdict.match);
        assert.ok(hit && group(hit[0]) === main, `${site}: "${keyword}" matched "${verdict.match}", which is not in the group of ${main}`);
      }
    }
  }
});

test('the two examples of the task are caught by similarity alone', () => {
  const cases: Array<[string, string, string]> = [
    ['pagespeed-plus.de', MUST_MATCH[0][0], MUST_MATCH[0][1]],
    ['kaputte-links.de', MUST_MATCH[1][0], MUST_MATCH[1][1]],
  ];
  for (const [site, used, candidate] of cases) {
    const others = SITE_KEYWORDS[site].map(r => r[1]).filter(k => k !== used && k !== candidate);
    const verdict = checkTopic(candidate, [used, ...others], []);
    assert.equal(verdict.ok, false, `"${candidate}" not caught next to "${used}"`);
    assert.equal(verdict.reason, 'similar');
    // And in the other direction against the used keyword alone.
    assert.ok(topicSimilarity(used, candidate, siteWeights([...others, used, candidate])) >= SIMILARITY_THRESHOLD);
  }
});

test('calibration at SIMILARITY_THRESHOLD: at least 39 of 47 merged pairs, at most 18 of 1007 false alarms', () => {
  const { positive, negative } = calibrationPairs(kws => {
    const weight = siteWeights(kws);
    return (a, b) => topicSimilarity(a, b, weight);
  });
  assert.equal(positive.length, 47);
  assert.equal(negative.length, 1007);
  const hits = positive.filter(p => p.score >= SIMILARITY_THRESHOLD).length;
  const falseAlarms = negative.filter(p => p.score >= SIMILARITY_THRESHOLD);
  assert.ok(hits >= 39, `only ${hits} of 47 merged pairs reach ${SIMILARITY_THRESHOLD}`);
  assert.ok(falseAlarms.length <= 18, `${falseAlarms.length} false alarms: ${falseAlarms.map(p => `${p.a} / ${p.b}`).join(', ')}`);
});

test('follow-up 28.10.: the redirected keywords are blocked by their new lock, no other keyword of the site is', () => {
  for (const [site, rows] of Object.entries(FOLLOWUP_SITE_KEYWORDS)) {
    const locks = FOLLOWUP_LOCKS[site].map(l => ({ id: l.target_slug, topic: l.topic, keywords: l.keywords, target_url: l.target_slug }));
    const group = new Set(Object.entries(FOLLOWUP_MERGED_INTO).flatMap(([slug, main]) => rows.some(r => r[0] === slug) ? [slug, main] : []));
    for (const [slug, keyword] of rows) {
      const existing = rows.filter(r => r[0] !== slug).map(r => r[1]);
      const verdict = checkTopic(keyword, existing, locks);
      if (group.has(slug)) {
        assert.equal(verdict.reason, 'lock', `${site}: "${keyword}" not blocked by the lock`);
        assert.equal(verdict.targetUrl, FOLLOWUP_MERGED_INTO[slug] ?? slug);
      } else {
        assert.notEqual(verdict.reason, 'lock', `${site}: "${keyword}" falls under the lock of ${verdict.targetUrl} (match "${verdict.match}")`);
      }
    }
  }
  const delaware = FOLLOWUP_SITE_KEYWORDS['pan21.org'].map(r => r[1]);
  for (const variant of ['Delaware LLC gründen', 'LLC in Delaware gründen']) {
    assert.equal(checkTopic(variant, delaware, FOLLOWUP_LOCKS['pan21.org'].map(l => ({ id: l.target_slug, topic: l.topic, keywords: l.keywords, target_url: l.target_slug }))).reason, 'lock', variant);
  }
});

test('companyking.de: "Limited Company gründen" falls under the extended lock "Limited gründen"', () => {
  const rows = SITE_KEYWORDS['companyking.de'];
  const locks = locksOf('companyking.de').map(l => l.topic === 'Limited gründen' ? { ...l, keywords: [...l.keywords, 'limited company gründen'] } : l);
  const verdict = checkTopic('Limited Company gründen', rows.map(r => r[1]).filter(k => k !== 'Limited Company gründen'), locks);
  assert.equal(verdict.reason, 'lock');
  assert.equal(verdict.targetUrl, 'ltd-grunden-praxisnahe-anleitung-fur-deutsche-unternehmer');
});

test('a keyword already used on the site is blocked, an empty site allows anything', () => {
  assert.deepEqual(checkTopic('GmbH gründen', ['gmbh gründen'], []).ok, false);
  assert.equal(checkTopic('GmbH gründen', [], []).ok, true);
});
