// ABOUTME: E2E checks that the desktop project page shows the work large, with its controls and thumbnails on screen
// Guards against the image shrinking back to a small fixed height or the thumbnail strip sliding off the left edge

import { test, expect } from '@playwright/test'

test.describe('Desktop project image', () => {
  test.beforeEach(async ({ page }) => {
    const viewport = page.viewportSize()
    test.skip(!viewport || viewport.width < 1024, 'desktop layout only')

    await page.goto('/')
    const href = await page
      .locator('a[href^="/project/"]')
      .first()
      .getAttribute('href')
    await page.goto(href as string)
    await expect(page.locator('.desktop-project-img')).toBeVisible()
  })

  test('image takes at least 70% of the window height', async ({ page }) => {
    const viewportHeight = page.viewportSize()?.height ?? 0
    const image = await page.locator('.desktop-project-img').boundingBox()

    expect(image?.height).toBeGreaterThanOrEqual(viewportHeight * 0.7)
  })

  test('image and its counter fit in the first screen', async ({ page }) => {
    const viewportHeight = page.viewportSize()?.height ?? 0
    const image = await page.locator('.desktop-project-img').boundingBox()
    const counter = await page.locator('.elegant-counter').boundingBox()

    expect(image?.y).toBeGreaterThanOrEqual(64)
    expect((counter?.y ?? 0) + (counter?.height ?? 0)).toBeLessThanOrEqual(
      viewportHeight
    )
  })

  test('thumbnails are fully on screen and clear of the image', async ({
    page,
  }) => {
    // A common laptop size, narrower than the page's maximum content width
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.reload()
    await expect(page.locator('.desktop-project-img')).toBeVisible()

    const thumbnail = await page
      .locator('.desktop-thumbnail')
      .first()
      .boundingBox()
    const image = await page.locator('.desktop-project-img').boundingBox()

    expect(thumbnail?.x).toBeGreaterThanOrEqual(0)
    expect((thumbnail?.x ?? 0) + (thumbnail?.width ?? 0)).toBeLessThanOrEqual(
      image?.x ?? 0
    )
  })
})
