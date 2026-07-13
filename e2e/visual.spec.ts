import { test, expect } from '@playwright/test';
import { CORE_ROUTES } from './routes';

/**
 * Visual regression: full-page screenshots of each core page at three
 * viewports, diffed against committed baselines via toHaveScreenshot().
 *
 * IMPORTANT — baselines are platform-specific. Font rendering differs between
 * Windows/macOS/Linux, so baselines are generated on CI (Linux) and treated as
 * the source of truth (see .github/workflows/visual.yml). A local run on a
 * different OS will report diffs that are just antialiasing — that's expected;
 * don't commit local baselines. Update baselines via the CI workflow.
 *
 * Determinism: animations are disabled (config reducedMotion + the option
 * below), and dynamic regions (the home carousel, tooltips) are masked so they
 * don't cause false diffs.
 */
const VIEWPORTS = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
];

for (const route of CORE_ROUTES) {
  for (const vp of VIEWPORTS) {
    test(`visual: ${route.path} @ ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(route.path, { waitUntil: 'networkidle' });

      // Give lazy images / fonts a beat to settle before snapping.
      await page.waitForLoadState('networkidle');
      await page.evaluate(() => document.fonts?.ready);

      const slug = route.path === '/' ? 'home' : route.path.replace(/\//g, '-').replace(/^-/, '');
      await expect(page).toHaveScreenshot(`${slug}-${vp.name}.png`, {
        fullPage: true,
        animations: 'disabled',
        // Mask regions that change between runs (carousels, tooltips, ads).
        mask: [page.locator('igx-carousel'), page.locator('[igxtooltip]')],
        // Small per-pixel tolerance to absorb sub-pixel AA differences.
        maxDiffPixelRatio: 0.02,
      });
    });
  }
}
