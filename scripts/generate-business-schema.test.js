// Run with `npm run test:scripts` (node's built-in test runner).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildSchema, applyToHtml, assertNoForbiddenKeys } = require('./generate-business-schema');
const business = require('../src/data/business.json');

const ROOT = path.resolve(__dirname, '..');
const HTML = `<head>
  <meta property="og:site_name" content="old name">
  <script type="application/ld+json" id="organization-jsonld">
  { "@type": "Organization", "name": "old" }
  </script>
</head>`;

const schemaIn = (html) =>
  JSON.parse(html.match(/id="organization-jsonld">([\s\S]*?)<\/script>/)[1]);

test('builds a LocalBusiness from business.json with the stable @id', () => {
  const s = buildSchema(business);
  assert.equal(s['@type'], 'LocalBusiness');
  assert.equal(s['@id'], 'https://3dpechat.bg/#organization');
  assert.equal(s.name, business.name);
  assert.equal(s.telephone, business.telephone);
  assert.equal(s.address.postalCode, '1700');
  assert.equal(s.geo['@type'], 'GeoCoordinates');
  assert.equal(s.priceRange, business.priceRange);
  assert.deepEqual(s.sameAs, business.sameAs);
  assert.deepEqual(s.openingHoursSpecification[0].dayOfWeek, business.openingHours[0].days);
  assert.deepEqual(s.areaServed.map((a) => a['@type']), ['City', 'Country']);
  assert.deepEqual(s.knowsLanguage, business.languages);
});

test('never emits review or aggregateRating markup', () => {
  const json = JSON.stringify(buildSchema(business));
  assert.ok(!/"(aggregateRating|review)"/.test(json));
  // The guard catches the keys at any depth, should anyone add them later.
  assert.throws(() => assertNoForbiddenKeys({ a: [{ aggregateRating: { ratingValue: 5 } }] }), /forbidden/);
  assert.throws(() => assertNoForbiddenKeys({ review: [] }), /forbidden/);
  assert.doesNotThrow(() => assertNoForbiddenKeys({ name: 'x', sameAs: [] }));
});

test('replaces the schema block and og:site_name, and a second run changes nothing', () => {
  const once = applyToHtml(HTML, business);
  assert.equal(schemaIn(once).name, business.name);
  assert.match(once, new RegExp(`<meta property="og:site_name" content="${business.name}">`));
  assert.equal(applyToHtml(once, business), once);
});

test('fails loudly when the schema block or og:site_name is missing', () => {
  assert.throws(() => applyToHtml('<head></head>', business), /organization-jsonld/);
  assert.throws(
    () => applyToHtml(HTML.replace(/<meta property="og:site_name"[^>]*>/, ''), business),
    /og:site_name/
  );
});

test('index.html and 404.html carry the generated schema (run the generator if this fails)', () => {
  const expected = buildSchema(business);
  for (const f of ['src/index.html', 'src/404.html']) {
    const html = fs.readFileSync(path.join(ROOT, f), 'utf8');
    assert.deepEqual(schemaIn(html), expected, f);
  }
});
