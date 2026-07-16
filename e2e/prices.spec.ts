import { test, expect } from '@playwright/test';

/**
 * Prices calculator coverage. The calculation is
 *   total = (grams / 10) * pricePerTenGrams
 * (see prices-page.component.ts totalPrice getter). Tier rates:
 *   single-basic 0.80, multi-basic 1.00, single-complex 1.25, multi-complex 1.50.
 */
test.describe('prices calculator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/prices');
  });

  // The tier picker is an igx-select (not a native <select>), so it's driven by
  // opening the dropdown and clicking the option instead of Playwright's
  // selectOption(). Each igx-select-item carries data-testid="calc-tier-<id>".
  async function selectTier(page: import('@playwright/test').Page, id: string) {
    await page.getByTestId('calc-tier').click();
    await page.getByTestId(`calc-tier-${id}`).click();
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
