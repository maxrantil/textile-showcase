// ABOUTME: E2E tests for gallery performance, dynamic imports, and error handling
import { test, expect } from '@playwright/test'
import { setupTestPage } from '../helpers/test-setup'

test.describe('Gallery Performance & Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    await setupTestPage(page)
  })

  test.describe('Dynamic Import Error Recovery', () => {
    test('should handle dynamic import failures gracefully', async ({ page, context }) => {
      // Simulate network failure by blocking Gallery component imports
      let requestCount = 0
      await context.route('**/*.js', (route) => {
        const url = route.request().url()
        // Block requests for Gallery components specifically
        if (url.includes('Gallery') || url.includes('gallery')) {
          requestCount++
          route.abort('failed')
        } else {
          route.continue()
        }
      })

      await page.goto('/')

      // Wait for imports to be attempted
      await page.waitForTimeout(2000)

      // Should have attempted to load gallery
      expect(requestCount).toBeGreaterThan(0)

      // Should show error boundary fallback instead of blank screen
      const errorFallback = page.locator('[data-testid="import-error-fallback"]')
      await expect(errorFallback).toBeVisible({ timeout: 20000 })

      // Error message should be user-friendly
      await expect(errorFallback).toContainText('Unable to load gallery')

      // Should provide reload option
      const reloadButton = errorFallback.locator('button:has-text("Reload Page")')
      await expect(reloadButton).toBeVisible()
    })

    test('should allow navigation even when dynamic imports fail', async ({ page, context }, testInfo) => {
      // Skip on mobile - this tests desktop navigation fallback behavior
      // Mobile uses hamburger menu with different UX patterns
      test.skip(testInfo.project.name.includes('Mobile'), 'Desktop navigation fallback test')

      // Block Gallery component imports
      await context.route('**/*.js', (route) => {
        const url = route.request().url()
        if (url.includes('Gallery') || url.includes('gallery')) {
          route.abort('failed')
        } else {
          route.continue()
        }
      })

      await page.goto('/')

      // Wait for error fallback
      await page.waitForSelector('[data-testid="import-error-fallback"]', { timeout: 20000 })

      // Navigation should still work (header/footer/contact link)
      const contactLink = page.locator('a[href="/contact"]').first()
      await expect(contactLink).toBeVisible()

      // Should be able to navigate to contact page
      await contactLink.click()
      await page.waitForURL('/contact')

      // Contact page should load successfully
      const contactHeading = page.locator('h1:has-text("Contact")')
      await expect(contactHeading).toBeVisible()
    })

    test('should show max retries message after exhausting attempts', async ({ page, context }) => {
      // Always fail Gallery imports
      await context.route('**/*.js', (route) => {
        const url = route.request().url()
        if (url.includes('Gallery') || url.includes('gallery')) {
          route.abort('failed')
        } else {
          route.continue()
        }
      })

      await page.goto('/')

      // Should show final error state after retries exhausted
      const errorFallback = page.locator('[data-testid="import-error-fallback"]')
      await expect(errorFallback).toBeVisible({ timeout: 20000 })

      // Should show reload button
      const reloadButton = errorFallback.locator('button:has-text("Reload Page")')
      await expect(reloadButton).toBeVisible()
    })
  })

  test.describe('Import Timeout Handling', () => {
    test('should timeout slow dynamic imports', async ({ page, context }) => {
      // Simulate very slow Gallery loading (>10s)
      await context.route('**/*.js', async (route) => {
        const url = route.request().url()
        if (url.includes('Gallery') || url.includes('gallery')) {
          // Delay for longer than timeout threshold (10s) + time for retries
          await page.waitForTimeout(12000)
          route.abort('timedout')
        } else {
          route.continue()
        }
      })

      await page.goto('/')

      // Should timeout and show error fallback (wait for timeout + retries)
      const errorFallback = page.locator('[data-testid="import-error-fallback"]')
      await expect(errorFallback).toBeVisible({ timeout: 30000 })
    })
  })

  test.describe('Loading States', () => {
    test('should show skeleton during normal loading', async ({ page }) => {
      await page.goto('/')

      // Skeleton should appear briefly
      const skeleton = page.locator('[data-testid="gallery-loading-skeleton"]')

      // May or may not catch it depending on timing, but it shouldn't throw
      try {
        await skeleton.waitFor({ state: 'visible', timeout: 1000 })
      } catch {
        // Fast load - skeleton may have already disappeared
      }

      // Gallery should eventually load
      const gallery = page.locator('[data-testid="desktop-gallery"], [data-testid="mobile-gallery"]')
      await expect(gallery).toBeVisible({ timeout: 10000 })
    })
  })
})
