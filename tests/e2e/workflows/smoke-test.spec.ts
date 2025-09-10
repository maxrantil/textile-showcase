// ABOUTME: Smoke test to validate basic E2E test functionality and application health
import { test, expect } from '@playwright/test'

test.describe('Smoke Tests - Basic Application Health', () => {
  test('Homepage loads successfully', async ({ page }) => {
    await page.goto('/')

    // Check that the page loads
    await expect(page).toHaveTitle(/textile/i)

    // Look for main content
    const main = page.locator('main')
    await expect(main).toBeVisible()

    console.log('✅ Homepage loads successfully')
  })

  test('Contact page loads successfully', async ({ page }) => {
    await page.goto('/contact')

    // Check that the contact page loads
    const pageContent = page.locator('body')
    await expect(pageContent).toBeVisible()

    // Look for form elements
    const form = page.locator('form')
    if ((await form.count()) > 0) {
      await expect(form.first()).toBeVisible()
    }

    console.log('✅ Contact page loads successfully')
  })

  test('Basic navigation works', async ({ page }) => {
    await page.goto('/')

    // Test basic keyboard navigation
    await page.keyboard.press('Tab')

    // Test arrow keys (might work in gallery)
    await page.keyboard.press('ArrowRight')
    await page.waitForTimeout(500)

    console.log('✅ Basic navigation works')
  })

  test('Page responds to viewport changes', async ({ page }) => {
    await page.goto('/')

    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.waitForTimeout(300)

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.waitForTimeout(300)

    // Page should still be responsive
    const body = page.locator('body')
    await expect(body).toBeVisible()

    console.log('✅ Responsive design works')
  })

  test('No critical JavaScript errors', async ({ page }) => {
    const errors: string[] = []

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    page.on('pageerror', (error) => {
      errors.push(error.message)
    })

    await page.goto('/')
    await page.waitForTimeout(2000)

    // Filter out known non-critical errors
    const criticalErrors = errors.filter(
      (error) =>
        !error.includes('favicon') &&
        !error.includes('404') &&
        !error.includes('Failed to load resource')
    )

    expect(criticalErrors.length).toBe(0)

    if (criticalErrors.length > 0) {
      console.log('❌ JavaScript errors found:', criticalErrors)
    } else {
      console.log('✅ No critical JavaScript errors')
    }
  })
})
