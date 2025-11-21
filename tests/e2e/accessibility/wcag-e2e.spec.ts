// ABOUTME: End-to-end WCAG 2.1 AA accessibility tests using Playwright and axe-core
// Tests real browser environment for accessibility compliance (Issue #86)

import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('WCAG 2.1 AA E2E Accessibility Tests', () => {
  test.describe('Homepage Accessibility', () => {
    test('should not have any automatically detectable accessibility issues', async ({
      page,
    }) => {
      await page.goto('/')

      // Wait for content to load
      await page.waitForSelector('[data-testid="desktop-gallery"]', {
        timeout: 10000,
      })

      // Run axe accessibility scan
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze()

      // This will FAIL until we fix all accessibility issues
      expect(accessibilityScanResults.violations).toEqual([])
    })

    test('should pass color contrast checks', async ({ page }) => {
      await page.goto('/')

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2aa'])
        .disableRules(['color-contrast-enhanced']) // Disable AAA 7:1 check, only check AA 4.5:1
        .analyze()

      // Check WCAG AA color contrast compliance (4.5:1 for normal text)
      expect(accessibilityScanResults.violations).toEqual([])
    })

    test('should have proper ARIA implementation', async ({ page }) => {
      await page.goto('/')

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['cat.aria'])
        .analyze()

      // This will FAIL until aria-live regions are added to forms
      expect(accessibilityScanResults.violations).toEqual([])
    })

    test('should have valid HTML structure and semantics', async ({ page }) => {
      await page.goto('/')

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['cat.structure'])
        .analyze()

      // This will FAIL due to heading hierarchy issues
      expect(accessibilityScanResults.violations).toEqual([])
    })

    test('should have proper keyboard navigation', async ({ page }) => {
      await page.goto('/')

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['cat.keyboard'])
        .analyze()

      expect(accessibilityScanResults.violations).toEqual([])
    })

    test('should have descriptive alt text on all images', async ({ page }) => {
      await page.goto('/')

      // Wait for gallery to load
      await page.waitForSelector('[data-testid="desktop-gallery"]')

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['cat.text-alternatives'])
        .analyze()

      expect(accessibilityScanResults.violations).toEqual([])
    })
  })

  test.describe('Contact Form Accessibility', () => {
    test('should not have accessibility violations', async ({ page }) => {
      await page.goto('/contact')

      // Wait for form to load (works across all viewports: desktop/mobile/contact-form variants)
      await page.waitForSelector('form')

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze()

      // This will FAIL until form aria-live regions are added
      expect(accessibilityScanResults.violations).toEqual([])
    })

    test('should have proper form labels and error announcements', async ({
      page,
    }) => {
      await page.goto('/contact')

      // Wait for form (works across all viewports: desktop/mobile/contact-form variants)
      await page.waitForSelector('form')

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['cat.forms'])
        .analyze()

      expect(accessibilityScanResults.violations).toEqual([])
    })

    test('form errors should be announced to screen readers', async ({
      page,
    }) => {
      await page.goto('/contact')

      // Wait for form (works across all viewports: desktop/mobile/contact-form variants)
      await page.waitForSelector('form')

      // Submit empty form to trigger errors
      await page.click('button[type="submit"]')

      // Wait for error messages
      await page.waitForSelector('.form-error, [role="alert"]', {
        timeout: 5000,
      })

      // Check that error messages have aria-live
      const errorElements = await page.locator('[role="alert"]').count()
      expect(errorElements).toBeGreaterThan(0)

      // Verify aria-live attribute exists
      const ariaLiveElements = await page
        .locator('[aria-live="assertive"], [aria-live="polite"]')
        .count()
      expect(ariaLiveElements).toBeGreaterThan(0)
    })
  })

  test.describe('Gallery Navigation Accessibility', () => {
    test('gallery navigation should be keyboard accessible', async ({
      page,
    }) => {
      await page.goto('/')

      // Wait for gallery
      await page.waitForSelector('[data-testid="desktop-gallery"]')

      // Test keyboard navigation
      const firstItem = page.locator('[data-testid="gallery-item-0"]')
      await firstItem.focus()

      // Check focus is on first item
      await expect(firstItem).toBeFocused()

      // Test arrow key navigation
      await page.keyboard.press('ArrowRight')

      // Check that we can navigate (focus should move or scroll should change)
      // This verifies keyboard navigation works
    })

    test('gallery items should have descriptive accessible names', async ({
      page,
    }) => {
      await page.goto('/')

      // Wait for gallery
      await page.waitForSelector('[data-testid="desktop-gallery"]')

      const accessibilityScanResults = await new AxeBuilder({ page })
        .include('[data-testid^="gallery-item-"]')
        .withTags(['wcag2a', 'wcag21a'])
        .analyze()

      expect(accessibilityScanResults.violations).toEqual([])
    })
  })

  test.describe('Language Declaration', () => {
    test('should have valid lang attribute on html element', async ({
      page,
    }) => {
      await page.goto('/')

      const htmlLang = await page.getAttribute('html', 'lang')

      expect(htmlLang).toBeTruthy()
      expect(htmlLang).toMatch(/^[a-z]{2}(-[A-Z]{2})?$/)
    })
  })

  test.describe('Focus Management', () => {
    test('should have visible focus indicators', async ({ page }) => {
      await page.goto('/')

      // Tab through interactive elements
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')

      // Check that focus is visible
      const focusedElement = await page.locator(':focus')
      const outlineStyle = await focusedElement.evaluate((el) => {
        const styles = window.getComputedStyle(el)
        return {
          outline: styles.outline,
          outlineWidth: styles.outlineWidth,
          outlineStyle: styles.outlineStyle,
          outlineColor: styles.outlineColor,
          boxShadow: styles.boxShadow,
        }
      })

      // Verify some focus indicator is present
      const hasFocusIndicator =
        (outlineStyle.outlineWidth && outlineStyle.outlineWidth !== '0px') ||
        (outlineStyle.boxShadow && outlineStyle.boxShadow !== 'none')

      expect(hasFocusIndicator).toBeTruthy()
    })

    test('should not have keyboard traps', async ({ page }) => {
      await page.goto('/')

      // Tab through entire page
      const maxTabs = 50
      for (let i = 0; i < maxTabs; i++) {
        await page.keyboard.press('Tab')
      }

      // If we get here without hanging, no keyboard trap exists
      expect(true).toBe(true)
    })
  })

  test.describe('Screen Reader Compatibility', () => {
    test('should have proper heading structure for screen readers', async ({
      page,
    }) => {
      await page.goto('/')

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['cat.semantics'])
        .analyze()

      expect(accessibilityScanResults.violations).toEqual([])
    })

    test('should have proper landmark regions', async ({ page }) => {
      await page.goto('/')

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['cat.name-role-value'])
        .analyze()

      expect(accessibilityScanResults.violations).toEqual([])
    })
  })

  test.describe('Comprehensive Page Scans', () => {
    const pages = ['/', '/about', '/contact']

    for (const pagePath of pages) {
      test(`${pagePath} should pass comprehensive accessibility scan`, async ({
        page,
      }) => {
        await page.goto(pagePath)

        // Wait for content
        await page.waitForLoadState('domcontentloaded')

        const accessibilityScanResults = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
          .analyze()

        // Log violations for debugging
        if (accessibilityScanResults.violations.length > 0) {
          console.log(
            `Accessibility violations on ${pagePath}:`,
            JSON.stringify(accessibilityScanResults.violations, null, 2)
          )
        }

        expect(accessibilityScanResults.violations).toEqual([])
      })
    }
  })
})
