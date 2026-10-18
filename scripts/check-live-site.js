// Read-only health check of the LIVE site for everything that makes it
// discoverable by search engines and AI assistants (AI-VISIBILITY-PLAN.md,
// Phase 7). It mirrors the build-time guards against production, so a broken
// deploy, a CDN/bot-blocking change or a stale business fact shows up even when
// the repo's own tests are green.
//
//   node scripts/check-live-site.js [--base https://3dpechat.bg]
//
// Plain HTTP GETs only: no JavaScript runs, so this never creates Google
// Analytics sessions. Exits 1 when any check fails (the weekly
// live-site-check workflow turns that into a failed run / email).

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const { findProblems } = require('./check-internal-links');
const { findKey } = require('./indexnow');

const ROOT = path.resolve(__dirname, '..');
const SITE = 'https://3dpechat.bg';
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

// Crawlers that must be able to read the site (CLAUDE.md guardrails): if a CDN
// or WAF ever starts challenging one of these, AI answers lose us silently.
const CRAWLERS = {
  Googlebot: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  bingbot: 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
  'OAI-SearchBot': 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; OAI-SearchBot/1.0; +https://openai.com/searchbot',
  'ChatGPT-User': 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; ChatGPT-User/1.0; +https://openai.com/bot',
  PerplexityBot: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)',
  ClaudeBot: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0; +claudebot@anthropic.com)',
  Applebot: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.1 Safari/605.1.15 (Applebot/0.1; +http://www.apple.com/go/applebot)'
};

/** [{ from, to }] from the table in LEGACY_REDIRECTS.md (absolute URLs). */
function parseLegacyRedirects(markdown) {
  return [...markdown.matchAll(/^\|\s*`(https:\/\/[^`]+)`\s*\|\s*`(https:\/\/[^`]+)`\s*\|/gm)]
    .map(([, from, to]) => ({ from, to }));
}

/** True when robots.txt blocks the whole site for every user agent. */
function robotsBlocksEverything(robots) {
  let starGroup = false;
  for (const raw of robots.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, '').trim();
    if (/^user-agent:/i.test(line)) starGroup = line.split(':')[1].trim() === '*';
    else if (starGroup && /^disallow:\s*\/\s*$/i.test(line)) return true;
  }
  return false;
}

/** All JSON-LD blocks in a page, parsed. Throws on invalid JSON. */
function jsonLdBlocks(html) {
  const $ = cheerio.load(html);
  return $('script[type="application/ld+json"]').toArray().map((el) => JSON.parse($(el).text()));
}

/** Paths in a JSON-LD value that carry review / rating markup. */
function reviewMarkup(node, trail = '$') {
  if (Array.isArray(node)) return node.flatMap((n, i) => reviewMarkup(n, `${trail}[${i}]`));
  if (!node || typeof node !== 'object') return [];
  return Object.entries(node).flatMap(([key, value]) => [
    ...(key === 'review' || key === 'aggregateRating' || value === 'Review' || value === 'AggregateRating' ? [`${trail}.${key}`] : []),
    ...reviewMarkup(value, `${trail}.${key}`)
  ]);
}

/**
 * The <html lang> and the hreflang set a URL must carry, from
 * src/i18n/locales.json: '/en/…' is English, everything else Bulgarian; a page
 * in `localizedPages` lists every language plus x-default (Bulgarian), any
 * other page (the blog) lists none.
 */
function expectedLanguage(loc, locales) {
  const pathname = new URL(loc).pathname;
  const codes = locales.locales.map((l) => l.code);
  const prefix = (/^\/([a-z]{2,3})(?=\/|$)/.exec(pathname) || [])[1];
  const lang = prefix && prefix !== locales.defaultLocale && codes.includes(prefix) ? prefix : locales.defaultLocale;
  const page = lang === locales.defaultLocale ? pathname : pathname.slice(lang.length + 1) || '/';
  const inLanguage = (code) => `${SITE}${code === locales.defaultLocale ? '' : `/${code}`}${page}`;
  const alternates = locales.localizedPages.includes(page)
    ? [...codes.map((code) => `${code} ${inLanguage(code)}`), `x-default ${SITE}${page}`]
    : [];
  return { lang, alternates };
}

/** What is wrong with a live page's <html lang> and hreflang links ([] = nothing). */
function languageProblems(html, loc, locales) {
  const $ = cheerio.load(html);
  const { lang, alternates } = expectedLanguage(loc, locales);
  const actual = $('link[rel="alternate"][hreflang]').toArray().map((el) => `${$(el).attr('hreflang')} ${$(el).attr('href')}`);
  const problems = [];
  if ($('html').attr('lang') !== lang) problems.push(`lang="${$('html').attr('lang')}", expected "${lang}"`);
  if (JSON.stringify(actual) !== JSON.stringify(alternates)) problems.push(`hreflang [${actual.join(', ')}], expected [${alternates.join(', ')}]`);
  return problems;
}

/** Differences between the live LocalBusiness block and business.json. */
function businessMismatches(schema, business) {
  const out = [];
  const eq = (label, a, b) => { if (JSON.stringify(a) !== JSON.stringify(b)) out.push(`${label}: live ${JSON.stringify(a)} ≠ business.json ${JSON.stringify(b)}`); };
  eq('@type', schema['@type'], 'LocalBusiness');
  eq('name', schema.name, business.name);
  eq('telephone', schema.telephone, business.telephone);
  eq('address.streetAddress', schema.address && schema.address.streetAddress, business.address.streetAddress);
  eq('address.postalCode', schema.address && schema.address.postalCode, business.address.postalCode);
  eq('sameAs', schema.sameAs, business.sameAs);
  eq('priceRange', schema.priceRange, business.priceRange);
  return out;
}

async function main() {
  const args = process.argv.slice(2);
  const base = (args[args.indexOf('--base') + 1] && args.includes('--base') ? args[args.indexOf('--base') + 1] : SITE).replace(/\/$/, '');
  const toBase = (url) => url.replace(SITE, base);
  const business = JSON.parse(read('src/data/business.json'));
  const faqFile = path.join(ROOT, 'src/data/faq.json');
  const faq = fs.existsSync(faqFile) ? JSON.parse(fs.readFileSync(faqFile, 'utf8')) : null;

  let failures = 0;
  const ok = (msg) => console.log(`✅ ${msg}`);
  const fail = (msg) => { failures++; console.log(`❌ ${msg}`); };
  const check = (cond, okMsg, failMsg) => (cond ? ok(okMsg) : fail(failMsg));
  const get = async (url, opts = {}) => {
    const res = await fetch(toBase(url), { redirect: 'manual', ...opts });
    return { status: res.status, location: res.headers.get('location'), text: await res.text() };
  };

  console.log(`Live check of ${base} (${new Date().toISOString()})\n`);

  // robots.txt + crawler access
  const robots = await get(`${SITE}/robots.txt`);
  check(robots.status === 200 && /sitemap:/i.test(robots.text) && !robotsBlocksEverything(robots.text),
    'robots.txt allows crawling and names the sitemap', `robots.txt: HTTP ${robots.status} or it blocks crawling / has no Sitemap line`);
  for (const [name, ua] of Object.entries(CRAWLERS)) {
    const r = await get(`${SITE}/`, { headers: { 'User-Agent': ua } });
    check(r.status === 200 && r.text.includes('"LocalBusiness"'), `${name} gets the full home page`, `${name}: HTTP ${r.status} or a page without the schema (blocked/challenged?)`);
  }

  // Site-wide LocalBusiness schema
  const home = await get(`${SITE}/`);
  const homeSchema = jsonLdBlocks(home.text).find((b) => b['@id'] === `${SITE}/#organization`);
  if (!homeSchema) {
    fail('home: no #organization JSON-LD block');
  } else {
    const diff = businessMismatches(homeSchema, business);
    check(diff.length === 0, 'home: LocalBusiness schema matches business.json', `home schema: ${diff.join('; ')}`);
  }
  const siteName = cheerio.load(home.text)('meta[property="og:site_name"]').attr('content');
  check(siteName === business.name, `og:site_name is „${business.name}“`, `og:site_name is „${siteName}“, expected „${business.name}“`);
  const notFound = await get(`${SITE}/404.html`);
  const notFoundSchema = jsonLdBlocks(notFound.text).find((b) => b['@id'] === `${SITE}/#organization`);
  check(JSON.stringify(notFoundSchema) === JSON.stringify(homeSchema), '404.html carries the same schema as home', '404.html schema differs from home');

  // Every sitemap URL: 200 without redirect, self-canonical, canonical links, no review markup
  const sitemap = await get(`${SITE}/sitemap.xml`);
  const locs = [...sitemap.text.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]);
  check(sitemap.status === 200 && locs.length > 0, `sitemap.xml lists ${locs.length} URLs`, `sitemap.xml: HTTP ${sitemap.status}, ${locs.length} URLs`);
  const pages = {};
  for (const loc of locs) {
    const r = await get(loc);
    pages[loc] = r.text;
    const problems = [];
    if (r.status !== 200) problems.push(`HTTP ${r.status}${r.location ? ` → ${r.location}` : ''}`);
    const canonical = cheerio.load(r.text)('link[rel="canonical"]').attr('href');
    if (r.status === 200 && canonical !== loc) problems.push(`canonical is ${canonical}`);
    if (r.status === 200) problems.push(...findProblems(r.text));
    try {
      const marks = jsonLdBlocks(r.text).flatMap((b) => reviewMarkup(b));
      if (marks.length) problems.push(`review markup at ${marks.join(', ')}`);
    } catch (e) {
      problems.push(`invalid JSON-LD: ${e.message}`);
    }
    check(problems.length === 0, `${loc}`, `${loc}: ${problems.join('; ')}`);
  }

  // Slash-less URLs must 301 to the canonical slash form (GitHub Pages)
  for (const p of ['/contact', '/blog/what-is-3d-printing']) {
    const r = await get(`${SITE}${p}`);
    check(r.status === 301 && /\/$/.test(r.location || ''), `${p} → 301 to the slash form`, `${p}: HTTP ${r.status} → ${r.location}`);
  }

  // Legacy URLs keep pointing at their new pages
  for (const { from, to } of parseLegacyRedirects(read('LEGACY_REDIRECTS.md'))) {
    const r = await get(from);
    const $ = cheerio.load(r.text);
    const refresh = $('meta[http-equiv="refresh"]').attr('content') || '';
    check(r.status === 200 && refresh.includes(to) && $('link[rel="canonical"]').attr('href') === to,
      `${from} redirects to its new page`, `${from}: HTTP ${r.status}, refresh „${refresh}“`);
  }

  // llms.txt carries the business facts
  const llms = await get(`${SITE}/llms.txt`);
  const missing = business.facts.filter((f) => !llms.text.includes(f));
  check(llms.status === 200 && llms.text.startsWith(`# ${business.name}`) && missing.length === 0,
    'llms.txt has the name and every fact', `llms.txt: HTTP ${llms.status}, missing ${missing.length} fact(s)`);

  // IndexNow key file
  const key = findKey(path.join(ROOT, 'public'));
  const keyRes = await get(`${SITE}/${key}.txt`);
  check(keyRes.status === 200 && keyRes.text.trim() === key, 'IndexNow key file is served', `IndexNow key file: HTTP ${keyRes.status}`);

  // Visible NAP copy matches business.json
  const contact = pages[`${SITE}/contact/`] || (await get(`${SITE}/contact/`)).text;
  check(contact.includes(business.displayAddress), 'contact page shows the business.json address', 'contact page lacks business.json displayAddress');
  const prices = pages[`${SITE}/prices/`] || (await get(`${SITE}/prices/`)).text;
  check(prices.includes('Минимална стойност на поръчка'), 'prices page states the minimum order', 'prices page lacks the minimum-order line');

  // FAQ (Phase 4): visible on /prices/ and mirrored in FAQPage JSON-LD
  if (faq) {
    const faqPage = jsonLdBlocks(prices).flatMap((b) => (b['@graph'] ? b['@graph'] : [b])).find((n) => n['@type'] === 'FAQPage');
    const names = faqPage ? faqPage.mainEntity.map((q) => q.name) : [];
    check(JSON.stringify(names) === JSON.stringify(faq.map((q) => q.question)) && faq.every((q) => prices.includes(q.question)),
      `prices page has the ${faq.length}-question FAQ + FAQPage schema`, 'prices page FAQ or FAQPage schema missing / out of sync with faq.json');
  }

  // Languages (src/i18n/locales.json): every sitemap page carries its language
  // and exactly its hreflang set — each main page pairs with its translations,
  // the Bulgarian-only blog has none.
  const locales = JSON.parse(read('src/i18n/locales.json'));
  const languageIssues = locs.flatMap((loc) => languageProblems(pages[loc] || '', loc, locales).map((p) => `${loc}: ${p}`));
  check(languageIssues.length === 0, `every sitemap page has the right lang + hreflang (${locs.length} pages)`,
    `lang/hreflang problems:\n   ${languageIssues.join('\n   ')}`);

  // English pages show business.json numbers and the transliterated address
  const enPrices = pages[`${SITE}/en/prices/`];
  if (enPrices) {
    check(enPrices.includes(`Minimum order value: €${business.pricing.minimumOrder.toFixed(2)}`), '/en/prices/ states the minimum order', '/en/prices/ lacks the English minimum-order line');
  }
  const enContact = pages[`${SITE}/en/contact/`];
  if (enContact) {
    check(enContact.includes(business.displayAddressEn), '/en/contact/ shows the business.json English address', '/en/contact/ lacks business.json displayAddressEn');
  }

  console.log(`\n${failures === 0 ? '✅ all live checks passed' : `❌ ${failures} live check(s) failed`}`);
  process.exit(failures === 0 ? 0 : 1);
}

if (require.main === module) {
  main().catch((err) => {
    console.error(`❌ check-live-site crashed: ${err.stack || err.message}`);
    process.exit(1);
  });
}

module.exports = { parseLegacyRedirects, robotsBlocksEverything, jsonLdBlocks, reviewMarkup, businessMismatches, expectedLanguage, languageProblems };
