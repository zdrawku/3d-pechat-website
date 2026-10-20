const { test } = require('node:test');
const assert = require('node:assert/strict');

const { plan, render, affectedUrls } = require('./handoff-checklist');

const ids = (files) => plan(files).areas.map((a) => a.id);

test('maps each kind of file to its area', () => {
  assert.deepEqual(ids(['src/assets/blogs/what-is-3d-printing.md']), ['blog']);
  assert.deepEqual(ids(['src/i18n/en/content/blog.json']), ['blog', 'i18n']);
  assert.deepEqual(ids(['src/data/business.json']), ['facts']);
  assert.deepEqual(ids(['src/data/products.json']), ['catalogue']);
  assert.deepEqual(ids(['src/app/prices-page/prices-page.component.html']), ['ui']);
  assert.deepEqual(ids(['src/app/prices-page/prices-page.component.spec.ts']), []);
  assert.deepEqual(ids(['src/app/app.routes.ts']), ['routes']);
  assert.deepEqual(ids(['src/index.html']), ['seo', 'analytics']);
  assert.deepEqual(ids(['src/app/services/analytics.service.ts']), ['analytics']);
  assert.deepEqual(ids(['src/app/services/consent.service.ts']), ['analytics']);
  assert.deepEqual(ids(['src/app/products-page/products-page.component.ts']), ['ui', 'analytics']);
  assert.deepEqual(ids(['scripts/auto-blog/generate-article.js']), ['pipeline']);
  assert.deepEqual(ids(['scripts/generate-sitemap.js']), ['seo', 'scripts']);
  assert.deepEqual(ids(['e2e/shell.spec.ts']), ['ci']);
  assert.deepEqual(ids(['src/legal/en/privacy.md']), ['legal']);
});

test('names the public pages a change shows up on, in every language it exists in', () => {
  assert.deepEqual(affectedUrls(['src/assets/blogs/pla-pla-pla-pro-i-pln-razliki-i-izbor.md']), [
    'https://3dpechat.bg/blog/pla-pla-pla-pro-i-pln-razliki-i-izbor/',
    'https://3dpechat.bg/en/blog/pla-vs-pla-plus-vs-pla-pro-vs-pln/'
  ]);
  assert.deepEqual(affectedUrls(['src/assets/blogs/en/how-to-smooth-pla-prints.md']), ['https://3dpechat.bg/en/blog/how-to-smooth-pla-prints/']);
  assert.deepEqual(affectedUrls(['src/app/contact-me-page/contact-me-page.component.ts']), ['https://3dpechat.bg/contact/', 'https://3dpechat.bg/en/contact/']);
  assert.deepEqual(affectedUrls(['src/legal/bg/terms.md']), ['https://3dpechat.bg/terms/']);
  assert.deepEqual(affectedUrls(['src/app/legal-page/legal-page.component.html']).sort(), [
    'https://3dpechat.bg/en/privacy/', 'https://3dpechat.bg/en/terms/', 'https://3dpechat.bg/privacy/', 'https://3dpechat.bg/terms/'
  ]);
});

test('renders a test plan per area and one numbered What’s next list ending with the live check', () => {
  const files = ['src/assets/blogs/what-is-3d-printing.md', 'README.md'];
  const md = render({ base: 'origin/main', files }, plan(files));
  assert.match(md, /## Test plan/);
  assert.match(md, /### Blog posts .*\(1\)/);
  assert.match(md, /`README\.md` — no standard checks/);
  const next = md.slice(md.indexOf("## What's next"));
  assert.match(next, /^1\. /m);
  assert.match(next.trim().split('\n').at(-1), /check:live/);
  assert.equal(render({ base: 'origin/main', files: [] }, plan([])).includes('Nothing changed'), true);
});
