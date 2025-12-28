// ABOUTME: E2E tests for mobile gallery item click/tap interactions - Issue #257
import { test, expect } from '@playwright/test'
import { setupTestPage } from './helpers/test-setup'

test.describe('Mobile Gallery Item Clicks - Issue #257', () => {
  test.beforeEach(async ({ page }) => {
    await setupTestPage(page)
    // Set mobile viewport (iPhone SE size)
    await page.setViewportSize({ width: 375, height: 667 })
  })

  test('user can click on first mobile gallery item to open project', async ({ page }) => {
    // Arrange: Navigate to homepage with mobile viewport
    await page.goto('/')

    // Wait for gallery to be fully loaded and hydrated
    await page.waitForSelector('[data-testid="mobile-gallery"]', {
      state: 'visible',
      timeout: 10000
    })

    // Wait for gallery skeleton to disappear (ensures hydration complete)
    try {
      await page.waitForSelector('[data-testid="gallery-loading-skeleton"]', {
        state: 'detached',
        timeout: 5000
      })
    } catch {
      // Skeleton might not exist if gallery loads very quickly
    }

    // CRITICAL: Wait for FirstImage to fade out completely
    // Issue #257: FirstImage overlay was blocking clicks with z-index: 20
    await page.waitForTimeout(3000) // 2s animation + 1s buffer

    // Get the first gallery item
    const firstItem = page.locator('[data-testid="gallery-item-0"]')
    await firstItem.waitFor({ state: 'visible' })

    // Verify the item is actually clickable (not blocked by overlay)
    await expect(firstItem).toBeVisible()

    // Get initial URL to verify navigation
    const initialUrl = page.url()

    // Act: Click on the first gallery item
    await firstItem.click()

    // Assert: Should navigate to project page
    await page.waitForURL('/project/*', { timeout: 5000 })

    const newUrl = page.url()
    expect(newUrl).not.toBe(initialUrl)
    expect(newUrl).toContain('/project/')
  })

  test('user can tap on second mobile gallery item to open project', async ({ page }) => {
    // Arrange: Navigate to homepage
    await page.goto('/')

    // Wait for mobile gallery
    await page.waitForSelector('[data-testid="mobile-gallery"]', {
      state: 'visible'
    })

    // Wait for hydration complete
    await page.waitForTimeout(3000)

    // Scroll to second item to ensure it's in viewport
    const secondItem = page.locator('[data-testid="gallery-item-1"]')
    await secondItem.scrollIntoViewIfNeeded()
    await secondItem.waitFor({ state: 'visible' })

    // Get initial URL
    const initialUrl = page.url()

    // Act: Tap on second gallery item
    await secondItem.tap()

    // Assert: Should navigate to different project page
    await page.waitForURL('/project/*', { timeout: 5000 })

    const newUrl = page.url()
    expect(newUrl).not.toBe(initialUrl)
    expect(newUrl).toContain('/project/')
  })

  test('FirstImage overlay does not block mobile gallery interactions', async ({ page }) => {
    // Arrange: Navigate to homepage
    await page.goto('/')

    // Wait for FirstImage to be present
    const firstImage = page.locator('[data-first-image="true"]')

    // Check if FirstImage exists (it should for LCP optimization)
    const firstImageExists = await firstImage.count() > 0

    if (firstImageExists) {
      // Wait for mobile gallery to appear
      await page.waitForSelector('[data-testid="mobile-gallery"]', {
        state: 'visible'
      })

      // Critical: FirstImage should have pointer-events: none on mobile
      const pointerEvents = await firstImage.evaluate((el) =>
        window.getComputedStyle(el).pointerEvents
      )
      expect(pointerEvents).toBe('none')

      // FirstImage should fade out via animation
      // After 3 seconds, it should be hidden
      await page.waitForTimeout(3000)

      // Check if FirstImage is hidden (opacity: 0 or visibility: hidden)
      const isVisible = await firstImage.evaluate((el) => {
        const style = window.getComputedStyle(el)
        return style.opacity !== '0' && style.visibility !== 'hidden'
      })

      expect(isVisible).toBe(false)
    }

    // Gallery items should be clickable
    const firstItem = page.locator('[data-testid="gallery-item-0"]')
    await expect(firstItem).toBeVisible()

    // Should be able to click through to project
    await firstItem.click()
    await page.waitForURL('/project/*', { timeout: 5000 })
  })

  test('mobile gallery items have adequate touch targets', async ({ page }) => {
    // Arrange
    await page.goto('/')
    await page.waitForSelector('[data-testid="mobile-gallery"]')
    await page.waitForTimeout(3000) // Wait for FirstImage fade

    // Get first gallery item
    const firstItem = page.locator('[data-testid="gallery-item-0"]')
    await firstItem.waitFor({ state: 'visible' })

    // Get bounding box
    const box = await firstItem.boundingBox()

    // Assert: WCAG 2.1 requires minimum 44x44px touch targets
    expect(box).not.toBeNull()
    if (box) {
      expect(box.width).toBeGreaterThanOrEqual(44)
      expect(box.height).toBeGreaterThanOrEqual(44)
    }
  })

  test('clicking gallery items works on various mobile viewports', async ({ page }) => {
    // Test multiple common mobile viewport sizes
    const viewports = [
      { width: 375, height: 667, name: 'iPhone SE' },
      { width: 390, height: 844, name: 'iPhone 12' },
      { width: 360, height: 640, name: 'Android Small' },
    ]

    for (const viewport of viewports) {
      // Set viewport
      await page.setViewportSize({ width: viewport.width, height: viewport.height })

      // Navigate
      await page.goto('/')
      await page.waitForSelector('[data-testid="mobile-gallery"]')
      await page.waitForTimeout(3000)

      // Try clicking first item
      const firstItem = page.locator('[data-testid="gallery-item-0"]')
      await firstItem.waitFor({ state: 'visible' })

      const initialUrl = page.url()
      await firstItem.click()

      // Should navigate
      await page.waitForURL('/project/*', { timeout: 5000 })
      expect(page.url()).not.toBe(initialUrl)

      // Go back for next iteration
      await page.goBack()
      await page.waitForLoadState('networkidle')
    }
  })
})
