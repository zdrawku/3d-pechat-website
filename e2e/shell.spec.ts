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

    const pricesChip = page.locator('a.drawer_chip[href="/prices"]');
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
