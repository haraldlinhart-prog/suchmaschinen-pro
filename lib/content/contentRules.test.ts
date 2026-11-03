// `npm test` — language of the Premium refresh (contentRules.ts).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { refreshLabels } from './contentRules.ts';

const DATE = new Date('2026-11-03T12:00:00Z');

test('English articles get English labels', () => {
  const l = refreshLabels('en');
  assert.equal(l.languageName, 'English');
  assert.equal(l.faqHeading, 'Frequently asked questions');
  assert.equal(l.updatedNote(DATE), 'Updated in November 2026.');
});

test('German articles keep the German labels', () => {
  const l = refreshLabels('de');
  assert.equal(l.languageName, 'German');
  assert.equal(l.faqHeading, 'Häufige Fragen');
  assert.equal(l.updatedNote(DATE), 'Aktualisiert im November 2026.');
});

test('missing or unknown language falls back to German', () => {
  assert.equal(refreshLabels(null).languageName, 'German');
  assert.equal(refreshLabels('fr').languageName, 'German');
});
