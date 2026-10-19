import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { ALL_ROUTES } from './routes';

// The one source of truth for the business identity (CLAUDE.md Rule 5).
const business = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'src/data/business.json'), 'utf8'));

/**
 * SEO guardrails. These protect the prerendered <head> — the meta tags,
 * canonical, and sitemap Googlebot reads. A regression here is invisible in
 * the UI but breaks indexing, so it gets its own suite.
 */
test.describe('SEO metadata', () => {
  for (const route of ALL_ROUTES) {
    test(`${route.path} has core SEO tags`, async ({ page }) => {
      await page.goto(route.path);

      // Non-empty title.
      const title = await page.title();
      expect(title.trim().length, `title on ${route.path}`).toBeGreaterThan(0);

      // Meta description present and non-empty.
      const description = page.locator('meta[name="description"]');
      await expect(description).toHaveCount(1);
      expect(
        (await description.getAttribute('content'))?.trim().length ?? 0,
        `meta description on ${route.path}`,
      ).toBeGreaterThan(0);

      // Canonical link present.
      const canonical = page.locator('link[rel="canonical"]');
      await expect(canonical).toHaveCount(1);
      const canonicalHref = await canonical.getAttribute('href');
      expect(canonicalHref, `canonical href on ${route.path}`).toMatch(/^https:\/\/3dpechat\.bg/);

      // Open Graph title + image (social preview).
      await expect(page.locator('meta[property="og:title"]')).toHaveCount(1);
      await expect(page.locator('meta[property="og:image"]')).toHaveCount(1);
    });
  }

  // Mirrors scripts/check-internal-links.js (the postbuild guard). Internal
  // page links must carry the trailing slash GitHub Pages canonicalises to, and
  // 3dpechat.bg URLs must be https without www — see that script for the rules.
  for (const route of ALL_ROUTES) {
    test(`${route.path} links internally with canonical URLs`, async ({ page }) => {
      await page.goto(route.path);

      const hrefs = await page.$$eval('[href]', (els) =>
        els.map((el) => (el.getAttribute('href') ?? '').trim()),
      );
      const slashless = hrefs.filter((href) => {
        if (!href.startsWith('/') || href.startsWith('//')) return false;
        const pathname = href.split(/[?#]/, 1)[0];
        if (pathname === '' || pathname.endsWith('/')) return false;
        return !pathname.slice(pathname.lastIndexOf('/') + 1).includes('.');
      });
      expect(slashless, `slash-less internal hrefs on ${route.path}`).toEqual([]);

      const html = await page.content();
      const badHosts = html.match(/https?:\/\/www\.3dpechat\.bg|http:\/\/(?:www\.)?3dpechat\.bg/gi) ?? [];
      expect(badHosts, `non-canonical 3dpechat.bg URLs on ${route.path}`).toEqual([]);
    });
  }

  test('sitemap.xml lists every core and blog route', async ({ request }) => {
    const res = await request.get('/sitemap.xml');
    expect(res.status()).toBe(200);
    const xml = await res.text();

    for (const route of ALL_ROUTES) {
      // The exact <loc>: a bare path would also match another page's hreflang links.
      const loc = `https://3dpechat.bg${route.path.replace(/\/?$/, '/')}`;
      expect(xml, `${route.path} present in sitemap`).toContain(`<loc>${loc}</loc>`);
    }
  });

  test('LocalBusiness JSON-LD matches business.json (name, contacts, address, geo, profiles)', async ({ page }) => {
    await page.goto('/');
    const raw = await page.locator('script#organization-jsonld').textContent();
    const org = JSON.parse(raw ?? '{}');
    expect(org['@type']).toBe('LocalBusiness');
    expect(org['@id']).toBe('https://3dpechat.bg/#organization');
    expect(org.name).toBe(business.name);
    expect(org.telephone).toBe(business.telephone);
    expect(org.address.postalCode).toBe('1700');
    expect(org.address.streetAddress).toBe(business.address.streetAddress);
    expect(org.geo).toEqual(expect.objectContaining({ latitude: business.geo.latitude, longitude: business.geo.longitude }));
    expect(org.openingHoursSpecification[0]).toEqual(expect.objectContaining({ opens: '09:00', closes: '18:00' }));
    expect(org.sameAs).toEqual(business.sameAs);
    await expect(page.locator('meta[property="og:site_name"]')).toHaveAttribute('content', business.name);
  });

  test('404.html carries the same LocalBusiness JSON-LD as the home page', async ({ page, request }) => {
    await page.goto('/');
    const home = JSON.parse((await page.locator('script#organization-jsonld').textContent()) ?? '{}');
    const html = await (await request.get('/404.html')).text();
    const match = html.match(/id="organization-jsonld">([\s\S]*?)<\/script>/);
    expect(match, 'organization-jsonld in 404.html').not.toBeNull();
    expect(JSON.parse(match![1])).toEqual(home);
  });

  // Self-serving review markup for our own Google reviews risks a manual
  // penalty (CLAUDE.md, "Other standing rules") — guard every page's JSON-LD.
  // Reads the prerendered HTML over HTTP (what crawlers get) — one request per
  // route instead of a full browser navigation, so it stays well inside the timeout.
  test('no page emits Review or AggregateRating structured data', async ({ request }) => {
    const offenders: string[] = [];
    const walk = (node: unknown, where: string): void => {
      if (Array.isArray(node)) return node.forEach((n) => walk(n, where));
      if (node && typeof node === 'object') {
        for (const [key, value] of Object.entries(node)) {
          if (key === 'aggregateRating' || key === 'review' || value === 'Review' || value === 'AggregateRating') {
            offenders.push(`${where}: ${key}`);
          }
          walk(value, where);
        }
      }
    };
    for (const route of ALL_ROUTES) {
      const html = await (await request.get(route.path.replace(/\/?$/, '/'))).text();
      const blocks = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)];
      expect(blocks.length, `JSON-LD on ${route.path}`).toBeGreaterThan(0);
      for (const [, raw] of blocks) {
        walk(JSON.parse(raw), route.path);
      }
    }
    expect(offenders).toEqual([]);
  });

  test('llms.txt is generated from business.json (name, facts, profiles)', async ({ request }) => {
    const res = await request.get('/llms.txt');
    expect(res.status()).toBe(200);
    const text = await res.text();
    expect(text.startsWith(`# ${business.name}`)).toBe(true);
    for (const fact of business.facts) expect(text).toContain(fact);
    for (const url of business.sameAs) expect(text).toContain(url);
    expect(text).not.toMatch(/SLA и SLS/);
  });

  // Languages (src/i18n/locales.json): every main page exists in Bulgarian and
  // English, and each version declares all of them with Bulgarian as x-default.
  // The blog is Bulgarian-only and carries no hreflang.
  const locales = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'src/i18n/locales.json'), 'utf8')) as {
    defaultLocale: string;
    locales: { code: string; ogLocale: string }[];
    localizedPages: string[];
  };
  const inLanguage = (page: string, code: string) => (code === locales.defaultLocale ? page : `/${code}${page}`);

  for (const page of locales.localizedPages) {
    for (const { code, ogLocale } of locales.locales) {
      const route = inLanguage(page, code);
      test(`${route} has lang="${code}", og:locale ${ogLocale} and every language version in hreflang`, async ({ page: tab }) => {
        await tab.goto(route);
        await expect(tab.locator('html')).toHaveAttribute('lang', code);
        await expect(tab.locator('meta[property="og:locale"]')).toHaveAttribute('content', ogLocale);
        await expect(tab.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://3dpechat.bg${route}`);
        for (const other of locales.locales) {
          await expect(tab.locator(`link[rel="alternate"][hreflang="${other.code}"]`))
            .toHaveAttribute('href', `https://3dpechat.bg${inLanguage(page, other.code)}`);
        }
        await expect(tab.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveAttribute('href', `https://3dpechat.bg${page}`);
      });
    }
  }

  test('blog pages carry no hreflang and stay Bulgarian', async ({ page }) => {
    await page.goto('/blog/what-is-3d-printing/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'bg');
    await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(0);
  });

  test('/en/prices/ shows the English FAQ and mirrors it as FAQPage JSON-LD', async ({ page }) => {
    // The English copy is keyed by FAQ id; the order comes from src/data/faq.json.
    const english = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'src/i18n/en/content/faq.json'), 'utf8')) as Record<string, { question: string }>;
    const faq = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'src/data/faq.json'), 'utf8')) as { id: string }[];
    const questions = faq.map(({ id }) => english[id].question);
    await page.goto('/en/prices/');
    const section = page.locator('section#faq');
    for (const question of questions) {
      await expect(section.getByRole('heading', { name: question })).toBeVisible();
    }
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    const faqPage = blocks.map((b) => JSON.parse(b)).find((b) => b['@type'] === 'FAQPage');
    expect(faqPage?.mainEntity.map((q: { name: string }) => q.name)).toEqual(questions);
  });

  test('/prices/ shows every faq.json question and mirrors them as FAQPage JSON-LD', async ({ page }) => {
    const faq = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'src/data/faq.json'), 'utf8')) as { question: string; answer: string }[];
    await page.goto('/prices/');
    const section = page.locator('section#faq');
    await expect(section).toBeVisible();
    for (const { question, answer } of faq) {
      await expect(section.getByRole('heading', { name: question })).toBeVisible();
      await expect(section.getByText(answer)).toBeVisible();
    }
    const raw = await page.locator('script#structured-data-jsonld').textContent();
    const data = JSON.parse(raw ?? '{}');
    expect(data['@type']).toBe('FAQPage');
    expect(data.mainEntity.map((q: { name: string }) => q.name)).toEqual(faq.map((q) => q.question));
  });

  // IndexNow (scripts/indexnow.js) verifies ownership by fetching this file.
  test('the IndexNow key file is deployed at the site root', async ({ request }) => {
    const keyFile = fs.readdirSync(path.resolve(process.cwd(), 'public')).find((f) => /^[0-9a-f]{32}\.txt$/.test(f));
    expect(keyFile, 'public/<32 hex>.txt').toBeTruthy();
    const res = await request.get(`/${keyFile}`);
    expect(res.status()).toBe(200);
    expect((await res.text()).trim()).toBe(keyFile!.replace('.txt', ''));
  });

  test('robots.txt is served and references the sitemap', async ({ request }) => {
    const res = await request.get('/robots.txt');
    expect(res.status()).toBe(200);
    expect((await res.text()).toLowerCase()).toContain('sitemap');
  });
});
