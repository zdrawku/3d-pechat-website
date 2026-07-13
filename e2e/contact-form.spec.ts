import { test, expect } from '@playwright/test';

/**
 * Contact form behaviour. The real backend (api.web3forms.com) and hCaptcha
 * are never hit — the submit request is intercepted and hCaptcha is stubbed —
 * so these tests are hermetic and safe to run in CI.
 *
 * NOTE: the file-upload UI is currently commented out in the template
 * (Web3Forms Pro feature). When it's re-enabled, add coverage for the
 * size-limit ('invalid-file') and chip-removal paths here.
 */
test.describe('contact form', () => {
  test('shows a validation error when submitting empty', async ({ page }) => {
    await page.goto('/contact');

    await page.getByTestId('contact-submit').click();

    // Component sets submitStatus = 'missing-fields' before any captcha check.
    await expect(page.locator('.form-status--error')).toContainText(/попълнете всички полета/i);
  });

  test('shows per-field required hints for empty required inputs', async ({ page }) => {
    await page.goto('/contact');

    // Touch then clear the name field so its igx-hint (valueMissing) renders.
    const name = page.locator('input[name="value"]');
    await name.click();
    await name.fill('x');
    await name.fill('');
    await name.blur();

    // Scope the hint to the name field's own input group so this can't match a
    // hint from another field.
    const nameGroup = page
      .locator('igx-input-group')
      .filter({ has: page.locator('input[name="value"]') });
    await expect(nameGroup.locator('igx-hint')).toContainText(/задължително/i);
  });

  test('blocks submit on the captcha gate when fields are filled', async ({ page }) => {
    // Guard rail: the Web3Forms endpoint must NOT be called without a captcha
    // token. If the component ever regresses and skips the gate, this route
    // handler fires and fails the test.
    let backendCalled = false;
    await page.route('https://api.web3forms.com/submit', async (route) => {
      backendCalled = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    await page.goto('/contact');

    await page.locator('input[name="value"]').fill('Тест Потребител');
    await page.locator('input[name="value1"]').fill('test@example.com');
    await page.locator('input[name="value2"]').fill('Тестова тема');
    await page.locator('textarea[name="message"]').fill('Тестово съобщение от e2e.');

    await page.getByTestId('contact-submit').click();

    // All fields valid but no hCaptcha token → 'missing-captcha', no network call.
    // (The full success path — real token + backend 200 → success message — is
    // left to a unit test of sendEmail(), where the private hcaptchaToken can
    // be set directly.)
    await expect(page.locator('.form-status--error')).toContainText(/не сте робот/i);
    expect(backendCalled, 'backend must not be called without captcha').toBe(false);
  });

  test('prefills subject + message when arriving from a product order', async ({ page }) => {
    // orderProduct() on the products page navigates with router state; the
    // contact component reads it into the subject (value2) and message fields.
    await page.goto('/products');
    await page.getByTestId('product-order-btn').first().click();

    await expect(page).toHaveURL(/\/contact\/?$/);
    await expect(page.locator('input[name="value2"]')).toHaveValue(/Поръчка за/i);
    await expect(page.locator('textarea[name="message"]')).toHaveValue(/искам да поръчам/i);
  });
});
