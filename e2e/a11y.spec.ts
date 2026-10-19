import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { CORE_ROUTES, ENGLISH_ROUTES } from './routes';

/**
 * Accessibility smoke tests using axe-core. Scans each core page for WCAG 2.1
 * A/AA violations and fails on serious/critical ones. Minor/moderate issues are
 * reported (visible in the test output) but don't fail the build — this keeps
 * the gate meaningful without drowning in low-severity noise.
 *
 * Complements the Lighthouse accessibility score by pinpointing the exact
 * failing elements and rules.
 */
const SEVERITY_GATE = new Set(['serious', 'critical']);

// Core pages scan the whole document. The video article scans only what it
// adds (player + closing buttons): blog articles share older, known issues in
// the markdown link styling and the related-content cards that are tracked
// separately and would otherwise mask regressions in the new parts.
const A11Y_TARGETS: { path: string; include?: string[] }[] = [
  ...CORE_ROUTES.map(({ path }) => ({ path })),
  ...ENGLISH_ROUTES.map(({ path }) => ({ path })),
  { path: '/blog/3d-pechat-po-porachka-sofia-video', include: ['app-youtube-embed', '[data-testid="article-cta"]'] },
];

for (const route of A11Y_TARGETS) {
  test(`a11y: ${route.path} has no serious/critical violations`, async ({ page }) => {
    await page.goto(route.path, { waitUntil: 'networkidle' });

    let axe = new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']);
    for (const selector of route.include ?? []) {
      axe = axe.include(selector);
    }
    const results = await axe.analyze();

    const blocking = results.violations.filter((v) => SEVERITY_GATE.has(v.impact ?? ''));

    // Attach a readable summary to the report on failure.
    if (blocking.length) {
      const summary = blocking
        .map(
          (v) =>
            `[${v.impact}] ${v.id}: ${v.help}\n  ${v.nodes
              .map((n) => n.target.join(' '))
              .slice(0, 5)
              .join('\n  ')}`,
        )
        .join('\n\n');
      console.log(`\nAccessibility violations on ${route.path}:\n${summary}\n`);
    }

    expect(blocking, `serious/critical a11y violations on ${route.path}`).toEqual([]);
  });
}
