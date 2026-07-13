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
