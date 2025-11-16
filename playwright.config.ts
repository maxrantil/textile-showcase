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
        // WebKit-specific adjustments for CI stability (Issue #209)
        // Safari/WebKit in CI has slower chunk loading for dynamic imports
        navigationTimeout: 60000, // 60s for page navigation (vs default 30s)
        actionTimeout: 30000, // 30s for user actions (vs default 0 = no timeout)
        // Slower expectations for networkidle state in WebKit
        launchOptions: {
          slowMo: 100, // Slow down actions for WebKit stability
        },
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
