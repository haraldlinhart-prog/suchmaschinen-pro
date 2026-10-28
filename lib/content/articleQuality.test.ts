// Publish gate against empty articles (articleQuality.ts). `npm test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { articleProblems, assertPublishable, wordCount, ArticleQualityError, MIN_ARTICLE_WORDS } from './articleQuality.ts';

const words = (n: number) => Array.from({ length: n }, (_, i) => `wort${i}`).join(' ');
const article = (bodyWords = 600) =>
  `<h1>Titel</h1>\n<p>${words(bodyWords / 2)}</p>\n<h2>Erster Abschnitt</h2>\n<p>${words(bodyWords / 4)}</p>\n<h2>Zweiter Abschnitt</h2>\n<p>${words(bodyWords / 4)}</p>`;

test('a normal article passes', () => {
  assert.deepEqual(articleProblems({ title: 'Titel', content_html: article() }), []);
  assert.doesNotThrow(() => assertPublishable({ title: 'Titel', content_html: article(), slug: 'titel' }));
});

test('the empty articles of October: only a cut-off H1', () => {
  const problems = articleProblems({ title: 'Limited Company gründen', content_html: '<h1>Limited Company gründen' });
  assert.ok(problems.some(p => p.startsWith('zu kurz')));
  assert.ok(problems.some(p => p.startsWith('zu wenige Zwischenüberschriften')));
  assert.ok(problems.includes('H1 nicht geschlossen (Antwort abgeschnitten)'));
});

test('the empty articles before 17.10.: the literal text "undefined"', () => {
  assert.ok(articleProblems({ title: 'X', content_html: 'undefined' }).includes('Text endet mit "undefined"'));
  assert.ok(articleProblems({ title: 'X', content_html: `${article()}<p>undefined</p>` }).includes('Text endet mit "undefined"'));
});

test('missing title, too short, too few H2', () => {
  assert.ok(articleProblems({ title: '  ', content_html: article() }).includes('kein Titel'));
  assert.ok(articleProblems({ title: 'X', content_html: article(MIN_ARTICLE_WORDS - 40) }).some(p => p.startsWith('zu kurz')));
  assert.ok(articleProblems({ title: 'X', content_html: `<h1>X</h1><h2>A</h2><p>${words(600)}</p>` }).some(p => p.startsWith('zu wenige')));
});

test('image figure and "Passend zum Thema" block count neither as words nor as H2', () => {
  const related = `<!-- sp:related --><h2>Passend zum Thema</h2><ul><li>${words(500)}</li></ul><!-- /sp:related -->`;
  const html = `<h1>X</h1><figure><figcaption>${words(500)}</figcaption></figure><h2>A</h2><p>${words(100)}</p>${related}`;
  assert.equal(wordCount(html), 102);
  const problems = articleProblems({ title: 'X', content_html: html });
  assert.ok(problems.some(p => p.startsWith('zu kurz')));
  assert.ok(problems.some(p => p.startsWith('zu wenige')));
});

test('assertPublishable throws ArticleQualityError with the problems', () => {
  assert.throws(() => assertPublishable({ title: 'X', content_html: '<h1>X', slug: 'x' }), (e: unknown) =>
    e instanceof ArticleQualityError && e.problems.length === 3 && e.message.includes('"x"'));
});
