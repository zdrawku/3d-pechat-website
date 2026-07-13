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

  projects: [
    {
      name: 'chromium',
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
