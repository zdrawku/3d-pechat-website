import path from 'path';
import { test, expect } from '@playwright/test';

/**
 * The bookmark creator (/products/bookmarks) and the hidden Studio (/studio).
 *
 * Runs the real engine (`@printkit/bookmark-creator`, in its Web Worker), so a
 * preview takes about a second or two. The order is never sent: web3forms and
 * hCaptcha are not touched (that path is covered by the component's unit spec).
 */
const PICTURE = path.resolve(process.cwd(), 'src/assets/real-images/razdeliteli-za-knigi.webp');

test.describe('bookmark creator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/products/bookmarks');
    await page.getByTestId('bookmark-picture-input').waitFor({ state: 'attached' });
  });

  test('shows the three modes and starts in "your picture", with nothing to order yet', async ({ page }) => {
    await expect(page.locator('h1')).toHaveText('Разделители за книги');
    await expect(page.getByTestId('bookmark-modes').locator('igx-tab-header')).toHaveCount(3);
    await expect(page.getByTestId('bookmark-picture')).toBeVisible();
    await expect(page.getByTestId('bookmark-order-open')).toBeDisabled();
  });

  test('a picture gives colours, a live preview and an enabled Order button', async ({ page }) => {
    await page.getByTestId('bookmark-picture-input').setInputFiles(PICTURE);
    await expect(page.getByTestId('bookmark-picture-name')).toContainText('razdeliteli-za-knigi.webp');
    await expect(page.getByTestId('bookmark-preview')).toBeVisible();
    await expect(page.locator('igc-color-picker')).toHaveCount(4);
    await expect(page.getByTestId('bookmark-order-open')).toBeEnabled();
  });

  test('keeps the picture in the browser: nothing is posted anywhere', async ({ page }) => {
    const posts: string[] = [];
    page.on('request', (request) => {
      if (request.method() !== 'GET' && request.method() !== 'HEAD') {
        posts.push(`${request.method()} ${request.url()}`);
      }
    });
    await page.getByTestId('bookmark-picture-input').setInputFiles(PICTURE);
    await expect(page.getByTestId('bookmark-preview')).toBeVisible();
    expect(posts).toEqual([]);
    expect(await page.evaluate(() => localStorage.length + sessionStorage.length)).toBeLessThanOrEqual(1); // only the consent answer
  });

  test('switches between picture, pattern and set, keeping the shared controls', async ({ page }) => {
    // The name is optional: „Без“ until a place is chosen.
    await expect(page.getByTestId('bookmark-name-input')).toHaveCount(0);
    await page.getByTestId('bookmark-name-place').locator('button', { hasText: 'В средата' }).click();
    await page.getByTestId('bookmark-name-input').fill('Мария');

    await page.getByTestId('bookmark-mode-pattern').click();
    await expect(page.getByTestId('bookmark-pattern')).toBeVisible();
    await expect(page.getByTestId('bookmark-picture')).toHaveCount(0);
    await expect(page.getByTestId('bookmark-order-open')).toBeEnabled(); // a pattern needs no picture
    await expect(page.getByTestId('bookmark-name-input')).toHaveValue('Мария');

    await page.getByTestId('bookmark-mode-set').click();
    await expect(page.getByTestId('bookmark-set')).toBeVisible();
  });

  test('the Order button opens the form with the price and time notes, and asks for the missing fields', async ({ page }) => {
    await page.getByTestId('bookmark-mode-pattern').click();
    await page.getByTestId('bookmark-order-open').click();
    await expect(page.getByTestId('bookmark-order')).toBeVisible();
    await expect(page.getByTestId('bookmark-order-price-note')).toContainText('Ще потвърдим цената по имейл');
    await expect(page.getByTestId('bookmark-order-time-note')).toContainText('работни дни');

    await page.getByTestId('bookmark-order-submit').click();
    await expect(page.getByTestId('bookmark-order-status')).toContainText('Попълнете');
  });

  test('offers the customer no print files', async ({ page }) => {
    await page.getByTestId('bookmark-mode-pattern').click();
    await expect(page.getByTestId('bookmark-build')).toHaveCount(0);
    await expect(page.locator('a[download]')).toHaveCount(0);
  });

  test('is reachable from the Products menu group, which starts expanded', async ({ page }) => {
    await expect(page.getByTestId('drawer-products-toggle')).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByTestId('drawer-products-all')).toBeVisible();
    await expect(page.getByTestId('drawer-bookmarks')).toBeVisible();

    await page.getByTestId('drawer-products-toggle').click();
    await expect(page.getByTestId('drawer-bookmarks')).toHaveCount(0);
  });
});

const PICTURES = ['razdelitel', 'razdelitel-2', 'razdeliteli-za-knigi', 'razdeliteli-za-knigi-back']
  .map((name) => path.resolve(process.cwd(), `src/assets/real-images/${name}.webp`));

test.describe('bookmark creator: preview, positioning and sets of pictures', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/products/bookmarks', { waitUntil: 'networkidle' });
    await page.getByTestId('bookmark-picture-input').waitFor({ state: 'attached' });
  });

  const previewSrc = (page: import('@playwright/test').Page) => page.getByTestId('bookmark-preview').getAttribute('src');

  test('the preview follows the choices: another shape changes it', async ({ page }) => {
    await page.getByTestId('bookmark-picture-input').setInputFiles(PICTURES[0]);
    await expect(page.getByTestId('bookmark-preview')).toBeVisible();
    const before = await previewSrc(page);
    await page.getByTestId('bookmark-shape-ogee').click();
    await expect.poll(() => previewSrc(page)).not.toBe(before);
  });

  test('the name is optional: „Без“ until a place is chosen, then it shows on the bookmark', async ({ page }) => {
    await page.getByTestId('bookmark-picture-input').setInputFiles(PICTURES[0]);
    await expect(page.getByTestId('bookmark-name-input')).toHaveCount(0);
    const places = page.getByTestId('bookmark-name-place').locator('button');
    await expect(places).toHaveText(['Без', 'Горе', 'В средата', 'Долу']);
    const before = await previewSrc(page);
    await places.nth(2).click();
    await page.getByTestId('bookmark-name-input').fill('Мария');
    await expect.poll(() => previewSrc(page)).not.toBe(before);
  });

  test('dragging the picture in the editor moves it in the preview', async ({ page }) => {
    await page.getByTestId('bookmark-picture-input').setInputFiles(PICTURES[0]);
    const frame = page.getByTestId('bookmark-framer');
    await expect(frame).toBeVisible();
    await expect(page.getByTestId('bookmark-centre')).toBeDisabled();
    const before = await previewSrc(page);

    const box = (await frame.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 25, box.y + box.height / 2 + 30, { steps: 6 });
    await page.mouse.up();

    await expect(page.getByTestId('bookmark-centre')).toBeEnabled();
    await expect.poll(() => previewSrc(page)).not.toBe(before);

    await page.getByTestId('bookmark-centre').click(); // back to the middle
    await expect(page.getByTestId('bookmark-centre')).toBeDisabled();
    await expect.poll(() => previewSrc(page)).toBe(before);
  });

  test('a set of different pictures: up to four, all shown in the preview', async ({ page }) => {
    await page.getByTestId('bookmark-mode-set').click();
    await page.getByTestId('bookmark-set-kind').locator('button', { hasText: 'Различни снимки' }).click();
    const width = () => page.getByTestId('bookmark-preview').evaluate((img: HTMLImageElement) => img.naturalWidth);

    let one = 0;
    for (let i = 0; i < 4; i++) {
      const button = page.getByTestId(i === 0 ? 'bookmark-picture-button' : `bookmark-picture-button-${i}`);
      const [chooser] = await Promise.all([page.waitForEvent('filechooser'), button.click()]);
      await chooser.setFiles(PICTURES[i]);
      await expect(page.getByTestId(`bookmark-picture-slot-${i}`).getByTestId('bookmark-framer')).toBeVisible();
      if (i === 0) {
        await expect(page.getByTestId('bookmark-preview')).toBeVisible();
        one = await width();
      }
    }
    await expect(page.locator('[data-testid^="bookmark-picture-slot-"]')).toHaveCount(4); // no fifth row

    // The preview is one image of the four bookmarks side by side: more than three times as wide as one.
    await expect.poll(width, { timeout: 20_000 }).toBeGreaterThan(3 * one);
  });

  test('no choice label is clipped on a phone', async ({ page }) => {
    // Resize first and load again: the side menu is open or closed from the width at load time.
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/products/bookmarks', { waitUntil: 'networkidle' });
    await page.getByTestId('bookmark-picture-input').waitFor({ state: 'attached' });
    for (const mode of ['picture', 'pattern', 'set']) {
      await page.getByTestId(`bookmark-mode-${mode}`).evaluate((tab: HTMLElement) => tab.click());
      const clipped = await page.locator('igx-buttongroup button').evaluateAll((buttons) =>
        buttons.filter((button) => button.scrollWidth > button.clientWidth).map((button) => button.textContent!.trim()));
      expect(clipped, `clipped labels in the ${mode} tab`).toEqual([]);
    }
  });
});

test.describe('bookmark creator in English', () => {
  test('is a localized page with its own meta', async ({ page }) => {
    await page.goto('/en/products/bookmarks');
    await expect(page.locator('h1')).toHaveText('Bookmarks');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('link[rel="alternate"][hreflang="bg"]')).toHaveAttribute('href', 'https://3dpechat.bg/products/bookmarks/');
  });
});

test.describe('products page card', () => {
  test('links to the bookmark creator', async ({ page }) => {
    await page.goto('/products');
    await page.getByTestId('bookmarks-promo-link').click();
    await expect(page).toHaveURL(/\/products\/bookmarks\/?$/);
  });
});

test.describe('bookmark Studio (hidden)', () => {
  test('is a passphrase gate that search engines are told to skip', async ({ page }) => {
    await page.goto('/studio');
    await expect(page.getByTestId('studio-gate')).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
    await expect(page.getByTestId('bookmarks-page')).toHaveCount(0);
  });

  test('stays locked on a wrong passphrase', async ({ page }) => {
    // Wait for hydration: the password field is reset when Angular takes the page over.
    await page.goto('/studio', { waitUntil: 'networkidle' });
    await page.getByTestId('studio-passphrase').fill('definitely not it');
    await page.getByTestId('studio-unlock').click();
    await expect(page.getByTestId('studio-gate')).toContainText('Грешна парола');
    await expect(page.getByTestId('bookmarks-page')).toHaveCount(0);
  });

  test('is in no sitemap or llms.txt, and in no menu', async ({ page, request }) => {
    for (const file of ['/sitemap.xml', '/llms.txt']) {
      const response = await request.get(file);
      expect(await response.text(), file).not.toContain('/studio');
    }
    await page.goto('/');
    await expect(page.locator('a[href*="studio"]')).toHaveCount(0);
  });
});
