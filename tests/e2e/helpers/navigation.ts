// ABOUTME: Common navigation patterns and utilities for E2E tests
import { Page } from '@playwright/test'

/**
 * Navigation helper utilities
 */

/**
 * Navigate to a page and wait for it to load
 */
export async function navigateAndWait(page: Page, url: string) {
  await page.goto(url)
  await page.waitForLoadState('networkidle')
}

/**
 * Navigate back and wait for previous page to load
 */
export async function navigateBack(page: Page) {
  await page.goBack()
  await page.waitForLoadState('networkidle')
}

/**
 * Navigate forward and wait for next page to load
 */
export async function navigateForward(page: Page) {
  await page.goForward()
  await page.waitForLoadState('networkidle')
}

/**
 * Reload page and wait for it to load
 */
export async function reloadPage(page: Page) {
  await page.reload()
  await page.waitForLoadState('networkidle')
}
