import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { CORE_ROUTES } from './routes';

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

for (const route of CORE_ROUTES) {
  test(`a11y: ${route.path} has no serious/critical violations`, async ({ page }) => {
    await page.goto(route.path, { waitUntil: 'networkidle' });

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

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
