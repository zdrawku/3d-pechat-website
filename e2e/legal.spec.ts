import { test, expect, Page } from '@playwright/test';

/**
 * The Privacy Policy and Terms of Use (approved design „B“) on the built site:
 * the summary card and contents, anchors that land below the fixed navbar,
 * the links into them, and no clipped text on a phone.
 */
const LEGAL_PAGES = ['/privacy/', '/terms/', '/en/privacy/', '/en/terms/'];

/** How far the element's top sits below the navbar's bottom (negative = hidden under it). */
async function gapBelowNavbar(page: Page, selector: string): Promise<number> {
  return page.evaluate((sel) => {
    const navbar = document.querySelector('igx-navbar')!.getBoundingClientRect().bottom;
    return document.querySelector(sel)!.getBoundingClientRect().top - navbar;
  }, selector);
}

for (const path of LEGAL_PAGES) {
  test(`${path} shows the summary, the contents and the operator`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByTestId('legal-summary')).toBeVisible();
    await expect(page.getByTestId('legal-contents').locator('a').first()).toBeVisible();
    await expect(page.locator('main')).toContainText(path.startsWith('/en/') ? 'Zdravko Kolev' : 'Здравко Колев');
    await expect(page.getByTestId('legal-updated')).toContainText('2026');
  });
}

test('a contents link scrolls its section into view below the navbar', async ({ page }) => {
  await page.goto('/privacy/');
  await page.getByTestId('legal-contents').locator('a[href$="#rights"]').click();
  await expect(page).toHaveURL(/\/privacy\/#rights$/);
  await expect.poll(() => gapBelowNavbar(page, '#rights')).toBeGreaterThanOrEqual(0);
});

test('opening /privacy/#cookies directly lands on the section, below the navbar', async ({ page }) => {
  await page.goto('/privacy/#cookies');
  await expect.poll(() => gapBelowNavbar(page, '#cookies')).toBeGreaterThanOrEqual(0);
  await expect.poll(() => gapBelowNavbar(page, '#cookies')).toBeLessThan(120);
});

test('the footer links both documents in the page language', async ({ page }) => {
  await page.goto('/en/');
  await page.getByTestId('footer-terms').click();
  await expect(page).toHaveURL(/\/en\/terms\/$/);
  await expect(page.locator('h1')).toHaveText('Terms of Use');
});

test('the contact form links the Privacy Policy under its send button', async ({ page }) => {
  await page.goto('/contact/');
  await page.getByTestId('contact-privacy-note').getByRole('link').click();
  await expect(page).toHaveURL(/\/privacy\/$/);
});

test.describe('on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  for (const path of LEGAL_PAGES) {
    test(`${path} fits the screen: tables scroll in their own box, nothing is cut off`, async ({ page }) => {
      await page.goto(path);
      const overflow = await page.evaluate(() => {
        const main = document.querySelector('main')!;
        return { page: document.documentElement.scrollWidth - document.documentElement.clientWidth, main: main.scrollWidth - main.clientWidth };
      });
      expect(overflow).toEqual({ page: 0, main: 0 });
    });
  }
});
