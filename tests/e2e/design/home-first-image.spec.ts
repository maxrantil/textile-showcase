// ABOUTME: E2E checks that the desktop home gallery opens with its first image on the left margin, under the name
// Guards the unscrolled start (so the page gets a Largest Contentful Paint) and the centring of the images after it

import { test, expect, type Page } from '@playwright/test'

const track = (page: Page) => page.locator('.desktop-gallery-track')
const item = (page: Page, index: number) =>
  track(page).locator(`[data-testid="gallery-item-${index}"]`)

async function openHome(page: Page) {
  await page.goto('/')
  await expect(item(page, 0)).toBeVisible()
  // Scroll restoration settles 150ms after mount; the index only follows scrolling once it has
  await page.waitForTimeout(500)
}

/** Distance between the centre of a gallery image and the centre of the window. */
async function offCentre(page: Page, index: number): Promise<number> {
  const box = await item(page, index).locator('img').boundingBox()
  const width = page.viewportSize()?.width ?? 0
  return Math.abs((box?.x ?? 0) + (box?.width ?? 0) / 2 - width / 2)
}

test.describe('Home gallery start', () => {
  test.beforeEach(async ({ page }) => {
    const viewport = page.viewportSize()
    test.skip(!viewport || viewport.width < 1024, 'desktop layout only')
  })

  test('first image and its caption start under the name', async ({ page }) => {
    await openHome(page)
    const logo = await page.locator('.header__logo').boundingBox()
    const image = await item(page, 0).locator('img').boundingBox()
    const caption = await item(page, 0)
      .locator('.desktop-gallery-title')
      .boundingBox()

    expect(Math.round(image?.x ?? -1)).toBe(Math.round(logo?.x ?? -2))
    expect(Math.round(caption?.x ?? -1)).toBe(Math.round(logo?.x ?? -2))
  })

  test('gallery is not scrolled on arrival', async ({ page }) => {
    await openHome(page)

    expect(await track(page).evaluate((el) => el.scrollLeft)).toBe(0)
    await expect(track(page)).toHaveAttribute('data-current-index', '0')
  })

  test('home page records a Largest Contentful Paint', async ({ page }) => {
    await openHome(page)
    const entries = await page.evaluate(
      () =>
        new Promise<number>((resolve) => {
          new PerformanceObserver((list) =>
            resolve(list.getEntries().length)
          ).observe({ type: 'largest-contentful-paint', buffered: true })
          setTimeout(() => resolve(0), 2000)
        })
    )

    expect(entries).toBeGreaterThan(0)
  })

  test('next image is centred, and going back returns to the left margin', async ({
    page,
  }) => {
    await openHome(page)

    await page.keyboard.press('ArrowRight')
    await expect(track(page)).toHaveAttribute('data-current-index', '1')
    await expect.poll(() => offCentre(page, 1)).toBeLessThanOrEqual(2)
    // The index must survive the scroll events that follow the animation
    await page.waitForTimeout(800)
    await expect(track(page)).toHaveAttribute('data-current-index', '1')

    await page.keyboard.press('ArrowLeft')
    await expect(track(page)).toHaveAttribute('data-current-index', '0')
    await expect.poll(() => track(page).evaluate((el) => el.scrollLeft)).toBe(0)
    await page.waitForTimeout(800)
    await expect(track(page)).toHaveAttribute('data-current-index', '0')
  })

  test('last image ends at the right margin', async ({ page }) => {
    await openHome(page)
    const count = await track(page).locator('> a').count()
    const logo = await page.locator('.header__logo').boundingBox()
    const width = page.viewportSize()?.width ?? 0

    for (let i = 1; i < count; i++) {
      await page.keyboard.press('ArrowRight')
      await expect(track(page)).toHaveAttribute('data-current-index', String(i))
    }

    await expect
      .poll(async () => {
        const box = await item(page, count - 1)
          .locator('img')
          .boundingBox()
        return Math.round(width - ((box?.x ?? 0) + (box?.width ?? 0)))
      })
      .toBe(Math.round(logo?.x ?? -1))
    await page.waitForTimeout(800)
    await expect(track(page)).toHaveAttribute(
      'data-current-index',
      String(count - 1)
    )
  })
})
