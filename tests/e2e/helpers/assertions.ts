// ABOUTME: Custom assertion utilities for E2E tests
import { Page, expect } from '@playwright/test'

/**
 * Assert that page has expected URL (with timeout)
 */
export async function expectUrlToBe(page: Page, url: string, timeout = 5000) {
  await expect(page).toHaveURL(url, { timeout })
}

/**
 * Assert that page URL contains text
 */
export async function expectUrlToContain(
  page: Page,
  text: string,
  timeout = 5000
) {
  await expect(page).toHaveURL(new RegExp(text), { timeout })
}

/**
 * Assert that element is visible and has text
 */
export async function expectVisibleWithText(
  page: Page,
  selector: string,
  text: string
) {
  const element = page.locator(selector)
  await expect(element).toBeVisible()
  await expect(element).toContainText(text)
}

/**
 * Assert that multiple elements exist
 */
export async function expectElementCount(
  page: Page,
  selector: string,
  count: number
) {
  const elements = page.locator(selector)
  await expect(elements).toHaveCount(count)
}

/**
 * Assert that page has loaded successfully (no error pages)
 */
export async function expectPageToLoad(page: Page) {
  // Check we're not on an error page
  await expect(page.locator('text=404')).not.toBeVisible()
  await expect(page.locator('text=500')).not.toBeVisible()
  await expect(page.locator('text=Error')).not.toBeVisible()
}
