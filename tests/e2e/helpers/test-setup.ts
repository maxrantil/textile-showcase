// ABOUTME: Global E2E test setup utilities for Playwright tests
// Provides standardized page setup with mocked external dependencies

import { Page } from '@playwright/test'
import { mockAnalyticsRequests } from './analytics-mock'

/**
 * Standard test setup applied to all E2E tests
 * Mocks external dependencies for test isolation and reliability
 *
 * Benefits:
 * - Eliminates external network dependencies (faster, more reliable)
 * - Prevents Safari/WebKit TLS handshake issues on Ubuntu CI (Issue #209)
 * - Makes tests deterministic (no flaky network failures)
 * - Reduces CI execution time
 *
 * @param page - Playwright Page object
 */
export async function setupTestPage(page: Page): Promise<void> {
  // Mock analytics to prevent external network dependencies
  // This solves Safari/WebKit TLS handshake failures on Ubuntu GitHub Actions
  await mockAnalyticsRequests(page)

  // Future: Add other global mocks here (external fonts, third-party APIs, etc.)
}
