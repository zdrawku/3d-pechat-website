import { test, expect, Page } from '@playwright/test';
import { ALL_ROUTES, CORE_ROUTES } from './routes';

/**
 * Collects page-level problems so a test can assert the page rendered cleanly.
 * Kept in two buckets so failures are actionable:
 *  - jsErrors: uncaught exceptions / console.error (a broken page)
 *  - failedResources: URLs that returned 4xx/5xx or failed to load (broken
 *    images, missing assets) — reported with the URL, not a generic message.
 * Third-party hosts we don't control (captcha, analytics) and favicon are ignored.
 */
function attachErrorCollector(page: Page): { jsErrors: string[]; failedResources: string[] } {
  const jsErrors: string[] = [];
  const failedResources: string[] = [];
  // Third-party hosts (captcha, analytics/telemetry, CDNs) and favicon are not
  // part of the app under test — their availability is out of our control.
  const ignore = (text: string) =>
    /hcaptcha|web3forms|googletagmanager|google-analytics|analytics\.google|google\.com\/(g\/)?collect|\/g\/collect|doubleclick|gstatic|fonts\.googleapis|favicon/i.test(
      text,
    );

  page.on('console', (msg) => {
    // Skip the generic "Failed to load resource" console line — the response
    // listener below reports those with their URL instead.
    if (
      msg.type() === 'error' &&
      !ignore(msg.text()) &&
      !/Failed to load resource/i.test(msg.text())
    ) {
      jsErrors.push(`console: ${msg.text()}`);
    }
  });
  page.on('pageerror', (err) => {
    if (!ignore(err.message)) {
      jsErrors.push(`pageerror: ${err.message}`);
    }
  });
  page.on('response', (res) => {
    if (res.status() >= 400 && !ignore(res.url())) {
      failedResources.push(`${res.status()} ${res.url()}`);
    }
  });
  page.on('requestfailed', (req) => {
    if (!ignore(req.url())) {
      failedResources.push(`failed ${req.url()}`);
    }
  });
  return { jsErrors, failedResources };
}

test.describe('page smoke tests', () => {
  for (const route of ALL_ROUTES) {
    test(`${route.path} loads without errors`, async ({ page }) => {
      const collector = attachErrorCollector(page);

      const response = await page.goto(route.path, { waitUntil: 'networkidle' });
      expect(response?.status(), `HTTP status for ${route.path}`).toBeLessThan(400);

      // The app shell (header + footer) must be present on every page.
      await expect(page.locator('igx-navbar')).toBeVisible();
      await expect(page.locator('footer')).toBeVisible();

      // Page-specific heading/title assertions where we defined them.
      if (route.title) {
        await expect(page).toHaveTitle(new RegExp(route.title, 'i'));
      }
      if (route.heading) {
        await expect(
          page.getByRole('heading', { name: new RegExp(route.heading, 'i') }).first(),
        ).toBeVisible();
      }

      // A broken page (uncaught JS error) is always a hard failure.
      expect(collector.jsErrors, `JS/console errors on ${route.path}`).toEqual([]);
      // Missing assets (broken images, 404s) are reported with their URL.
      expect(collector.failedResources, `failed resources on ${route.path}`).toEqual([]);
    });
  }
});

test.describe('navigation', () => {
  test('drawer links navigate to core pages', async ({ page }) => {
    await page.goto('/');

    for (const route of CORE_ROUTES) {
      if (route.path === '/') continue;
      // Drawer chips carry the destination as routerLink; click by href.
      // Hrefs render with a canonical trailing slash (see
      // TrailingSlashUrlSerializer), so match either form.
      const link = page
        .locator(`a.drawer_chip[href="${route.path}"], a.drawer_chip[href="${route.path}/"]`)
        .first();
      await expect(link).toBeVisible();
      await link.click();
      await expect(page).toHaveURL(new RegExp(`${route.path}/?$`));
      // The drawer is persistent ([isOpen]="true") and stays open across
      // navigations on this desktop viewport, so we chain directly to the next
      // route without reloading '/'.
    }
  });

  test('header CTA goes to contact page', async ({ page }) => {
    await page.goto('/');
    await page.locator('a.nav_cta_button').click();
    await expect(page).toHaveURL(/\/contact\/?$/);
  });

  test('unknown route serves the branded 404 fallback', async ({ page, request }) => {
    // The site targets static hosting (GitHub Pages style): unknown paths are
    // served src/404.html — a branded SEO fallback with a proper 404 status.
    // It deliberately does NOT bundle the app script (see src/404.html), so we
    // assert on the served document, not a hydrated component.
    //
    // NOTE: the *production* deploy (.github/workflows/github-pages.yml) instead
    // copies index.html → 404.html (SPA fallback), so on the live site an
    // unknown route boots Angular and renders PageNotFoundComponent. This test
    // reflects the local build's static 404.html, which is the correct target
    // for the suite as configured here.
    // The static build/http-server returns a real 404; a dev server (ng serve
    // via PW_BASE_URL) rewrites unknown routes to index.html with 200. Accept
    // both so the suite is robust to either hosting mode.
    const res = await request.get('/this-route-does-not-exist');
    expect([200, 404], 'unknown route should return 200 (SPA rewrite) or 404').toContain(
      res.status(),
    );

    await page.goto('/this-route-does-not-exist');
    await expect(page).toHaveTitle(/3D печат/i);
    // The app shell placeholder is present so hosting that DOES boot the SPA
    // (e.g. a rewrite to index.html) still lands on the app.
    await expect(page.locator('app-root')).toBeAttached();
  });
});
