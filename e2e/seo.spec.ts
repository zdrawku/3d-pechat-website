import { test, expect } from '@playwright/test';
import { ALL_ROUTES } from './routes';

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

  test('sitemap.xml lists every core and blog route', async ({ request, baseURL }) => {
    const res = await request.get('/sitemap.xml');
    expect(res.status()).toBe(200);
    const xml = await res.text();

    for (const route of ALL_ROUTES) {
      // Home is "/" — match the bare domain; others match their path.
      const needle = route.path === '/' ? '3dpechat.bg/' : route.path.replace(/^\//, '');
      expect(xml, `${route.path} present in sitemap`).toContain(needle);
    }
  });

  test('robots.txt is served and references the sitemap', async ({ request }) => {
    const res = await request.get('/robots.txt');
    expect(res.status()).toBe(200);
    expect((await res.text()).toLowerCase()).toContain('sitemap');
  });
});
