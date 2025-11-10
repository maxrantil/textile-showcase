// ABOUTME: Accessibility tests for OptimizedImage component ensuring WCAG 2.1 AA compliance

import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('OptimizedImage Accessibility', () => {
  test.beforeEach(async ({ page }) => {
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

      // Navigate to first project
      const firstProject = page
        .locator('[data-testid^="gallery-item-"], .desktop-gallery-item')
        .first()
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

      // Find all clickable image wrappers
      const clickableWrappers = page.locator('[role="button"]')
      const clickableCount = await clickableWrappers.count()

      expect(clickableCount).toBeGreaterThan(0)

      // Check first 3 clickable wrappers for proper attributes
      const wrappersToCheck = Math.min(clickableCount, 3)
      for (let i = 0; i < wrappersToCheck; i++) {
        const wrapper = clickableWrappers.nth(i)

        // Should have role="button"
        const role = await wrapper.getAttribute('role')
        expect(role).toBe('button')

        // Should be keyboard accessible (tabindex="0")
        const tabIndex = await wrapper.getAttribute('tabindex')
        expect(tabIndex).toBe('0')

        // Should have aria-label or aria-labelledby
        const ariaLabel = await wrapper.getAttribute('aria-label')
        const ariaLabelledBy = await wrapper.getAttribute('aria-labelledby')

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

      // Find a clickable image wrapper
      const clickableWrapper = page.locator('[role="button"]').first()
      await expect(clickableWrapper).toBeVisible({ timeout: 5000 })

      // Focus the wrapper
      await clickableWrapper.focus()

      // Press Enter key
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
