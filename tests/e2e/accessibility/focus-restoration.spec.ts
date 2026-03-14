// ABOUTME: E2E tests for gallery focus restoration when navigating back from project pages

import { test, expect, Page } from '@playwright/test'
import { setupTestPage } from '../helpers/test-setup'

// Helper function: Get gallery selector based on viewport size
// Mobile (<768px) uses mobile-gallery, Desktop (>=768px) uses desktop-gallery
// Both galleries are in the SSR HTML simultaneously; CSS media queries control visibility
async function getGallerySelector(page: Page): Promise<string> {
  const viewport = page.viewportSize()
  if (!viewport) {
    throw new Error('Viewport size not set')
  }
  return viewport.width < 768
    ? '[data-testid="mobile-gallery"]'
    : '[data-testid="desktop-gallery"]'
}

test.describe('Gallery Focus Restoration - WCAG 2.4.3', () => {
  test.beforeEach(async ({ page }) => {
    await setupTestPage(page)
  })

  test('focus restored when returning to gallery via back navigation', async ({ page }, testInfo) => {
    // Focus restoration now implemented for both Desktop and Mobile galleries
    // Navigate to homepage
    await page.goto('/')

    // Wait for the visible gallery (viewport-aware: avoids hidden gallery timeout)
    const gallerySelector = await getGallerySelector(page)
    await page.waitForSelector(gallerySelector, {
      state: 'visible',
      timeout: 10000
    })

    // Wait for gallery to fully load (skeleton to disappear)
    await page.waitForSelector('[data-testid="gallery-loading-skeleton"]', { state: 'detached', timeout: 10000 })

    // Click on item 3 (index 2) — scoped to visible gallery to avoid strict mode violation
    const item3 = page.locator(`${gallerySelector} [data-testid="gallery-item-2"]`)
    await item3.click()

    // Wait for navigation to project page
    await page.waitForURL(/\/project\/.+/, { timeout: 10000 })

    // Return to gallery using browser back
    await page.goBack()

    // Wait for navigation back to homepage
    await page.waitForURL('/', { timeout: 10000 })

    // Wait for gallery to fully re-render (important for focus restoration to complete)
    await page.waitForSelector(gallerySelector, {
      state: 'visible',
      timeout: 10000
    })

    // Wait for gallery item to be interactive (CI environments can be slow)
    await item3.waitFor({ state: 'visible', timeout: 10000 })

    // Give focus restoration logic time to complete after gallery renders
    // Increased timeout for CI environments which can be significantly slower
    await page.waitForTimeout(1500)

    // Verify focus restored to item 3 (index 2)
    // This is the key assertion - focus should be restored to the same gallery item
    // Use longer timeout for CI environments
    await expect(item3).toBeFocused({ timeout: 10000 })
  })

  test('focus restoration works consistently across multiple navigations', async ({ page }, testInfo) => {
    // Focus restoration now implemented for both Desktop and Mobile galleries
    // Navigate to homepage
    await page.goto('/')

    // Wait for the visible gallery (viewport-aware: avoids hidden gallery timeout)
    const gallerySelector = await getGallerySelector(page)
    await page.waitForSelector(gallerySelector, {
      state: 'visible',
      timeout: 10000
    })

    // Wait for gallery to fully load (skeleton to disappear)
    await page.waitForSelector('[data-testid="gallery-loading-skeleton"]', { state: 'detached', timeout: 10000 })

    // Click on item 4 (index 3) — scoped to visible gallery to avoid strict mode violation
    const item4 = page.locator(`${gallerySelector} [data-testid="gallery-item-3"]`)
    await item4.click()

    // Wait for navigation to project page
    await page.waitForURL(/\/project\/.+/, { timeout: 10000 })

    // Return to gallery using browser back
    await page.goBack()

    // Wait for navigation back to homepage
    await page.waitForURL('/', { timeout: 10000 })

    // Wait for gallery to fully re-render (important for focus restoration to complete)
    await page.waitForSelector(gallerySelector, {
      state: 'visible',
      timeout: 10000
    })

    // Wait for gallery item to be interactive (CI environments can be slow)
    await item4.waitFor({ state: 'visible', timeout: 10000 })

    // Give focus restoration logic time to complete after gallery renders
    // Increased timeout for CI environments which can be significantly slower
    await page.waitForTimeout(1500)

    // Verify focus restored to item 4 (index 3)
    // Use longer timeout for CI environments
    await expect(item4).toBeFocused({ timeout: 10000 })
  })

  test('focus restoration does not interfere with scroll restoration', async ({ page }, testInfo) => {
    // Focus restoration now implemented for both Desktop and Mobile galleries
    // Navigate to homepage
    await page.goto('/')

    // Wait for the visible gallery (viewport-aware: avoids hidden gallery timeout)
    const gallerySelector = await getGallerySelector(page)
    await page.waitForSelector(gallerySelector, {
      state: 'visible',
      timeout: 10000
    })

    // Wait for gallery to fully load (skeleton to disappear)
    await page.waitForSelector('[data-testid="gallery-loading-skeleton"]', { state: 'detached', timeout: 10000 })

    // Click on item 5 (index 4) which might require scrolling
    // Scoped to visible gallery to avoid strict mode violation
    const item5 = page.locator(`${gallerySelector} [data-testid="gallery-item-4"]`)
    await item5.scrollIntoViewIfNeeded()
    await item5.click()

    // Wait for navigation to project page
    await page.waitForURL(/\/project\/.+/, { timeout: 10000 })

    // Return to gallery
    await page.goBack()
    await page.waitForURL('/', { timeout: 10000 })

    // Wait for gallery to fully re-render (important for focus restoration to complete)
    await page.waitForSelector(gallerySelector, {
      state: 'visible',
      timeout: 10000
    })

    // Wait for gallery item to be interactive (CI environments can be slow)
    await item5.waitFor({ state: 'visible', timeout: 10000 })

    // Give focus restoration logic time to complete after gallery renders
    // Increased timeout for CI environments which can be significantly slower
    await page.waitForTimeout(1500)

    // Verify focus is restored
    // Use longer timeout for CI environments
    await expect(item5).toBeFocused({ timeout: 10000 })

    // Verify the item is still visible (scroll restoration worked)
    await expect(item5).toBeVisible()
  })

  test('focus restoration clears sessionStorage after restoration', async ({ page }, testInfo) => {
    // Focus restoration now implemented for both Desktop and Mobile galleries
    // Navigate to homepage
    await page.goto('/')

    // Wait for the visible gallery (viewport-aware: avoids hidden gallery timeout)
    const gallerySelector = await getGallerySelector(page)
    await page.waitForSelector(gallerySelector, {
      state: 'visible',
      timeout: 10000
    })

    // Wait for gallery to fully load (skeleton to disappear)
    await page.waitForSelector('[data-testid="gallery-loading-skeleton"]', { state: 'detached', timeout: 10000 })

    // Click on item 2 (index 1) — scoped to visible gallery to avoid strict mode violation
    const item2 = page.locator(`${gallerySelector} [data-testid="gallery-item-1"]`)
    await item2.click()

    // Wait for navigation to project page
    await page.waitForURL(/\/project\/.+/, { timeout: 10000 })

    // Verify sessionStorage has the focus index
    const savedIndexBeforeReturn = await page.evaluate(() =>
      sessionStorage.getItem('galleryFocusIndex')
    )
    expect(savedIndexBeforeReturn).toBe('1') // Index 1

    // Return to gallery
    await page.goBack()
    await page.waitForURL('/', { timeout: 10000 })

    // Wait for gallery to fully re-render (important for focus restoration to complete)
    await page.waitForSelector(gallerySelector, {
      state: 'visible',
      timeout: 10000
    })

    // Wait for gallery item to be interactive (CI environments can be slow)
    await item2.waitFor({ state: 'visible', timeout: 10000 })

    // Give focus restoration logic time to complete after gallery renders
    // Increased timeout for CI environments which can be significantly slower
    await page.waitForTimeout(1500)

    // Verify focus restored
    // Use longer timeout for CI environments
    await expect(item2).toBeFocused({ timeout: 10000 })

    // Verify sessionStorage is cleared after restoration
    const savedIndexAfterReturn = await page.evaluate(() =>
      sessionStorage.getItem('galleryFocusIndex')
    )
    expect(savedIndexAfterReturn).toBeNull()
  })
})
