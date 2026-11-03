// `npm test` — secondary-language domains (origin.ts, buildSitemap).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { domainForLanguage, secondaryDomainFor, isSecondaryDomainUrl } from './origin.ts';

const SITE = { domain: 'treuhandauftrag.de', secondary_language: 'en' };

test('secondary language goes to its own domain, primary stays', () => {
  assert.equal(domainForLanguage(SITE, 'en'), 'nominee-buyer.com');
  assert.equal(domainForLanguage(SITE, 'de'), 'treuhandauftrag.de');
  assert.equal(domainForLanguage(SITE, undefined), 'treuhandauftrag.de');
});

test('no secondary language set: everything stays on the main domain', () => {
  assert.equal(domainForLanguage({ domain: 'treuhandauftrag.de', secondary_language: null }, 'en'), 'treuhandauftrag.de');
});

test('other bilingual sites are unchanged', () => {
  assert.equal(domainForLanguage({ domain: 'turnkey-companies.com', secondary_language: 'en' }, 'en'), 'turnkey-companies.com');
  assert.equal(secondaryDomainFor('turnkey-companies.com'), null);
});

test('domain lookup ignores www and scheme', () => {
  assert.equal(secondaryDomainFor('www.treuhandauftrag.de'), 'nominee-buyer.com');
  assert.equal(secondaryDomainFor('https://treuhandauftrag.de/'), 'nominee-buyer.com');
});

test('isSecondaryDomainUrl', () => {
  assert.equal(isSecondaryDomainUrl('https://www.nominee-buyer.com/en/blog/x/'), true);
  assert.equal(isSecondaryDomainUrl('https://www.treuhandauftrag.de/blog/x/'), false);
  assert.equal(isSecondaryDomainUrl('not a url'), false);
});
