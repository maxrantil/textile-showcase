// ABOUTME: Network mocking fixture for API response simulation and error testing
import { test as base, Page, Route } from '@playwright/test'

/**
 * Network mock configuration
 */
export interface NetworkMock {
  url: string | RegExp
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  status?: number
  body?: unknown
  delay?: number
}

/**
 * Network helper utilities for API mocking
 */
export interface NetworkHelpers {
  /**
   * Mock an API response
   */
  mockApi: (page: Page, mock: NetworkMock) => Promise<void>

  /**
   * Mock API to fail with network error
   */
  mockApiError: (page: Page, url: string | RegExp) => Promise<void>

  /**
   * Mock contact form submission success
   */
  mockContactSuccess: (page: Page) => Promise<void>

  /**
   * Mock contact form submission failure
   */
  mockContactError: (
    page: Page,
    status: number,
    message?: string
  ) => Promise<void>

  /**
   * Mock rate limit response
   */
  mockRateLimit: (page: Page) => Promise<void>

  /**
   * Clear all route mocks
   */
  clearMocks: (page: Page) => Promise<void>
}

/**
 * Network fixture with API mocking utilities
 */
export const test = base.extend<{ network: NetworkHelpers }>({
  network: async ({}, use) => {
    const helpers: NetworkHelpers = {
      async mockApi(page, mock) {
        await page.route(mock.url, async (route: Route) => {
          // Add delay if specified
          if (mock.delay) {
            await new Promise((resolve) => setTimeout(resolve, mock.delay))
          }

          // Check method if specified
          if (mock.method && route.request().method() !== mock.method) {
            await route.continue()
            return
          }

          await route.fulfill({
            status: mock.status || 200,
            contentType: 'application/json',
            body: JSON.stringify(mock.body || {}),
          })
        })
      },

      async mockApiError(page, url) {
        await page.route(url, async (route: Route) => {
          await route.abort('failed')
        })
      },

      async mockContactSuccess(page) {
        await page.route('**/api/contact', async (route: Route) => {
          if (route.request().method() === 'POST') {
            await route.fulfill({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify({
                message: 'Message sent successfully',
              }),
            })
          } else {
            await route.continue()
          }
        })
      },

      async mockContactError(page, status, message = 'An error occurred') {
        await page.route('**/api/contact', async (route: Route) => {
          if (route.request().method() === 'POST') {
            await route.fulfill({
              status,
              contentType: 'application/json',
              body: JSON.stringify({
                error: message,
              }),
            })
          } else {
            await route.continue()
          }
        })
      },

      async mockRateLimit(page) {
        await page.route('**/api/contact', async (route: Route) => {
          if (route.request().method() === 'POST') {
            await route.fulfill({
              status: 429,
              contentType: 'application/json',
              body: JSON.stringify({
                error: 'Too many requests. Please try again later.',
              }),
            })
          } else {
            await route.continue()
          }
        })
      },

      async clearMocks(page) {
        await page.unroute('**/*')
      },
    }

    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(helpers)
  },
})

export { expect } from '@playwright/test'
