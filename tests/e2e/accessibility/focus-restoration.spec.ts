// ABOUTME: E2E tests for gallery focus restoration when navigating back from project pages

import { test, expect } from '@playwright/test'

test.describe('Gallery Focus Restoration - WCAG 2.4.3', () => {
  test('focus restored when returning to gallery via back navigation', async ({ page }, testInfo) => {
    // Focus restoration now implemented for both Desktop and Mobile galleries
    // Navigate to homepage
    await page.goto('/')

    // Wait for gallery to be visible
    await page.waitForSelector('[data-testid="desktop-gallery"], [data-testid="mobile-gallery"]', {
      state: 'visible',
      timeout: 10000
    })

    // Wait for gallery to fully load (skeleton to disappear)
    await page.waitForSelector('[data-testid="gallery-loading-skeleton"]', { state: 'detached', timeout: 10000 })

    // Click on item 3 (index 2) to focus it
    const item3 = page.locator('[data-testid="gallery-item-2"]')
    await item3.click()

    // Wait for navigation to project page
    await page.waitForURL(/\/project\/.+/, { timeout: 10000 })

    // Return to gallery using browser back
    await page.goBack()

    // Wait for navigation back to homepage
    await page.waitForURL('/', { timeout: 10000 })

    // Verify focus restored to item 3 (index 2)
    // This is the key assertion - focus should be restored to the same gallery item
    await expect(item3).toBeFocused({ timeout: 5000 })
  })

  test('focus restoration works consistently across multiple navigations', async ({ page }, testInfo) => {
    // Focus restoration now implemented for both Desktop and Mobile galleries
    // Navigate to homepage
    await page.goto('/')

    // Wait for gallery to be visible
    await page.waitForSelector('[data-testid="desktop-gallery"], [data-testid="mobile-gallery"]', {
      state: 'visible',
      timeout: 10000
    })

    // Wait for gallery to fully load (skeleton to disappear)
    await page.waitForSelector('[data-testid="gallery-loading-skeleton"]', { state: 'detached', timeout: 10000 })

    // Click on item 4 (index 3) to focus it
    const item4 = page.locator('[data-testid="gallery-item-3"]')
    await item4.click()

    // Wait for navigation to project page
    await page.waitForURL(/\/project\/.+/, { timeout: 10000 })

    // Return to gallery using browser back
    await page.goBack()

    // Wait for navigation back to homepage
    await page.waitForURL('/', { timeout: 10000 })

    // Verify focus restored to item 4 (index 3)
    await expect(item4).toBeFocused({ timeout: 5000 })
  })

  test('focus restoration does not interfere with scroll restoration', async ({ page }, testInfo) => {
    // Focus restoration now implemented for both Desktop and Mobile galleries
    // Navigate to homepage
    await page.goto('/')

    // Wait for gallery to be visible
    await page.waitForSelector('[data-testid="desktop-gallery"], [data-testid="mobile-gallery"]', {
      state: 'visible',
      timeout: 10000
    })

    // Wait for gallery to fully load (skeleton to disappear)
    await page.waitForSelector('[data-testid="gallery-loading-skeleton"]', { state: 'detached', timeout: 10000 })

    // Click on item 5 (index 4) which might require scrolling
    const item5 = page.locator('[data-testid="gallery-item-4"]')
    await item5.scrollIntoViewIfNeeded()
    await item5.click()

    // Wait for navigation to project page
    await page.waitForURL(/\/project\/.+/, { timeout: 10000 })

    // Return to gallery
    await page.goBack()
    await page.waitForURL('/', { timeout: 10000 })

    // Verify focus is restored
    await expect(item5).toBeFocused({ timeout: 5000 })

    // Verify the item is still visible (scroll restoration worked)
    await expect(item5).toBeVisible()
  })

  test('focus restoration clears sessionStorage after restoration', async ({ page }, testInfo) => {
    // Focus restoration now implemented for both Desktop and Mobile galleries
    // Navigate to homepage
    await page.goto('/')

    // Wait for gallery to be visible
    await page.waitForSelector('[data-testid="desktop-gallery"], [data-testid="mobile-gallery"]', {
      state: 'visible',
      timeout: 10000
    })

    // Wait for gallery to fully load (skeleton to disappear)
    await page.waitForSelector('[data-testid="gallery-loading-skeleton"]', { state: 'detached', timeout: 10000 })

    // Click on item 2 (index 1) to focus it
    const item2 = page.locator('[data-testid="gallery-item-1"]')
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

    // Verify focus restored
    await expect(item2).toBeFocused({ timeout: 5000 })

    // Verify sessionStorage is cleared after restoration
    const savedIndexAfterReturn = await page.evaluate(() =>
      sessionStorage.getItem('galleryFocusIndex')
    )
    expect(savedIndexAfterReturn).toBeNull()
  })
})
