import { defineConfig, devices } from '@playwright/test';

/**
 * E2E config. Tests run against the *built, prerendered* output
 * (outputMode: "static" in angular.json) served by http-server — this is the
 * static HTML that real users and Googlebot receive, so the smoke suite
 * verifies the SSR output, not just a dev-server render.
 *
 * Set PW_BASE_URL to point at an already-running server and skip the build
 * (e.g. PW_BASE_URL=http://localhost:4200 against `ng serve`).
 */
const PORT = 8080;
const baseURL = process.env.PW_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never' }], ['list']],

  use: {
    baseURL,
    trace: 'on-first-retry',
    // Deterministic screenshots later (step 2): kill animations up front.
    reducedMotion: 'reduce',
  },

  // Consistent snapshot naming across OSes: without this, Playwright appends
  // the platform (…-win32.png) so CI-Linux baselines wouldn't match. We commit
  // Linux baselines and pin the name; visual tests only run in CI (see below).
  snapshotPathTemplate: '{testDir}/__screenshots__/{arg}{ext}',

  projects: [
    {
      // Everything except visual regression — the suite that runs on every PR.
      name: 'functional',
      testIgnore: /visual\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      // Visual regression only. Baselines are platform-specific (Linux/CI), so
      // this project is run via `npm run e2e:visual` in a dedicated CI job.
      name: 'visual',
      testMatch: /visual\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Build the static site and serve it. Skipped when PW_BASE_URL is set.
  webServer: process.env.PW_BASE_URL
    ? undefined
    : {
        command:
          'npm run build && npx http-server dist/dprinting-services-website/browser -p ' +
          PORT +
          ' -s',
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 300_000,
      },
});
