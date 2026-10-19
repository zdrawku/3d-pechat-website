const { test } = require('node:test');
const assert = require('node:assert/strict');

const business = require('../../src/data/business.json');
const locales = require('../../src/i18n/locales.json');
const { buildTranslationPrompt, parseTranslation, normalizeTranslation, toLocaleLinks, linkMap, fitDescription } = require('./translate-article');

const prompt = buildTranslationPrompt({ markdown: '# Заглавие\n\nТекст.', seo: { title: 'Заглавие', description: 'Описание', tags: ['PLA'] } });

test('the translation prompt carries every business fact and never-claim verbatim', () => {
  for (const fact of business.facts) assert.ok(prompt.includes(fact), `missing fact: ${fact}`);
  for (const claim of business.neverClaim) assert.ok(prompt.includes(claim), `missing never-claim: ${claim}`);
});

test('the translation prompt lists every English page and post as link targets, and the markers', () => {
  for (const page of locales.localizedPages) assert.ok(prompt.includes(`   - /en${page}`), page);
  for (const slug of Object.values(locales.translatedPosts.en)) assert.ok(prompt.includes(`/en/blog/${slug}/`), slug);
  for (const marker of ['<!-- video -->', '<!-- makerworld -->', '{{MAKERWORLD_URL}}', '## Frequently asked questions']) {
    assert.ok(prompt.includes(marker), marker);
  }
  assert.match(prompt, /Prices only in euro/);
  assert.ok(prompt.endsWith('# Заглавие\n\nТекст.'), 'the source post comes last');
});

test('maps links to the English pages and unwraps links to Bulgarian-only posts', () => {
  const [source, slug] = Object.entries(locales.translatedPosts.en)[0];
  const md = [
    '[prices](/prices/) [home](/) [card](/products/#variant-1) [abs](https://3dpechat.bg/contact)',
    `[post](/blog/${source}/#section) [old](/blog/what-is-3d-printing/) [en](/en/blog/${slug}/)`,
    '[ext](https://gripsta.com/) ![img](assets/blogs/images/x.webp) [none](/en/blog/no-such-post/)'
  ].join('\n');
  const { markdown, dropped } = toLocaleLinks(md, linkMap(locales));
  assert.equal(markdown, [
    '[prices](/en/prices/) [home](/en/) [card](/en/products/#variant-1) [abs](/en/contact/)',
    `[post](/en/blog/${slug}/) old [en](/en/blog/${slug}/)`,
    '[ext](https://gripsta.com/) ![img](assets/blogs/images/x.webp) none'
  ].join('\n'));
  assert.deepEqual(dropped, ['/blog/what-is-3d-printing/', '/en/blog/no-such-post/']);
});

test('parses the delimited answer and refuses one without the sections', () => {
  const parsed = parseTranslation('noise\n===JSON===\n```json\n{"title":"T"}\n```\n===MARKDOWN===\n# T\n\nBody');
  assert.deepEqual(parsed, { meta: { title: 'T' }, markdown: '# T\n\nBody' });
  assert.throws(() => parseTranslation('{"title":"T"}'), /no ===JSON===/);
});

test('normalises the draft: H1 = title, unique kebab slug, snippet-sized description, list fields', () => {
  const draft = normalizeTranslation(
    { meta: { slug: 'PLA Guide!', title: 'PLA guide', seoTitle: 'PLA guide', description: `${'word '.repeat(40)}end`, tags: ['PLA', ' Tips '], keywords: 'a, b,, c' },
      markdown: '# Something else\r\n\r\nSee [prices](/prices/).' },
    { date: '2026-10-19', takenSlugs: ['pla-guide'] }
  );
  assert.equal(draft.slug, 'pla-guide-2');
  assert.equal(draft.markdown, '# PLA guide\n\nSee [prices](/en/prices/).\n');
  assert.deepEqual(draft.copy.tags, ['PLA', 'Tips']);
  assert.deepEqual(draft.copy.keywords, ['a', 'b', 'c']);
  assert.ok(draft.copy.description.length <= 160);
  assert.equal(draft.copy.seoTitle, undefined, 'a seoTitle equal to the title is dropped');
  assert.equal(draft.copy.date, '2026-10-19');
  assert.equal(draft.copy.dateModified, '2026-10-19');
  assert.throws(() => normalizeTranslation({ meta: { title: 'T' }, markdown: '# T' }, { date: '2026-10-19' }), /no description/);
});

test('cuts a long description at a word boundary', () => {
  assert.equal(fitDescription('short one'), 'short one');
  const cut = fitDescription(`${'abcd '.repeat(40)}`);
  assert.ok(cut.length <= 160 && !cut.endsWith(' '));
});
