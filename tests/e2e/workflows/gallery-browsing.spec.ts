// ABOUTME: Comprehensive E2E tests for gallery browsing workflows across devices and interaction methods
import { test, expect } from '@playwright/test'
import { GalleryPage } from '../utils/page-objects/gallery-page'

test.describe('Gallery Browsing Complete Workflows', () => {
  let galleryPage: GalleryPage

  test.beforeEach(async ({ page }) => {
    galleryPage = new GalleryPage(page)
    await galleryPage.goto()
  })

  test.describe('Desktop Gallery Navigation', () => {
    test('Complete keyboard navigation workflow', async ({ page, browserName }, testInfo) => {
      // Skip on mobile browsers - they use vertical gallery without arrow navigation
      test.skip(testInfo.project.name.includes('Mobile'), 'Desktop-only test - mobile uses different gallery')

      // Validate initial gallery state
      await galleryPage.validateGalleryStructure()

      const itemCount = await galleryPage.getGalleryItemCount()
      expect(itemCount).toBeGreaterThan(0)

      // Test right arrow navigation
      const initialIndex = await galleryPage.getActiveItemIndex()
      await galleryPage.navigateRight()
      const newIndex = await galleryPage.getActiveItemIndex()
      expect(newIndex).not.toBe(initialIndex) // Verify navigation changed active item

      // Test navigation to project
      await galleryPage.openActiveProject()
      await page.waitForLoadState('networkidle')

      // Wait for project content to be fully loaded and interactive
      await page.waitForSelector('.nordic-container', { state: 'visible' })
      await page.waitForTimeout(500) // Allow for client-side hydration and event listeners

      // Test return to gallery
      await page.keyboard.press('Escape')
      await page.waitForURL('/', { waitUntil: 'domcontentloaded' })
    })

    test('Gallery performance and loading', async ({}, testInfo) => {
      // Skip on mobile browsers - they use vertical gallery
      test.skip(testInfo.project.name.includes('Mobile'), 'Desktop-only test - mobile uses different gallery')

      const startTime = Date.now()
      await galleryPage.goto()
      const loadTime = Date.now() - startTime

      // Gallery should load within reasonable time
      expect(loadTime).toBeLessThan(5000)

      // Validate all expected elements are loaded
      const itemCount = await galleryPage.getGalleryItemCount()
      expect(itemCount).toBeGreaterThanOrEqual(1)
    })
  })

  test.describe('Mobile Gallery Navigation', () => {
    test.use({ viewport: { width: 375, height: 667 } }) // iPhone SE size

    test('Mobile accessibility and navigation', async ({ page }) => {
      await galleryPage.validateGalleryStructure()

      // Test touch targets are appropriately sized for mobile
      const galleryItems = page.locator('[data-testid^="gallery-item-"]')
      const firstItem = galleryItems.first()

      // Wait for element to be fully laid out with valid bounding box
      // Mobile Chrome needs extra time for layout calculation after visibility
      let boundingBox = await firstItem.boundingBox()
      let retries = 0
      const maxRetries = 10

      while ((!boundingBox || boundingBox.width === 0 || boundingBox.height === 0) && retries < maxRetries) {
        await page.waitForTimeout(100)
        boundingBox = await firstItem.boundingBox()
        retries++
      }

      expect(boundingBox).toBeTruthy()

      if (boundingBox) {
        // Touch targets should be at least 44px in each dimension
        expect(boundingBox.width).toBeGreaterThanOrEqual(44)
        expect(boundingBox.height).toBeGreaterThanOrEqual(44)
      }
    })
  })

  test.describe('Cross-Device Consistency', () => {
    test('Desktop to mobile layout transition', async ({ page }) => {
      // Start with desktop viewport
      await page.setViewportSize({ width: 1920, height: 1080 })
      await galleryPage.goto()
      await galleryPage.validateGalleryStructure()

      const itemCountDesktop = await galleryPage.getGalleryItemCount()

      // Switch to mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })
      await page.waitForTimeout(500) // Allow for responsive layout adjustment

      await galleryPage.validateGalleryStructure()
      const itemCountMobile = await galleryPage.getGalleryItemCount()

      // Should have the same number of items regardless of viewport
      expect(itemCountMobile).toBe(itemCountDesktop)
    })
  })
})
