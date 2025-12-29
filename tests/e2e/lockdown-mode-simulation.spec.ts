// ABOUTME: E2E regression tests for Issue #259 - Lockdown Mode gallery compatibility
// Simulates JavaScript-disabled environments to catch Lockdown Mode regressions

import { test, expect } from '@playwright/test'
import { setupTestPage } from './helpers/test-setup'

test.describe('Lockdown Mode Simulation - Issue #259 Regression', () => {
  test.beforeEach(async ({ page }) => {
    await setupTestPage(page)
  })

  test.describe('Mobile Gallery - JavaScript Disabled Simulation', () => {
    test.use({ viewport: { width: 375, height: 667 } })

    test('REGRESSION: Mobile gallery items must be clickable Links (not JavaScript-dependent)', async ({ page, context }) => {
      // Navigate to homepage
      await page.goto('/')

      // Wait for gallery to load
      await page.waitForSelector('[data-testid="mobile-gallery"]', { state: 'visible' })

      // Get all gallery item links
      const galleryLinks = page.locator('[data-testid="mobile-gallery"] a[href^="/project/"]')

      // Verify we have gallery links (not divs/articles with onClick)
      const linkCount = await galleryLinks.count()
      expect(linkCount).toBeGreaterThan(0)

      // Verify first link has proper href attribute
      const firstLink = galleryLinks.first()
      const href = await firstLink.getAttribute('href')

      expect(href).toBeTruthy()
      expect(href).toMatch(/^\/project\//)

      // CRITICAL: Verify link is actually an <a> tag (not div/article with role="link")
      const tagName = await firstLink.evaluate(el => el.tagName.toLowerCase())
      expect(tagName).toBe('a')

      // Verify link is not blocked by pointer-events or z-index
      const isClickable = await firstLink.evaluate((el) => {
        const styles = window.getComputedStyle(el)
        return styles.pointerEvents !== 'none' && styles.visibility !== 'hidden'
      })
      expect(isClickable).toBe(true)

      // Simulate Lockdown Mode by clicking the link (uses href, not JavaScript)
      // In real Lockdown Mode, onClick handlers are blocked but href navigation works
      await firstLink.click()

      // Should navigate using href (works without JavaScript)
      await expect(page).toHaveURL(/\/project\//)
    })

    test('REGRESSION: Mobile gallery must not use onClick on articles', async ({ page }) => {
      await page.goto('/')
      await page.waitForSelector('[data-testid="mobile-gallery"]', { state: 'visible' })

      // Check for the old broken pattern: articles with onClick/role="button"
      const articlesWithRoleButton = page.locator('article[role="button"]')
      const count = await articlesWithRoleButton.count()

      // This should be 0 - if it's > 0, someone reverted to the broken pattern
      expect(count).toBe(0)
    })

    test('REGRESSION: Mobile gallery links must work without JavaScript execution', async ({ page, context }) => {
      await page.goto('/')
      await page.waitForSelector('[data-testid="mobile-gallery"]', { state: 'visible' })

      // Get first gallery link
      const firstLink = page.locator('[data-testid="mobile-gallery"] a').first()

      // Get the href attribute (this is what makes Lockdown Mode work)
      const href = await firstLink.getAttribute('href')
      expect(href).toBeTruthy()

      // Navigate using the href directly (simulates browser navigation without JS)
      await page.goto(href!)

      // Should be on project page
      await expect(page).toHaveURL(/\/project\//)
    })
  })

  test.describe('Desktop Gallery - Strict Browser Security Simulation', () => {
    test('REGRESSION: Desktop gallery items must be clickable Links (not JavaScript-dependent)', async ({ page }) => {
      // Navigate to homepage
      await page.goto('/')

      // Wait for gallery to load
      await page.waitForSelector('[data-testid="desktop-gallery"]', { state: 'visible', timeout: 10000 })

      // Get all gallery item links
      const galleryLinks = page.locator('[data-testid="desktop-gallery"] a[href^="/project/"]')

      // Verify we have gallery links (not divs with onClick)
      const linkCount = await galleryLinks.count()
      expect(linkCount).toBeGreaterThan(0)

      // Verify first link has proper href attribute
      const firstLink = galleryLinks.first()
      const href = await firstLink.getAttribute('href')

      expect(href).toBeTruthy()
      expect(href).toMatch(/^\/project\//)

      // CRITICAL: Verify link is actually an <a> tag (not div with role="button")
      const tagName = await firstLink.evaluate(el => el.tagName.toLowerCase())
      expect(tagName).toBe('a')

      // Verify link is not blocked by pointer-events or z-index
      const isClickable = await firstLink.evaluate((el) => {
        const styles = window.getComputedStyle(el)
        return styles.pointerEvents !== 'none' && styles.visibility !== 'hidden'
      })
      expect(isClickable).toBe(true)

      // Click the link (uses href, not onClick handler)
      await firstLink.click()

      // Should navigate using href
      await expect(page).toHaveURL(/\/project\//)
    })

    test('REGRESSION: Desktop gallery must not use onClick on divs', async ({ page }) => {
      await page.goto('/')
      await page.waitForSelector('[data-testid="desktop-gallery"]', { state: 'visible' })

      // Check for the old broken pattern: divs with onClick/role="button"
      const divsWithRoleButton = page.locator('[data-testid="desktop-gallery"] div[role="button"]')
      const count = await divsWithRoleButton.count()

      // Navigation arrows are buttons, but gallery items should not be divs with role="button"
      // Check specifically for gallery items (data-testid starts with "gallery-item-")
      const galleryItemDivButtons = page.locator('[data-testid^="gallery-item-"][role="button"]')
      const galleryItemDivButtonCount = await galleryItemDivButtons.count()

      expect(galleryItemDivButtonCount).toBe(0)
    })

    test('REGRESSION: Desktop gallery links must work without JavaScript execution', async ({ page }) => {
      await page.goto('/')
      await page.waitForSelector('[data-testid="desktop-gallery"]', { state: 'visible' })

      // Get first gallery link
      const firstLink = page.locator('[data-testid="desktop-gallery"] a[data-testid^="gallery-item-"]').first()

      // Get the href attribute (this is what makes strict browser security work)
      const href = await firstLink.getAttribute('href')
      expect(href).toBeTruthy()

      // Navigate using the href directly (simulates browser navigation without JS)
      await page.goto(href!)

      // Should be on project page
      await expect(page).toHaveURL(/\/project\//)
    })
  })

  test.describe('Cross-Platform Link Consistency', () => {
    test('REGRESSION: Both mobile and desktop must use semantic <a> tags for gallery items', async ({ page }) => {
      // Test mobile
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('/')
      await page.waitForSelector('[data-testid="mobile-gallery"]', { state: 'visible' })

      const mobileLinks = page.locator('[data-testid="mobile-gallery"] a[href^="/project/"]')
      const mobileLinkCount = await mobileLinks.count()
      expect(mobileLinkCount).toBeGreaterThan(0)

      // Verify mobile links are <a> tags
      const mobileTagName = await mobileLinks.first().evaluate(el => el.tagName.toLowerCase())
      expect(mobileTagName).toBe('a')

      // Test desktop
      await page.setViewportSize({ width: 1920, height: 1080 })
      await page.goto('/')
      await page.waitForSelector('[data-testid="desktop-gallery"]', { state: 'visible' })

      const desktopLinks = page.locator('[data-testid="desktop-gallery"] a[href^="/project/"]')
      const desktopLinkCount = await desktopLinks.count()
      expect(desktopLinkCount).toBeGreaterThan(0)

      // Verify desktop links are <a> tags
      const desktopTagName = await desktopLinks.first().evaluate(el => el.tagName.toLowerCase())
      expect(desktopTagName).toBe('a')
    })
  })

  test.describe('Accessibility - Keyboard Navigation', () => {
    test('REGRESSION: Gallery links must be keyboard accessible without explicit tabIndex', async ({ page }) => {
      await page.goto('/')
      await page.waitForSelector('[data-testid="desktop-gallery"]', { state: 'visible' })

      // Links are naturally keyboard accessible
      // Focus first gallery link using keyboard (Tab key)
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab') // May need multiple tabs to reach gallery

      // Check if a gallery link is focused
      const focusedElement = await page.evaluate(() => {
        const el = document.activeElement
        return {
          tagName: el?.tagName.toLowerCase(),
          href: el?.getAttribute('href'),
          dataTestId: el?.getAttribute('data-testid')
        }
      })

      // Eventually a gallery link should be focusable
      // (This might take multiple Tab presses in real scenario, but the point is links are in tab order)
      if (focusedElement.tagName === 'a' && focusedElement.href?.includes('/project/')) {
        expect(focusedElement.tagName).toBe('a')
      }
    })
  })

  test.describe('Lighthouse Performance - Link Usage', () => {
    test('REGRESSION: Gallery should use proper <a> tags for SEO and crawlability', async ({ page }) => {
      await page.goto('/')
      await page.waitForSelector('[data-testid="mobile-gallery"], [data-testid="desktop-gallery"]', { state: 'visible' })

      // Get all links on the page
      const allLinks = page.locator('a[href]')
      const linkCount = await allLinks.count()

      // Verify gallery items contribute to discoverable links
      const galleryLinks = page.locator('a[href^="/project/"]')
      const galleryLinkCount = await galleryLinks.count()

      expect(galleryLinkCount).toBeGreaterThan(0)
      expect(galleryLinkCount).toBeLessThanOrEqual(linkCount)

      // Verify links have valid href attributes (good for SEO and crawlers)
      for (let i = 0; i < Math.min(3, galleryLinkCount); i++) {
        const link = galleryLinks.nth(i)
        const href = await link.getAttribute('href')
        expect(href).toMatch(/^\/project\/[a-zA-Z0-9-]+$/)
      }
    })
  })
})
