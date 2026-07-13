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
    const sortAsc = page.getByTestId('sort-asc');
    await sortAsc.click();
    // Wait for the button's active state so the re-sort has been applied
    // (retrying assertion) before reading the card order.
    await expect(sortAsc).toHaveClass(/active/);

    const titles = await page.locator('[data-testid="product-card"] .card-title').allInnerTexts();
    const trimmed = titles.map((t) => t.trim()).filter(Boolean);
    const sorted = [...trimmed].sort((a, b) => a.localeCompare(b, 'bg'));
    expect(trimmed).toEqual(sorted);
  });

  test('newest vs oldest sort produce a different first card', async ({ page }) => {
    const firstCard = page.locator('[data-testid="product-card"] .card-title').first();

    await page.getByTestId('sort-newest').click();
    await expect(page.getByTestId('sort-newest')).toHaveClass(/active/);
    const newestFirst = (await firstCard.innerText()).trim();

    await page.getByTestId('sort-oldest').click();
    // Wait for the first card's text to change before reading it, so we never
    // read the stale (pre-resort) value.
    await expect(firstCard).not.toHaveText(newestFirst);
    const oldestFirst = (await firstCard.innerText()).trim();

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
 * card exposes (e.g. /products#headphone-stand-big). Covered:
 *   1. clicking the copy button updates the address bar, copies the shareable
 *      URL, and shows a "copied" checkmark (onCopyLink in products-page).
 *   2. visiting such a URL directly lands on the matching card.
 *   3. the deep link works even when a search would otherwise filter the card
 *      out — the page clears the search so the target renders (the case that
 *      used to silently fail).
 */
test.describe('product section links', () => {
  const SECTION_ID = 'headphone-stand-big';

  test('copy-link button updates the URL, copies it, and shows feedback', async ({
    page,
    context,
  }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/products');

    const card = page.locator(`#${SECTION_ID}`);
    await expect(card).toBeVisible();
    const copyBtn = card.getByTestId('product-copy-link');
    await copyBtn.click();

    // Address bar now carries the anchor...
    await expect(page).toHaveURL(new RegExp(`/products#${SECTION_ID}$`));

    // ...the clipboard holds the full shareable URL...
    const clipboard = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboard).toContain(`/products#${SECTION_ID}`);

    // ...and the button shows the transient "copied" state (green checkmark).
    await expect(copyBtn).toHaveClass(/copied/);
    await expect(copyBtn.locator('igx-icon')).toHaveText('check');
  });

  test('visiting a section link lands on the matching product card', async ({ page }) => {
    await page.goto(`/products#${SECTION_ID}`);

    const card = page.locator(`#${SECTION_ID}`);
    await expect(card).toBeVisible();
    await expect(card).toBeInViewport();
  });

  test('deep link reveals the card even when a search would filter it out', async ({ page }) => {
    // Arrive with a search that excludes the target, then apply the fragment.
    // The page should clear the search so the card renders and scrolls in.
    await page.goto('/products');
    await page.getByTestId('product-search').fill('монетна'); // excludes headphone-stand-big
    await expect(page.locator(`#${SECTION_ID}`)).toHaveCount(0);

    // Navigate to the fragment (as if following a shared link within the app).
    await page.evaluate((id) => {
      location.hash = id;
    }, SECTION_ID);

    const card = page.locator(`#${SECTION_ID}`);
    await expect(card).toBeVisible();
    await expect(card).toBeInViewport();
    // Search was cleared so the full catalog (incl. the target) is shown again.
    await expect(page.getByTestId('product-search')).toHaveValue('');
  });
});
