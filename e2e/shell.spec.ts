import { test, expect } from '@playwright/test';

/**
 * App-shell chrome: theme toggle, navigation drawer, and external links —
 * behaviour that lives in app.component and is shared across every page.
 */
test.describe('theme toggle', () => {
  test('toggles the theme class on <html> and persists it', async ({ page }) => {
    await page.goto('/');
    const html = page.locator('html');

    // Determine the current theme, flip it, and assert the class swapped.
    const wasDark = await html.evaluate((el) => el.classList.contains('dark-theme'));
    await page.getByTestId('theme-toggle').click();

    if (wasDark) {
      await expect(html).toHaveClass(/light-theme/);
      await expect(html).not.toHaveClass(/dark-theme/);
    } else {
      await expect(html).toHaveClass(/dark-theme/);
      await expect(html).not.toHaveClass(/light-theme/);
    }

    // Preference is written to localStorage...
    const stored = await page.evaluate(() => localStorage.getItem('theme'));
    expect(stored).toBe(wasDark ? 'light' : 'dark');

    // ...and survives a reload.
    await page.reload();
    await expect(html).toHaveClass(wasDark ? /light-theme/ : /dark-theme/);
  });
});

test.describe('navigation drawer (mobile)', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('drawer chips navigate on a mobile viewport', async ({ page }) => {
    await page.goto('/');

    // On mobile (<=1023px) the drawer is an overlay ON TOP of the page, so it
    // starts CLOSED — otherwise it would cover the content on load. Open it via
    // the hamburger before reaching for a chip.
    const trigger = page.getByTestId('menu-trigger');
    await expect(trigger).toBeVisible();
    await trigger.click();

    const pricesChip = page.locator('a.drawer_chip[href="/prices/"]');
    await expect(pricesChip).toBeInViewport();
    await pricesChip.click();

    await expect(page).toHaveURL(/\/prices\/?$/);
  });

  // The mobile counterpart of the desktop test in smoke.spec.ts: here the
  // drawer covers the content, so a tap outside it means "dismiss". Ignite
  // renders a full-bleed .igx-nav-drawer__overlay that is the click target for
  // every such tap, but it does not close the drawer on its own —
  // AppComponent.onDocumentClick does.
  test('drawer closes on an outside tap', async ({ page }) => {
    await page.goto('/');

    const aside = page.locator('.igx-nav-drawer__aside');
    // Off-screen drawers keep their width but sit at a negative x, so compare
    // the right edge rather than the width.
    const rightEdge = async () => (await aside.boundingBox())?.x ?? -999;

    await page.getByTestId('menu-trigger').click();
    await expect.poll(rightEdge).toBeGreaterThanOrEqual(0);

    // Tap the page well clear of the 232px-wide drawer.
    await page.mouse.click(370, 700);
    await expect.poll(rightEdge).toBeLessThan(0);
  });
});

test.describe('external links', () => {
  test('social + contact links have correct hrefs and safe rel', async ({ page }) => {
    await page.goto('/');

    const instagram = page.locator('a[href*="instagram.com/3dpechat.bg"]').first();
    const tiktok = page.locator('a[href*="tiktok.com/@3dpechat.bg"]').first();

    await expect(instagram).toHaveAttribute('target', '_blank');
    await expect(instagram).toHaveAttribute('rel', /noopener/);
    await expect(tiktok).toHaveAttribute('rel', /noopener/);

    // YouTube handle has no dot (@3dpechatbg) — unlike Instagram/TikTok.
    const youtube = page.locator('a[href="https://www.youtube.com/@3dpechatbg"]');
    await expect(youtube).toHaveCount(2); // navbar + footer
    await expect(youtube.first()).toHaveAttribute('target', '_blank');
    await expect(youtube.first()).toHaveAttribute('rel', /noopener/);

    // Footer contact links.
    await expect(page.locator('a[href="mailto:3dpechat.bg@gmail.com"]').first()).toBeVisible();
    await expect(page.locator('a[href^="viber:"]').first()).toBeVisible();
  });

  test('contact page exposes email and viber actions', async ({ page }) => {
    await page.goto('/contact');
    await expect(page.locator('a[href="mailto:3dpechat.bg@gmail.com"]').first()).toBeVisible();
    // Viber/Instagram/TikTok are opened via JS handlers (buttons), so assert
    // the buttons are present rather than href navigation.
    await expect(page.getByRole('button', { name: /Viber/i })).toBeVisible();
    await expect(page.getByTestId('youtube-contact-button')).toBeVisible();
  });
});

/**
 * Language switcher (approved design „A“, src/app/shared/language-switcher):
 * the navbar pill opens an Ignite drop-down; choosing a language opens the
 * same page in it. The footer carries plain, crawlable links to the same.
 */
test.describe('language switcher', () => {
  test('opens the same page in English and back in Bulgarian', async ({ page }) => {
    await page.goto('/prices/', { waitUntil: 'networkidle' });

    await page.getByTestId('language-switcher').click();
    await page.getByTestId('language-option-en').click();
    await expect(page).toHaveURL(/\/en\/prices\/?$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/3D printing prices/);
    await expect(page.locator('.menu-trigger-label')).toHaveText('Menu');
    await expect(page.getByTestId('language-switcher')).toHaveAttribute('aria-label', /^Language: English/);

    await page.getByTestId('language-switcher').click();
    await page.getByTestId('language-option-bg').click();
    await expect(page).toHaveURL(/\/prices\/?$/);
    await expect(page).not.toHaveURL(/\/en\//);
    await expect(page.locator('html')).toHaveAttribute('lang', 'bg');
    await expect(page.locator('.menu-trigger-label')).toHaveText('Меню');
  });

  test('works from the keyboard', async ({ page }) => {
    await page.goto('/contact/', { waitUntil: 'networkidle' });
    const trigger = page.getByTestId('language-switcher');
    await trigger.focus();
    await page.keyboard.press('Enter');
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    // Bulgarian (current) → English is the next option.
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/en\/contact\/?$/);
    // The English page itself, not the 404 (a URL check alone can't tell).
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Contact – custom 3D printing in Sofia/);
  });

  test('leads from a Bulgarian-only blog post to the English home page', async ({ page }) => {
    await page.goto('/blog/what-is-3d-printing/', { waitUntil: 'networkidle' });
    await page.getByTestId('language-switcher').click();
    await page.getByTestId('language-option-en').click();
    await expect(page).toHaveURL(/\/en\/?$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Professional custom 3D printing/);
  });

  test('the footer links the same page in the other language', async ({ page }) => {
    await page.goto('/products/');
    await expect(page.getByTestId('footer-language-en')).toHaveAttribute('href', '/en/products/');
    await page.goto('/en/products/');
    await expect(page.getByTestId('footer-language-bg')).toHaveAttribute('href', '/products/');
  });

  // Common phone widths down to the 320px floor: every navbar control stays
  // fully on screen (igx-navbar clips overflow, so an overhang would hide it).
  for (const width of [320, 360, 375, 390]) {
    test(`fits the phone navbar at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 740 });
      await page.goto('/', { waitUntil: 'networkidle' });
      const controls = {
        menu: page.getByTestId('menu-trigger'),
        cta: page.locator('a.nav_cta_button'),
        language: page.getByTestId('language-switcher'),
        theme: page.getByTestId('theme-toggle'),
      };
      for (const [name, control] of Object.entries(controls)) {
        const box = await control.boundingBox();
        expect(box, `${name} rendered`).not.toBeNull();
        expect(box!.x, `${name} left edge`).toBeGreaterThanOrEqual(0);
        expect(box!.x + box!.width, `${name} right edge`).toBeLessThanOrEqual(width);
      }
    });
  }
});
