// ABOUTME: Playwright E2E testing configuration for textile portfolio with comprehensive device and browser coverage
import { defineConfig, devices } from '@playwright/test'

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests/e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/e2e-results.json' }],
    ...(process.env.CI ? [['github']] : []),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ] as any,
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
    /* Video recording for debugging */
    video: 'retain-on-failure',
  },

  /* Configure projects for major browsers and devices */
  projects: [
    // Desktop browsers
    {
      name: 'Desktop Chrome',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
    },
    {
      name: 'Desktop Firefox',
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 },
      },
    },
    {
      name: 'Desktop Safari',
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1920, height: 1080 },
      },
    },
    // Safari Smoke Tests - Ultra-minimal subset for CI (~5-7min target)
    // Issue #211: Safari E2E tests timeout at 40min (8x slower than Chrome)
    // PR #235 Discovery: Gallery loading takes >30s on Safari/WebKit (15/23 tests failed)
    // Root cause: Gallery dynamic import/hydration fails within timeout
    // Future: Issue #236 tracks long-term Safari gallery performance optimization
    //
    // Current Strategy: Ultra-minimal smoke tests (no gallery dependency)
    // - Only workflows/smoke-test.spec.ts (8 tests, all passed in PR #235)
    // - Basic app health validation (homepage, contact, navigation, JS errors)
    // - NO gallery tests (gallery loads too slowly on Safari/WebKit)
    //
    // Full Safari suite with gallery remains available for local testing
    {
      name: 'Safari Smoke',
      testMatch: ['**/workflows/smoke-test.spec.ts'],
      retries: process.env.CI ? 1 : 0, // Reduced retries for Safari (1 vs 2)
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1920, height: 1080 },
      },
    },

    // Mobile devices
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'], hasTouch: true },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 13'], hasTouch: true },
    },
    {
      name: 'Mobile Safari Landscape',
      use: {
        ...devices['iPhone 13 landscape'],
        hasTouch: true,
      },
    },

    // Tablet devices
    {
      name: 'iPad',
      use: { ...devices['iPad Pro'], hasTouch: true },
    },

    // Specific viewport testing for responsive design
    {
      name: 'Small Desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1366, height: 768 },
      },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
})
