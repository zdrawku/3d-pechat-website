// Generates the site-wide LocalBusiness JSON-LD (and og:site_name) in
// src/index.html and src/404.html from src/data/business.json — the one source
// of truth for the business identity (CLAUDE.md Rule 5). Run by `prebuild`.
// Run manually: node scripts/generate-business-schema.js
//
// Writing both HTML files from one generator is what keeps them from drifting.
// Never hand-edit the `organization-jsonld` block; edit business.json instead.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BUSINESS_FILE = path.join(ROOT, 'src/data/business.json');
const HTML_FILES = ['src/index.html', 'src/404.html'].map((f) => path.join(ROOT, f));

const SCHEMA_BLOCK = /<script type="application\/ld\+json" id="organization-jsonld">[\s\S]*?<\/script>/;
const SITE_NAME_TAG = /<meta property="og:site_name" content="[^"]*">/;

// Google ignores self-serving review markup for a business's own reviews and
// may penalise it (CLAUDE.md, "Other standing rules"); never emit these keys.
const FORBIDDEN_KEYS = ['aggregateRating', 'review'];

/** The LocalBusiness JSON-LD object for business.json. */
function buildSchema(b) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    // Keep this @id: BlogPosting publisher/author and VideoObject publisher
    // reference the business by it.
    '@id': 'https://3dpechat.bg/#organization',
    name: b.name,
    alternateName: b.alternateName,
    url: b.url,
    logo: b.logo,
    image: b.image,
    telephone: b.telephone,
    email: b.email,
    address: { '@type': 'PostalAddress', ...b.address },
    geo: { '@type': 'GeoCoordinates', latitude: b.geo.latitude, longitude: b.geo.longitude },
    hasMap: b.hasMap,
    openingHoursSpecification: (b.openingHours || []).map((h) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: h.days,
      opens: h.opens,
      closes: h.closes
    })),
    priceRange: b.priceRange,
    areaServed: b.areaServed.map((a) => ({ '@type': a.type, name: a.name })),
    knowsAbout: b.technologies.map((t) => `${t} 3D печат`),
    makesOffer: b.services.map((name) => ({
      '@type': 'Offer',
      itemOffered: { '@type': 'Service', name }
    })),
    sameAs: b.sameAs
  };
  assertNoForbiddenKeys(schema);
  return schema;
}

function assertNoForbiddenKeys(value, trail = 'schema') {
  if (Array.isArray(value)) {
    value.forEach((v, i) => assertNoForbiddenKeys(v, `${trail}[${i}]`));
  } else if (value && typeof value === 'object') {
    for (const [key, v] of Object.entries(value)) {
      if (FORBIDDEN_KEYS.includes(key)) {
        throw new Error(`${trail}.${key} is forbidden (no self-serving review markup)`);
      }
      assertNoForbiddenKeys(v, `${trail}.${key}`);
    }
  }
}

/** The <script> element, indented to sit inside <head>. */
function renderScript(schema) {
  const json = JSON.stringify(schema, null, 2).replace(/\n/g, '\n  ');
  return `<script type="application/ld+json" id="organization-jsonld">\n  ${json}\n  </script>`;
}

/** Returns the HTML with the schema block and og:site_name replaced. Throws if either is missing. */
function applyToHtml(html, business, label = 'html') {
  if (!SCHEMA_BLOCK.test(html)) {
    throw new Error(`${label}: no <script type="application/ld+json" id="organization-jsonld"> block found`);
  }
  if (!SITE_NAME_TAG.test(html)) {
    throw new Error(`${label}: no <meta property="og:site_name"> tag found`);
  }
  const script = renderScript(buildSchema(business));
  return html
    .replace(SCHEMA_BLOCK, () => script)
    .replace(SITE_NAME_TAG, () => `<meta property="og:site_name" content="${business.name}">`);
}

function main() {
  const business = JSON.parse(fs.readFileSync(BUSINESS_FILE, 'utf8'));
  for (const file of HTML_FILES) {
    const before = fs.readFileSync(file, 'utf8');
    const after = applyToHtml(before, business, path.relative(ROOT, file));
    if (after !== before) fs.writeFileSync(file, after, 'utf8');
    console.log(`✅ ${path.relative(ROOT, file)}: LocalBusiness schema ${after !== before ? 'updated' : 'unchanged'}`);
  }
}

if (require.main === module) {
  try {
    main();
  } catch (err) {
    console.error(`❌ generate-business-schema: ${err.message}`);
    process.exit(1);
  }
}

module.exports = { buildSchema, applyToHtml, renderScript, assertNoForbiddenKeys };
