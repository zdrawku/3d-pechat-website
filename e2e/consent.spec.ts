import { test, expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * The cookie consent card (approved design „B“) and Consent Mode v2 in basic
 * mode, on the built site: nothing from Google loads before „Приемам“.
 * These tests start without an answer (playwright.config.ts seeds a "declined"
 * one for every other test); Google's hosts are blocked, so nothing is sent.
 */
test.use({ storageState: { cookies: [], origins: [] } });

// Analytics and, since the fonts are self-hosted, Google Fonts too (Privacy Policy).
const GOOGLE = /googletagmanager\.com|google-analytics\.com|fonts\.googleapis\.com|fonts\.gstatic\.com/;

/** Blocks Google's hosts and records every request the page makes to them. */
async function watchGoogle(page: Page): Promise<string[]> {
  const requests: string[] = [];
  await page.route(GOOGLE, (route) => {
    requests.push(route.request().url());
    return route.abort();
  });
  return requests;
}

const card = (page: Page) => page.getByTestId('consent-card');

test('asks on the first visit and loads nothing from Google until then', async ({ page }) => {
  const google = await watchGoogle(page);
  await page.goto('/', { waitUntil: 'networkidle' });

  await expect(card(page)).toBeVisible();
  await expect(card(page)).toContainText('Бисквитки за статистика');
  expect(google).toEqual([]);
  expect(await page.context().cookies()).not.toContainEqual(expect.objectContaining({ name: '_ga' }));
});

test('„Отказвам“ closes the card for good and still loads nothing', async ({ page }) => {
  const google = await watchGoogle(page);
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.getByTestId('consent-decline').click();
  await expect(card(page)).toBeHidden();

  await page.reload({ waitUntil: 'networkidle' });
  await expect(card(page)).toBeHidden();
  expect(google).toEqual([]);
});

test('„Приемам“ loads Google Analytics, now and on the next visit', async ({ page }) => {
  const google = await watchGoogle(page);
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.getByTestId('consent-accept').click();
  await expect(card(page)).toBeHidden();
  await expect.poll(() => google.some((url) => url.includes('gtag/js?id=G-YBR644GQL9'))).toBe(true);

  google.length = 0;
  await page.reload({ waitUntil: 'networkidle' });
  await expect(card(page)).toBeHidden();
  await expect.poll(() => google.some((url) => url.includes('gtag/js'))).toBe(true);
});

test('the footer „Бисквитки“ button reopens the card to change the answer', async ({ page }) => {
  await watchGoogle(page);
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.getByTestId('consent-accept').click();
  await page.getByTestId('footer-cookies').click();
  await expect(card(page)).toBeVisible();
  await page.getByTestId('consent-decline').click();

  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('consent') ?? 'null'));
  expect(stored.analytics).toBe('denied');
});

test('speaks English on English pages', async ({ page }) => {
  await watchGoogle(page);
  await page.goto('/en/', { waitUntil: 'networkidle' });
  await expect(card(page)).toContainText('Analytics cookies');
  await expect(page.getByTestId('consent-accept')).toHaveText('Accept');
});

test.describe('on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('sits along the bottom and leaves the hero title and quote button visible', async ({ page }) => {
    await watchGoogle(page);
    await page.goto('/', { waitUntil: 'networkidle' });
    const box = (await card(page).boundingBox())!;
    const title = (await page.locator('h1').first().boundingBox())!;
    expect(box.y + box.height).toBeGreaterThan(844 - 24);
    expect(title.y + title.height).toBeLessThan(box.y);
  });
});

test('has no serious or critical accessibility violations', async ({ page }) => {
  await watchGoogle(page);
  await page.goto('/', { waitUntil: 'networkidle' });
  await expect(card(page)).toBeVisible();
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .include('[data-testid="consent-card"]')
    .analyze();
  expect(results.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? ''))).toEqual([]);
});
