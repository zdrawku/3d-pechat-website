import { test, expect } from '@playwright/test';

/**
 * Products page interaction coverage: search, sort, the empty state, and the
 * "order" navigation into the contact page. Products themselves are a hardcoded
 * array in products-page.component.ts (there is no "add product" UI), so what
 * we protect is the filter/sort behaviour and the count staying truthful.
 */
test.describe('products page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/products');
  });

  test('shows all products by default and count matches rendered cards', async ({ page }) => {
    const cards = page.getByTestId('product-card');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
    // The "Показани N от M" line should agree with the rendered card count.
    await expect(page.getByTestId('product-result-count')).toContainText(String(count));
  });

  test('search filters the grid', async ({ page }) => {
    const cards = page.getByTestId('product-card');
    const initial = await cards.count();

    // "слушалки" (headphones) matches fewer products than the full catalog.
    await page.getByTestId('product-search').fill('слушалки');
    await expect(cards).not.toHaveCount(initial);
    const filtered = await cards.count();
    expect(filtered).toBeGreaterThan(0);
    expect(filtered).toBeLessThan(initial);

    // Every remaining card should mention the term (name or description).
    for (const card of await cards.all()) {
      await expect(card).toContainText(/слушалки/i);
    }
  });

  test('no-match search shows the empty state', async ({ page }) => {
    await page.getByTestId('product-search').fill('zzz-нищо-няма-такова');
    await expect(page.getByTestId('product-empty-state')).toBeVisible();
    await expect(page.getByTestId('product-card')).toHaveCount(0);

    // The reset button in the empty state restores the full catalog.
    await page.getByTestId('product-empty-state').getByRole('button').click();
    await expect(page.getByTestId('product-card').first()).toBeVisible();
  });

  test('sort A-Я orders cards alphabetically', async ({ page }) => {
    await page.getByTestId('sort-asc').click();

    const titles = await page.locator('[data-testid="product-card"] .card-title').allInnerTexts();
    const trimmed = titles.map((t) => t.trim()).filter(Boolean);
    const sorted = [...trimmed].sort((a, b) => a.localeCompare(b, 'bg'));
    expect(trimmed).toEqual(sorted);
  });

  test('newest vs oldest sort produce a different first card', async ({ page }) => {
    await page.getByTestId('sort-newest').click();
    const newestFirst = (
      await page.locator('[data-testid="product-card"] .card-title').first().innerText()
    ).trim();

    await page.getByTestId('sort-oldest').click();
    const oldestFirst = (
      await page.locator('[data-testid="product-card"] .card-title').first().innerText()
    ).trim();

    expect(newestFirst).not.toBe(oldestFirst);
  });

  test('ordering a product navigates to contact with a prefilled message', async ({ page }) => {
    const firstOrder = page.getByTestId('product-order-btn').first();
    await firstOrder.click();

    await expect(page).toHaveURL(/\/contact\/?$/);
    // orderProduct() passes a prefilled message via router state; the contact
    // component copies it into the message textarea.
    await expect(page.locator('textarea[name="message"]')).toHaveValue(/искам да поръчам/i);
  });
});

/**
 * Deep-link / "copy section link" coverage — the # anchor links each product
 * card exposes (e.g. /products#headphone-stand-big). Two directions:
 *   1. clicking the copy button writes the anchor URL to the clipboard and
 *      updates the address bar (copySectionLink in product-grid.component.ts).
 *   2. visiting such a URL directly lands on the matching card.
 */
test.describe('product section links', () => {
  const SECTION_ID = 'headphone-stand-big';

  test('copy-link button updates the URL hash and copies it to the clipboard', async ({
    page,
    context,
  }) => {
    // copySectionLink() calls navigator.clipboard.writeText — grant permission.
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/products');

    // The copy button lives on the card whose id === SECTION_ID.
    const card = page.locator(`#${SECTION_ID}`);
    await expect(card).toBeVisible();
    await card.getByTestId('product-copy-link').click();

    // Address bar now carries the anchor...
    await expect(page).toHaveURL(new RegExp(`/products#${SECTION_ID}$`));

    // ...and the clipboard holds the full shareable URL.
    const clipboard = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboard).toContain(`/products#${SECTION_ID}`);
  });

  test('visiting a section link lands on the matching product card', async ({ page }) => {
    await page.goto(`/products#${SECTION_ID}`);

    const card = page.locator(`#${SECTION_ID}`);
    await expect(card).toBeVisible();
    // The targeted card should be scrolled into the viewport.
    await expect(card).toBeInViewport();
  });
});
