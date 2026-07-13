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

    // The drawer is [isOpen]="true"; on mobile (<=1023px) it renders as an
    // overlay that sits above the page (see app.component.scss). The hamburger
    // (menu-trigger) is present for toggling, but the chips are the navigation
    // path we care about — assert one routes correctly.
    await expect(page.getByTestId('menu-trigger')).toBeVisible();

    const pricesChip = page.locator('a.drawer_chip[href="/prices"]');
    await expect(pricesChip).toBeVisible();
    await pricesChip.click();

    await expect(page).toHaveURL(/\/prices\/?$/);
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
  });
});
