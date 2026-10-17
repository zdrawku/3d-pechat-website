import { test, expect } from '@playwright/test';

/**
 * Prices calculator coverage. The calculation is
 *   total = max((grams / 10) * pricePerTenGrams, 3.00) for a non-empty order
 * (see prices-page.component.ts totalPrice getter). Tier rates:
 *   single-basic 0.80, multi-basic 1.00, single-complex 1.25, multi-complex 1.50.
 */
test.describe('prices calculator', () => {
  test.beforeEach(async ({ page }) => {
    // networkidle = the lazy page chunk has loaded and the prerendered page is
    // hydrated, so typing and the igx-select react (same as a11y/smoke specs).
    await page.goto('/prices', { waitUntil: 'networkidle' });
  });

  // The tier picker is an igx-select (not a native <select>), so it's driven by
  // opening the dropdown and clicking the option instead of Playwright's
  // selectOption(). Each igx-select-item carries data-testid="calc-tier-<id>".
  // A click that lands while the previous dropdown is still animating closed is
  // swallowed, so open until the option is visible, then wait for it to close.
  async function selectTier(page: import('@playwright/test').Page, id: string) {
    const option = page.getByTestId(`calc-tier-${id}`);
    await expect(async () => {
      if (!(await option.isVisible())) await page.getByTestId('calc-tier').click();
      await expect(option).toBeVisible({ timeout: 1_000 });
    }).toPass({ timeout: 10_000 });
    await option.click();
    await expect(option).toBeHidden();
  }

  test('computes total for grams × selected tier', async ({ page }) => {
    // 100g / 10 * 0.80 = 8.00
    await page.getByTestId('calc-grams').fill('100');
    await selectTier(page, 'single-basic');
    await expect(page.getByTestId('calc-total')).toHaveText(/8\.00\s*€/);

    // Switch tier only → 100g / 10 * 1.50 = 15.00
    await selectTier(page, 'multi-complex');
    await expect(page.getByTestId('calc-total')).toHaveText(/15\.00\s*€/);

    // Change grams → 250g / 10 * 1.50 = 37.50
    await page.getByTestId('calc-grams').fill('250');
    await expect(page.getByTestId('calc-total')).toHaveText(/37\.50\s*€/);
  });

  test('charges the 3 € minimum for small orders', async ({ page }) => {
    // 10g / 10 * 0.80 = 0.80 → below the minimum, so 3.00 is charged
    await page.getByTestId('calc-grams').fill('10');
    await selectTier(page, 'single-basic');
    await expect(page.getByTestId('calc-total')).toHaveText(/3\.00\s*€/);
    await expect(page.getByTestId('calc-minimum')).toBeVisible();

    // 50g / 10 * 0.80 = 4.00 → above the minimum, notice disappears
    await page.getByTestId('calc-grams').fill('50');
    await expect(page.getByTestId('calc-total')).toHaveText(/4\.00\s*€/);
    await expect(page.getByTestId('calc-minimum')).toHaveCount(0);
  });

  test('handles empty grams as zero, not NaN', async ({ page }) => {
    await page.getByTestId('calc-grams').fill('');
    // (grams || 0) guards this — result must be a number, never "NaN €".
    await expect(page.getByTestId('calc-total')).toHaveText(/0\.00\s*€/);
  });

  test('"order with this price" navigates to contact with the estimate prefilled', async ({
    page,
  }) => {
    await page.getByTestId('calc-grams').fill('150');
    await selectTier(page, 'multi-basic'); // 1.00 → 15.00

    await page.getByTestId('calc-order-btn').click();

    await expect(page).toHaveURL(/\/contact\/?$/);
    const message = page.locator('textarea[name="message"]');
    await expect(message).toHaveValue(/150г/);
    await expect(message).toHaveValue(/15\.00/);
  });
});
