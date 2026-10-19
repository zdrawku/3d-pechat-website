const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const { insertRegistryEntry, addTranslation, readRegistryEntry, REGISTRY_MARKER } = require('./scaffold-post');
const { wrapFaqSection } = require('./faq-markers');
const { toJsonFile } = require('./json-format');
const { preflight } = require('./preflight');

const ROOT = path.join(__dirname, '../..');
const REGISTRY = fs.readFileSync(path.join(ROOT, 'src/app/services/blog-posts.registry.ts'), 'utf8');
const LOCALES = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/i18n/locales.json'), 'utf8'));
const COPIES = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/i18n/en/content/blog.json'), 'utf8'));

test('preflight finds everything the scaffolder edits', () => {
  assert.doesNotThrow(() => preflight());
});

test('inserts a registry entry before the marker, with the next id, readable by the scripts', () => {
  const seo = { title: "Заглавие с 'кавички'", description: 'Описание', tags: ['PLA', 'Съвети'], keywords: 'a, b', publishDate: '2026-10-20' };
  const { source, id } = insertRegistryEntry(REGISTRY, { slug: 'nova-statia', seo, imageUrl: 'assets/blogs/images/nova-statia-cover.webp' });
  const ids = [...REGISTRY.matchAll(/id:\s*'(\d+)'/g)].map((m) => Number(m[1]));
  assert.equal(id, String(Math.max(...ids) + 1));
  assert.ok(source.indexOf("slug: 'nova-statia'") < source.indexOf(REGISTRY_MARKER));
  assert.deepEqual(readRegistryEntry('nova-statia', source), {
    slug: 'nova-statia', title: "Заглавие с 'кавички'", description: 'Описание', tags: ['PLA', 'Съвети'], keywords: ['a', 'b']
  });
  // The sitemap's parser reads it like every other entry.
  const { readBlogPosts } = require('../generate-sitemap');
  assert.deepEqual(readBlogPosts(source).at(-1), { slug: 'nova-statia', route: '/blog/nova-statia', lastmod: '2026-10-20' });
});

test('reads an existing registry entry back', () => {
  const entry = readRegistryEntry('pla-pla-pla-pro-i-pln-razliki-i-izbor', REGISTRY);
  assert.equal(entry.title, 'PLA, PLA+, PLA Pro и PLN: разлики и избор за 3D печат');
  assert.ok(entry.tags.includes('PLA+'));
  assert.equal(readRegistryEntry('no-such-post', REGISTRY), null);
});

test('adds a translation to locales.json and blog.json, refusing a second one or a taken slug', () => {
  const copy = { title: 'T', description: 'D', tags: ['a'], keywords: ['b'], date: '2026-10-20', dateModified: '2026-10-20' };
  const { locales, copies } = addTranslation(LOCALES, COPIES, { locale: 'en', source: 'what-is-3d-printing', slug: 'what-is-3d-printing-guide', copy });
  assert.equal(locales.translatedPosts.en['what-is-3d-printing'], 'what-is-3d-printing-guide');
  assert.deepEqual(copies['what-is-3d-printing'], copy);
  assert.equal(Object.keys(locales.translatedPosts.en).length, Object.keys(LOCALES.translatedPosts.en).length + 1);
  // Written in the files' own layout, so the diff is only the new lines.
  const before = toJsonFile(LOCALES).split('\n');
  const after = toJsonFile(locales).split('\n');
  assert.equal(after.length, before.length + 1);

  const [source, slug] = Object.entries(LOCALES.translatedPosts.en)[0];
  assert.throws(() => addTranslation(LOCALES, COPIES, { locale: 'en', source, slug: 'x', copy }), /already translated/);
  assert.throws(() => addTranslation(LOCALES, COPIES, { locale: 'en', source: 'what-is-3d-printing', slug, copy }), /already used/);
});

test('the JSON files round-trip through the scaffolder’s formatter unchanged', () => {
  for (const file of ['src/i18n/locales.json', 'src/i18n/en/content/blog.json']) {
    const text = fs.readFileSync(path.join(ROOT, file), 'utf8').replace(/\r\n/g, '\n');
    assert.equal(toJsonFile(JSON.parse(text)), text, file);
  }
});

test('marks an FAQ section in either language, and leaves anything else alone', () => {
  const bg = '# T\n\n## Често задавани въпроси за X\n\n### Въпрос?\n\nОтговор.\n\n## Заключение\n\nКрай.';
  assert.equal(wrapFaqSection(bg),
    '# T\n\n<!-- faq -->\n## Често задавани въпроси за X\n\n### Въпрос?\n\nОтговор.\n<!-- /faq -->\n\n## Заключение\n\nКрай.');
  const en = '## Frequently asked questions\r\n\r\n### Q?\r\n\r\nA.';
  assert.equal(wrapFaqSection(en), '<!-- faq -->\r\n## Frequently asked questions\r\n\r\n### Q?\r\n\r\nA.\r\n<!-- /faq -->');
  const marked = wrapFaqSection(bg);
  assert.equal(wrapFaqSection(marked), marked, 'idempotent');
  assert.equal(wrapFaqSection('## Често задавани въпроси\n\nСамо текст.'), '## Често задавани въпроси\n\nСамо текст.', 'no questions');
  assert.equal(wrapFaqSection('# T\n\nНяма FAQ.'), '# T\n\nНяма FAQ.');
});
