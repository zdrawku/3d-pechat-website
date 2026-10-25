// The end-of-change handoff: which areas of the site a change touched, how to
// test each one, and what to do once it is live. Used by the `handoff` skill
// (.claude/skills/handoff/SKILL.md) so every change set closes with a test
// plan for exactly what changed and a "What's next" list.
//
//   node scripts/handoff-checklist.js [--base origin/main]
//
// Changed files = everything since `base` (default: origin/main, else main)
// plus anything uncommitted or untracked. Prints markdown; read-only.

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SITE = 'https://3dpechat.bg';

const BUILD = '`npm run build` — lint, generators, prerender, preloads, internal-link check';
const UNIT = '`npm test -- --watch=false --browsers=ChromeHeadless`';
const SCRIPTS = '`npm run test:scripts`';
const E2E = '`npm run build` then `npx http-server dist/dprinting-services-website/browser -p 8080 -s` and `PW_BASE_URL=http://localhost:8080 npm run e2e`';
const SCREENSHOTS = 'Playwright screenshots of the affected pages: light + dark, desktop (1280) + phone (390), Bulgarian + English';
const LIVE_CHECK = 'After the deploy: `npm run check:live` (crawlers, schema vs business.json, every sitemap URL, redirects, llms.txt, lang + hreflang)';
const INDEXNOW = 'Deploy log (*GitHub Pages* workflow → IndexNow step): the new / changed URLs were pinged to Bing';

/**
 * The site's areas. `match` takes a repo-relative path with forward slashes.
 * `tests` run before handing over, `manual` are what to look at by hand,
 * `live` are the steps once the change is deployed.
 */
const AREAS = [
  {
    id: 'blog',
    title: 'Blog posts (text, registry, translations)',
    match: (f) => /^src\/assets\/blogs\/.*\.md$/.test(f) || f === 'src/app/services/blog-posts.registry.ts' || /^src\/i18n\/[^/]+\/content\/blog\.json$/.test(f),
    tests: [BUILD, `${UNIT} — the registry spec (no leva, every post has text) and the translation contract (copy ↔ text ↔ locales.json)`],
    manual: [
      'Read each changed post: claims only from `src/data/business.json` facts, prices in euro, links end in `/`',
      'Open it in every language it exists in: the language link beside „Back“, related content, the FAQ (if any) shown and in the FAQPage schema',
      'Substantive text change → `dateModified` bumped (registry, or the translation’s `blog.json`) — and the other language updated too'
    ],
    live: [
      INDEXNOW,
      'Google Search Console → URL inspection → *Request indexing* for each NEW post URL (about 10 a day)',
      'In 1–2 weeks: Search Console → Pages — the new URLs indexed, no new 404s'
    ]
  },
  {
    id: 'i18n',
    title: 'Translations and languages',
    match: (f) => /^src\/i18n\//.test(f) || /^src\/app\/i18n\//.test(f),
    tests: [BUILD, `${UNIT} — i18n.spec (same keys, placeholders, no typed prices / hours, neverClaim) and locales.spec`, `${E2E} — seo.spec checks lang + hreflang on every page`],
    manual: ['Every changed string read in context in both languages', 'The language switcher and the footer language links on the affected pages', SCREENSHOTS],
    live: [LIVE_CHECK, 'Search Console → Performance, filter *Page contains /en/* — English impressions start appearing within weeks']
  },
  {
    id: 'facts',
    title: 'Business facts and FAQ',
    match: (f) => /^src\/data\/(business|faq)\.json$/.test(f) || /^src\/i18n\/[^/]+\/content\/faq\.json$/.test(f),
    tests: [`${BUILD} — regenerates the LocalBusiness schema and llms.txt`, `${UNIT} — business / faq specs`, SCRIPTS],
    manual: ['Search the hand-written copy (blog posts, product descriptions) for the old value and fix what still says it', 'The /prices/ FAQ in both languages'],
    live: [LIVE_CHECK, 'Google Business Profile and Bing Places: the same name, address, phone and hours (AI assistants compare them)']
  },
  {
    id: 'catalogue',
    title: 'Products and gallery',
    match: (f) => /^src\/data\/products\.json$/.test(f) || /^src\/i18n\/[^/]+\/content\/(products|gallery)\.json$/.test(f) || /manifest\.json$/.test(f) || /^src\/assets\/real-images\//.test(f),
    tests: [BUILD, `${UNIT} — products / gallery specs (English copy present or reported as pending)`],
    manual: ['/products/ and /en/products/: the card, both images, the `#linkId` deep link, the order button', 'Gallery pages: new images load, alt text in both languages'],
    live: ['Open the product’s deep link on a phone', LIVE_CHECK]
  },
  {
    id: 'ui',
    title: 'Pages and components (UI)',
    match: (f) => /^src\/app\/.*\.(html|scss|ts)$/.test(f) && !/\.spec\.ts$/.test(f) && !/\/(i18n|services)\//.test(f) && !/app\.routes/.test(f) || f === 'src/styles.scss',
    tests: [UNIT, `${BUILD} — watch the style budget warnings`, `${E2E} — functional + axe (a11y.spec)`],
    manual: [SCREENSHOTS, 'Built from Ignite UI components (CLAUDE.md Rule 1) and matching the approved design (Rule 2)', 'Keyboard: Tab through the changed controls, Enter / Escape behave'],
    live: [
      'Intentional visual change → run the *Visual regression* workflow with „update baselines“ (Linux screenshots)',
      'The next *Lighthouse* workflow run: performance / accessibility / SEO budgets still met'
    ]
  },
  {
    id: 'routes',
    title: 'Routes and URLs',
    match: (f) => /^src\/app\/app\.routes/.test(f) || /article\.routes\.ts$/.test(f) || f === 'LEGACY_REDIRECTS.md' || f === 'src/i18n/locales.json',
    tests: [`${UNIT} — app.routes.spec (routes, post matcher, prerender params)`, `${BUILD} — every page prerendered, no slash-less links`, `${E2E} — smoke loads every route`],
    manual: ['Every old URL still answers (a renamed page keeps a LegacyRedirect route + LEGACY_REDIRECTS.md row)', 'An unknown URL shows the 404 page in its language'],
    live: [LIVE_CHECK, 'URL set changed → Search Console → Sitemaps: resubmit `sitemap.xml` (same URL) to trigger a fresh read', 'In 1–2 weeks: Search Console → Pages, look for new „Not found (404)“']
  },
  {
    id: 'seo',
    title: 'SEO, head tags, sitemap, llms.txt',
    match: (f) => ['src/index.html', 'src/404.html', 'src/robots.txt', 'src/sitemap.xml', 'src/llms.txt', 'src/app/services/seo.service.ts'].includes(f) || /^scripts\/(generate-(sitemap|llms|business-schema)|indexnow|check-live-site|locale-urls)\.js$/.test(f),
    tests: [BUILD, SCRIPTS, `${E2E} — seo.spec`],
    manual: ['View source of one page per language: <title>, description, canonical, hreflang, JSON-LD', 'index.html and 404.html still in sync (CSP, scripts, meta)', 'Google Rich Results Test on a changed page (FAQPage / BlogPosting / LocalBusiness)'],
    live: [LIVE_CHECK, INDEXNOW, 'Search Console → URL inspection of a changed page: „URL is on Google“ / the new title after the next crawl']
  },
  {
    id: 'pipeline',
    title: 'Auto-blog pipeline',
    match: (f) => /^scripts\/auto-blog\//.test(f) || f === '.github/workflows/auto-blog.yml',
    tests: [`${SCRIPTS} — preflight, scaffolder, translation drafting, prompt facts`, '`node -e "require(\'./scripts/auto-blog/preflight\').preflight()"` — the anchors the scaffolder edits'],
    manual: ['Read the prompt changes against business.json facts / neverClaim'],
    live: ['The next scheduled run (the 1st, 11th and 21st, 09:00 UTC) or *Run workflow* by hand: review its PR in both languages before merging']
  },
  {
    id: 'phone',
    title: 'Issue-form flows (📦 Нов продукт, 🎬 Ново кратко видео)',
    match: (f) => /^\.github\/ISSUE_TEMPLATE\//.test(f) || f === '.github/issue-authors.json'
      || /^\.github\/workflows\/(add-product|make-short)\.yml$/.test(f)
      || /^scripts\/(add-product|make-short)\//.test(f) || /^scripts\/check-issue-author/.test(f)
      || /^\.claude\/skills\/(add-product|make-short)\//.test(f),
    tests: [`${SCRIPTS} — allowlist, issue parsing, conversation, facts check, flow validation`, 'The agent locally, exactly as CI runs it (the `claude -p` line in make-short.yml) on a sample `request.md`, then look at a frame from each beat'],
    manual: ['On a phone: New issue → „🎬 Ново кратко видео“ appears next to „📦 Нов продукт“ with its two fields', 'A comment from an account outside `.github/issue-authors.json` does nothing; an issue from one is closed'],
    live: ['After merge: open a real `🎬 Ново кратко видео` (or `📦 Нов продукт`) issue and follow it to the video comment; reply with feedback once (Actions tab for the logs; for the agent\'s transcript set the repo variable SHORTS_DEBUG=true first)']
  },
  {
    id: 'scripts',
    title: 'Build and maintenance scripts',
    match: (f) => /^scripts\//.test(f) && !/^scripts\/auto-blog\//.test(f) || f === 'package.json',
    tests: [SCRIPTS, 'Run each changed script once and read its output', BUILD],
    manual: [],
    live: ['The workflow that runs the script (deploy, live check, IndexNow) succeeds on its next run']
  },
  {
    id: 'ci',
    title: 'CI, tests and audits',
    match: (f) => /^\.github\/workflows\//.test(f) && f !== '.github/workflows/auto-blog.yml' || /^e2e\//.test(f) || ['playwright.config.ts', 'lighthouserc.js', 'karma.conf.js', 'angular.json'].includes(f),
    tests: ['Run the affected suite locally (e2e functional / visual / Lighthouse)'],
    manual: [],
    live: ['Watch the changed workflow’s next run', 'New visual tests → run *Visual regression* with „update baselines“ once, so they have Linux baselines']
  },
  {
    id: 'legal',
    title: 'Privacy Policy and Terms of Use',
    match: (f) => /^src\/legal\//.test(f) || /^src\/app\/legal-page\//.test(f),
    tests: [`${UNIT} — legal-docs.spec (both languages: same sections, every placeholder filled, the summary points)`, `${BUILD} — every legal page prerendered`],
    manual: [
      'Read each changed document in BOTH languages: it may state only `src/data/business.json` facts and must not contradict the consent card or the order flow',
      'Substantive change → `dateModified` bumped in LEGAL_DOCS (src/app/legal-page/legal-docs.ts) and the four MAIN_PAGE_LASTMOD entries in scripts/generate-sitemap.js',
      'A change in what data is collected, by whom, or for how long → have the text checked by a lawyer'
    ],
    live: [LIVE_CHECK, 'Open /privacy/#cookies and /en/terms/ on the live site: the summary card, the contents links, the „Последна промяна“ date']
  },
  {
    id: 'analytics',
    title: 'Analytics',
    // gtag itself, the AnalyticsService, a component that sends an event, a
    // template labelling a `cta_location` area, or the cookie consent.
    match: (f) => {
      if (!/\.(ts|html)$/.test(f) || /\.spec\.ts$/.test(f)) return false;
      try {
        return /gtag\(|AnalyticsService|ConsentService|data-analytics-area/.test(fs.readFileSync(path.join(ROOT, f), 'utf8'));
      } catch {
        return false;
      }
    },
    tests: [`${UNIT} — analytics.service.spec and the specs of the components that send events`],
    manual: ['GA4 → Admin → DebugView (or Realtime) with the site open: each changed event arrives with its parameters (event list: AI_INSTRUCTIONS.md § Analytics)'],
    live: ['GA4: mark new conversion events as key events and register new parameters as custom dimensions; check the Events report after 24–48 h']
  }
];

/** Every changed path, repo-relative with forward slashes. */
function changedFiles(base) {
  const run = (cmd) => {
    try {
      return execSync(cmd, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    } catch {
      return '';
    }
  };
  const ref = base || (run('git rev-parse --verify --quiet origin/main') ? 'origin/main' : 'main');
  const lists = [
    run(`git diff --name-only ${ref}...HEAD`),
    run('git diff --name-only'),
    run('git diff --name-only --cached'),
    run('git ls-files --others --exclude-standard')
  ];
  return { base: ref, files: [...new Set(lists.join('\n').split('\n').map((f) => f.trim()).filter(Boolean))].sort() };
}

const PAGE_DIRS = {
  'main-page': '/', 'portfolio-page': '/portfolio/', 'products-page': '/products/',
  'prices-page': '/prices/', 'contact-me-page': '/contact/', 'blog-list-page': '/blog/'
};
// legal-page serves two pages; a change to the component affects both.
const MULTI_PAGE_DIRS = { 'legal-page': ['/privacy/', '/terms/'] };

/** The public URLs a change shows up on, where the path says so (both languages for localized pages). */
function affectedUrls(files) {
  const locales = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/i18n/locales.json'), 'utf8'));
  const urls = new Set();
  for (const f of files) {
    const post = /^src\/assets\/blogs\/([^/]+)\.md$/.exec(f);
    if (post) {
      urls.add(`${SITE}/blog/${post[1]}/`);
      for (const [code, slugs] of Object.entries(locales.translatedPosts ?? {})) {
        if (slugs[post[1]]) urls.add(`${SITE}/${code}/blog/${slugs[post[1]]}/`);
      }
    }
    const translated = /^src\/assets\/blogs\/([a-z]{2})\/([^/]+)\.md$/.exec(f);
    if (translated) urls.add(`${SITE}/${translated[1]}/blog/${translated[2]}/`);
    const legal = /^src\/legal\/([a-z]{2})\/(privacy|terms)\.md$/.exec(f);
    if (legal) urls.add(`${SITE}${legal[1] === locales.defaultLocale ? '' : `/${legal[1]}`}/${legal[2]}/`);
    const page = /^src\/app\/([a-z-]+-page)\//.exec(f);
    for (const pagePath of page ? [PAGE_DIRS[page[1]], ...(MULTI_PAGE_DIRS[page[1]] ?? [])].filter(Boolean) : []) {
      urls.add(`${SITE}${pagePath}`);
      for (const { code } of locales.locales.filter((l) => l.code !== locales.defaultLocale)) {
        urls.add(`${SITE}/${code}${pagePath}`);
      }
    }
  }
  return [...urls];
}

/** { areas: [{ ...area, files }], other, urls } for a list of changed files. */
function plan(files) {
  const areas = AREAS.map((area) => ({ ...area, files: files.filter(area.match) })).filter((a) => a.files.length);
  const covered = new Set(areas.flatMap((a) => a.files));
  return { areas, other: files.filter((f) => !covered.has(f)), urls: affectedUrls(files) };
}

/** The checklist as markdown. */
function render({ base, files }, { areas, other, urls }) {
  const lines = [`# Handoff checklist — ${files.length} changed file(s) since ${base}`, ''];
  if (!files.length) return `${lines[0]}\n\nNothing changed.\n`;
  if (urls.length) lines.push('**Pages affected:**', ...urls.map((u) => `- ${u}`), '');
  const unique = (list) => [...new Set(list)];
  lines.push('## Test plan', '');
  for (const area of areas) {
    lines.push(`### ${area.title} (${area.files.length})`, ...area.files.slice(0, 12).map((f) => `- \`${f}\``));
    if (area.files.length > 12) lines.push(`- … and ${area.files.length - 12} more`);
    lines.push('', 'Automated:', ...area.tests.map((t) => `- [ ] ${t}`));
    if (area.manual.length) lines.push('', 'By hand:', ...area.manual.map((m) => `- [ ] ${m}`));
    lines.push('');
  }
  if (other.length) lines.push('### Other files', ...other.map((f) => `- \`${f}\` — no standard checks; say what you verified`), '');
  lines.push("## What's next (once it's live)", '');
  const live = unique([...areas.flatMap((a) => a.live), LIVE_CHECK]);
  lines.push(...live.map((step, i) => `${i + 1}. ${step}`), '');
  return lines.join('\n');
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const base = args.includes('--base') ? args[args.indexOf('--base') + 1] : undefined;
  const changes = changedFiles(base);
  process.stdout.write(render(changes, plan(changes.files)));
}

module.exports = { AREAS, plan, render, affectedUrls, changedFiles };
