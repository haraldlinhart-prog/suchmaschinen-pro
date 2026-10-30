import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isNextJsRepo, usesPublicDir } from './nextJsDetect.ts';

test('escort-angels.com: Ausgabe unter public/, aber nicht als Next.js behandelt', () => {
  const root = [{ name: 'vite.config.ts' }, { name: 'public' }];
  for (const d of ['escort-angels.com', 'www.escort-angels.com', 'https://www.escort-angels.com/']) {
    assert.equal(usesPublicDir(root, d), true);
    assert.equal(isNextJsRepo(root, d), false);
  }
});

test('Next.js und ffa-links.de weiter public/, statische Sites weiter Root', () => {
  assert.equal(usesPublicDir([{ name: 'next.config.mjs' }], 'example.de'), true);
  assert.equal(usesPublicDir([], 'ffa-links.de'), true);
  assert.equal(usesPublicDir([{ name: 'index.html' }], 'example.de'), false);
  assert.equal(usesPublicDir([], 'escort-angels.com.evil.de'), false);
});
