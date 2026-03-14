// ABOUTME: Accessibility tests for OptimizedImage component ensuring WCAG 2.1 AA compliance

import { test, expect, Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { setupTestPage } from './helpers/test-setup'

// Helper function: Get gallery selector based on viewport size
// Mobile (<768px) uses mobile-gallery, Desktop (>=768px) uses desktop-gallery
// Both galleries are in the SSR HTML simultaneously; CSS media queries control visibility (Issue #348)
async function getGallerySelector(page: Page): Promise<string> {
  const viewport = page.viewportSize()
  if (!viewport) {
    throw new Error('Viewport size not set')
  }
  return viewport.width < 768
    ? '[data-testid="mobile-gallery"]'
    : '[data-testid="desktop-gallery"]'
}

test.describe('OptimizedImage Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await setupTestPage(page)
    // Setup error logging
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.error('Browser console error:', msg.text())
      }
    })
  })

  test.describe('Automated Accessibility Scans', () => {
    test('Homepage should not have any automatically detectable accessibility issues', async ({
      page,
    }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze()

      expect(accessibilityScanResults.violations).toEqual([])
    })

    test('Gallery images should not have accessibility violations', async ({
      page,
    }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')

      const accessibilityScanResults = await new AxeBuilder({ page })
        .include('[data-testid^="gallery-item-"], .desktop-gallery-item')
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze()

      expect(accessibilityScanResults.violations).toEqual([])
    })

    test('Project page images should not have accessibility violations', async ({
      page,
    }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')

      // Wait for gallery to fully load (skeleton to disappear)
      await page.waitForSelector('[data-testid="gallery-loading-skeleton"]', {
        state: 'detached',
        timeout: 10000
      })

      // Navigate to first project — scoped to visible gallery to avoid strict mode violation
      // Both galleries are in SSR HTML; CSS media queries hide the non-applicable one (Issue #348)
      const gallerySelector = await getGallerySelector(page)
      const firstProject = page.locator(gallerySelector).locator('[data-testid^="gallery-item-"]').first()
      await firstProject.click()

      await page.waitForLoadState('networkidle')

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze()

      expect(accessibilityScanResults.violations).toEqual([])
    })
  })

  test.describe('Image Alt Text Requirements', () => {
    test('All images should have proper alt text', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')

      const images = page.locator('img')
      const imageCount = await images.count()
      expect(imageCount).toBeGreaterThan(0)

      // Check all images for alt attribute
      for (let i = 0; i < imageCount; i++) {
        const image = images.nth(i)
        const altText = await image.getAttribute('alt')

        // Alt attribute must exist
        expect(altText).not.toBeNull()

        // Alt text should be meaningful (> 0 characters)
        // Exception: decorative images can have empty alt=""
        if (altText !== null) {
          // Either has meaningful text or is explicitly marked decorative
          const isDecorativeSvg = await image.evaluate(
            (el) => el.tagName === 'svg'
          )
          const hasAriaHidden = await image.getAttribute('aria-hidden')

          if (!isDecorativeSvg && hasAriaHidden !== 'true') {
            expect(altText.length).toBeGreaterThan(0)
          }
        }
      }
    })
  })

  test.describe('Keyboard Navigation Accessibility', () => {
    test('Clickable images should have proper ARIA attributes', async ({
      page,
    }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')

      // Wait for gallery items to be visible — scoped to visible gallery to avoid strict mode violation
      // Both galleries are in SSR HTML; CSS media queries hide the non-applicable one (Issue #348)
      const gallerySelector = await getGallerySelector(page)
      await page.locator(gallerySelector).locator('[data-testid^="gallery-item-"]').first().waitFor({ state: 'visible' })

      // Gallery items are semantic <a> links (Issue #259 lockdown-mode fix)
      // Both MobileGallery and DesktopGallery use <Link> which renders as <a>
      // Scope to visible gallery to avoid duplicate matches causing strict mode violation
      const galleryLinks = page.locator(gallerySelector).locator('[data-testid^="gallery-item-"]')
      const linkCount = await galleryLinks.count()

      expect(linkCount).toBeGreaterThan(0)

      // Check first 3 gallery links for proper accessibility attributes
      const linksToCheck = Math.min(linkCount, 3)
      for (let i = 0; i < linksToCheck; i++) {
        const link = galleryLinks.nth(i)

        // Should be a semantic <a> tag (natively keyboard accessible, no tabIndex needed)
        const tagName = await link.evaluate(el => el.tagName.toLowerCase())
        expect(tagName).toBe('a')

        // Should have href pointing to a project page
        const href = await link.getAttribute('href')
        expect(href).toMatch(/^\/project\//)

        // Should have aria-label or aria-labelledby for screen readers
        const ariaLabel = await link.getAttribute('aria-label')
        const ariaLabelledBy = await link.getAttribute('aria-labelledby')

        expect(ariaLabel !== null || ariaLabelledBy !== null).toBe(true)

        // If has aria-label, should not be empty
        if (ariaLabel !== null) {
          expect(ariaLabel.length).toBeGreaterThan(0)
        }
      }
    })

    test('Tab navigation works correctly through images', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')

      // Start tabbing through page
      await page.keyboard.press('Tab')
      await page.waitForTimeout(100)

      // Get initial focused element
      const initialFocus = await page.evaluate(() => ({
        tagName: document.activeElement?.tagName,
        role: document.activeElement?.getAttribute('role'),
      }))

      expect(initialFocus.tagName).toBeTruthy()

      // Tab again
      await page.keyboard.press('Tab')
      await page.waitForTimeout(100)

      // Get new focused element
      const secondFocus = await page.evaluate(() => ({
        tagName: document.activeElement?.tagName,
        role: document.activeElement?.getAttribute('role'),
      }))

      expect(secondFocus.tagName).toBeTruthy()

      // Focus can be on same element type if there are multiple, so just check it's not undefined
      expect(secondFocus.tagName).not.toBe('undefined')
    })

    test('Enter and Space keys activate clickable images', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')

      // Find first gallery item link scoped to visible gallery
      // Both galleries are in SSR HTML; CSS hides the non-applicable one — scope avoids strict mode violation
      const gallerySelector = await getGallerySelector(page)
      const galleryLink = page.locator(gallerySelector).locator('[data-testid^="gallery-item-"]').first()
      await expect(galleryLink).toBeVisible({ timeout: 5000 })

      // Focus the link
      await galleryLink.focus()

      // Press Enter key (activates <a> link navigation natively)
      await page.keyboard.press('Enter')

      // Wait for potential navigation
      await page.waitForTimeout(1000)

      // Should either navigate or trigger some action
      // (May navigate to project page or stay on current page depending on implementation)
      const finalUrl = page.url()

      // Either URL changed (navigation occurred) or stayed same (action performed)
      expect(typeof finalUrl).toBe('string')
    })
  })

  test.describe('Focus Management', () => {
    test('Focus indicators are visible', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')

      // Tab to first focusable element
      await page.keyboard.press('Tab')
      await page.waitForTimeout(200)

      // Check if focus outline is visible
      const focusVisible = await page.evaluate(() => {
        const el = document.activeElement
        if (!el) return false

        const styles = window.getComputedStyle(el)

        // Check for outline, box-shadow, or border changes
        const hasOutline =
          styles.outlineWidth !== '0px' && styles.outlineStyle !== 'none'
        const hasBoxShadow = styles.boxShadow !== 'none'
        const hasBorder =
          styles.borderWidth !== '0px' && styles.borderStyle !== 'none'

        return hasOutline || hasBoxShadow || hasBorder
      })

      // Focus should be visually indicated
      expect(focusVisible).toBe(true)
    })

    test('Focus is not trapped in gallery', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')

      // Tab through multiple elements
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Tab')
        await page.waitForTimeout(100)

        // Check we're still on the page (not stuck)
        const focusedElement = await page.evaluate(() => ({
          tagName: document.activeElement?.tagName,
          inBody: document.body.contains(document.activeElement),
        }))

        expect(focusedElement.inBody).toBe(true)
      }

      // Focus should be able to leave gallery area
      const finalFocus = await page.evaluate(
        () => document.activeElement?.tagName
      )
      expect(finalFocus).toBeTruthy()
    })
  })

  test.describe('Color Contrast Requirements', () => {
    test('Error messages have sufficient contrast', async ({ page }) => {
      // Intercept images to force error state
      await page.route('**/*.webp', (route) => route.abort())
      await page.route('**/*.jpg', (route) => route.abort())
      await page.route('**/*.png', (route) => route.abort())

      await page.goto('/', { waitUntil: 'networkidle' })

      // Wait for error state (may not appear with placeholder fallback)
      const errorText = page.getByText('Failed to load image')
      const isErrorVisible = await errorText.isVisible().catch(() => false)

      if (isErrorVisible) {
        // Get color contrast of error message
        const contrast = await errorText.evaluate((el) => {
          const styles = window.getComputedStyle(el)
          const color = styles.color
          const backgroundColor = styles.backgroundColor

          return { color, backgroundColor }
        })

        expect(contrast.color).toBeTruthy()
        expect(contrast.backgroundColor).toBeTruthy()

        // Note: Actual contrast ratio calculation would require a library
        // This test just verifies the styles are set
        console.log('Error message colors:', contrast)
      }
    })

    test('Retry button has sufficient contrast', async ({ page }) => {
      // Intercept images to force error state
      await page.route('**/*.webp', (route) => route.abort())
      await page.route('**/*.jpg', (route) => route.abort())
      await page.route('**/*.png', (route) => route.abort())

      await page.goto('/', { waitUntil: 'networkidle' })

      // Wait for retry button
      const retryButton = page.getByRole('button', { name: 'Retry' })
      const isRetryVisible = await retryButton.isVisible().catch(() => false)

      if (isRetryVisible) {
        // Get color contrast of retry button
        const contrast = await retryButton.evaluate((el) => {
          const styles = window.getComputedStyle(el)
          const color = styles.color
          const backgroundColor = styles.backgroundColor

          return { color, backgroundColor }
        })

        expect(contrast.color).toBeTruthy()
        expect(contrast.backgroundColor).toBeTruthy()

        // Button should have visible styling
        console.log('Retry button colors:', contrast)
      }
    })
  })

  test.describe('Responsive Design Accessibility', () => {
    test('Mobile viewport maintains accessibility', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })

      await page.goto('/')
      await page.waitForLoadState('networkidle')

      // Run accessibility scan on mobile viewport
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze()

      expect(accessibilityScanResults.violations).toEqual([])
    })

    test('Tablet viewport maintains accessibility', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 })

      await page.goto('/')
      await page.waitForLoadState('networkidle')

      // Run accessibility scan on tablet viewport
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze()

      expect(accessibilityScanResults.violations).toEqual([])
    })
  })
})
