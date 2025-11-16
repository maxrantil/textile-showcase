// ABOUTME: Playwright helper for mocking Umami analytics requests in E2E tests
// Prevents external network dependencies and Safari TLS handshake timeouts (Issue #209)

import { Page } from '@playwright/test'

export const ANALYTICS_URL = 'https://analytics.idaromme.dk'

/**
 * Mock analytics script.js response
 * Returns a minimal Umami-compatible script that doesn't make actual network requests
 */
export const MOCK_ANALYTICS_SCRIPT = `
// Mock Umami Analytics Script (E2E Test Version)
(function() {
  console.log('[MOCK] Umami analytics loaded');
  window.umami = {
    track: function(event, data) {
      console.log('[MOCK] Analytics event tracked:', event, data);
      return Promise.resolve();
    }
  };
})();
`

/**
 * Set up analytics request mocking for a Playwright page
 * Intercepts requests to analytics.idaromme.dk and returns mock responses
 *
 * @param page - Playwright Page object
 */
export async function mockAnalyticsRequests(page: Page): Promise<void> {
  // Mock the script.js file
  await page.route(`${ANALYTICS_URL}/script.js`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/javascript; charset=UTF-8',
      headers: {
        'cache-control': 'public, max-age=86400, must-revalidate',
        'access-control-allow-origin': '*',
      },
      body: MOCK_ANALYTICS_SCRIPT,
    })
  })

  // Mock any analytics tracking requests (collect endpoint)
  await page.route(`${ANALYTICS_URL}/api/collect`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    })
  })

  // Mock any other analytics API endpoints
  await page.route(`${ANALYTICS_URL}/api/**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    })
  })
}

/**
 * Clean up analytics mocking routes
 *
 * @param page - Playwright Page object
 */
export async function unmockAnalyticsRequests(page: Page): Promise<void> {
  await page.unroute(`${ANALYTICS_URL}/script.js`)
  await page.unroute(`${ANALYTICS_URL}/api/collect`)
  await page.unroute(`${ANALYTICS_URL}/api/**`)
}
