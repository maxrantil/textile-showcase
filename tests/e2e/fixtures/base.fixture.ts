// ABOUTME: Base test fixture providing core page setup and common utilities for E2E tests
import { test as base } from '@playwright/test'

/**
 * Base fixture extending Playwright's default test
 * Provides common setup and utilities for all E2E tests
 */
export const test = base.extend({
  // Auto-navigate to homepage before each test
  page: async ({ page, baseURL }, use) => {
    // Navigate to base URL if not already there
    if (baseURL) {
      await page.goto(baseURL)
    }
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(page)
  },
})

export { expect } from '@playwright/test'
