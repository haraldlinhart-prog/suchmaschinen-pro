// `npm test` — Google tag on static pages (analyticsTag.ts).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyticsTagFor } from './analyticsTag.ts';

test('listed site gets its tag, with or without www', () => {
  for (const domain of ['webmaster.plus', 'www.webmaster.plus', 'WWW.Webmaster.Plus']) {
    const tag = analyticsTagFor(domain);
    assert.match(tag, /gtag\/js\?id=G-L1CSCE8539/);
    assert.match(tag, /gtag\('config', 'G-L1CSCE8539'\)/);
  }
});

test('other sites stay without a tag', () => {
  assert.equal(analyticsTagFor('www.nxora.net'), '');
  assert.equal(analyticsTagFor('webmaster.plus.example.com'), '');
});
