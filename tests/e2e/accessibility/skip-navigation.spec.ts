// ABOUTME: E2E tests for skip navigation link - WCAG 2.4.1 compliance
import { test, expect } from '@playwright/test'
import { setupTestPage } from '../helpers/test-setup'

test.describe('Skip Navigation - WCAG 2.4.1', () => {
  test.beforeEach(async ({ page }) => {
    await setupTestPage(page)
  })

  test('skip link is first focusable element and bypasses navigation', async ({
    page,
  }) => {
    // Navigate to homepage
    await page.goto('/')

    // Tab to first focusable element (should be skip link)
    await page.keyboard.press('Tab')

    // Verify skip link receives focus
    const skipLink = page.locator('a[href="#main-content"]')
    await expect(skipLink).toBeFocused()

    // Verify skip link is visible when focused
    // Skip link uses sr-only class and becomes visible on focus
    await expect(skipLink).toBeVisible()

    // Verify skip link has correct text
    await expect(skipLink).toHaveText('Skip to main content')

    // Activate skip link with Enter
    await page.keyboard.press('Enter')

    // Verify main content receives focus
    // Note: The browser should focus the main element after clicking the skip link
    const mainContent = page.locator('#main-content')
    await expect(mainContent).toBeFocused()
  })

  test('skip link works on all pages', async ({ page }) => {
    const pages = ['/', '/about', '/contact', '/projects']

    for (const pagePath of pages) {
      await page.goto(pagePath)

      // Tab to skip link
      await page.keyboard.press('Tab')

      // Verify skip link is present and focused
      const skipLink = page.locator('a[href="#main-content"]')
      await expect(skipLink).toBeFocused()
      await expect(skipLink).toBeVisible()

      // Verify clicking skip link focuses main content
      await page.keyboard.press('Enter')
      const mainContent = page.locator('#main-content')
      await expect(mainContent).toBeFocused()
    }
  })

  test('skip link has sufficient visibility when focused', async ({ page }) => {
    await page.goto('/')

    // Tab to skip link
    await page.keyboard.press('Tab')

    const skipLink = page.locator('a[href="#main-content"]')
    await expect(skipLink).toBeFocused()

    // Verify skip link is visible when focused (not hidden)
    await expect(skipLink).toBeVisible()

    // Verify skip link has correct text content
    const textContent = await skipLink.textContent()
    expect(textContent).toBe('Skip to main content')

    // Verify skip link has been taken out of sr-only state when focused
    const position = await skipLink.evaluate((el) =>
      window.getComputedStyle(el).position
    )
    expect(position).toBe('absolute')

    // Verify the link has a bounding box (is rendered in DOM)
    const boundingBox = await skipLink.boundingBox()
    expect(boundingBox).not.toBeNull()
  })

  test('skip link has proper ARIA attributes', async ({ page }) => {
    await page.goto('/')

    const skipLink = page.locator('a[href="#main-content"]')

    // Verify skip link is properly accessible
    await expect(skipLink).toHaveAttribute('href', '#main-content')

    // Main content should have proper ARIA role
    const mainContent = page.locator('#main-content')
    await expect(mainContent).toHaveAttribute('role', 'main')
  })
})
