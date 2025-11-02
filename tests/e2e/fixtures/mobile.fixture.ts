// ABOUTME: Mobile-specific test fixture providing viewport helpers and touch gesture utilities
import { test as base, Page } from '@playwright/test'

/**
 * Mobile helper utilities for touch gestures and viewport management
 */
export interface MobileHelpers {
  /**
   * Set viewport to mobile size (375x667)
   */
  setMobileViewport: () => Promise<void>

  /**
   * Set viewport to tablet size (768x1024)
   */
  setTabletViewport: () => Promise<void>

  /**
   * Set viewport to desktop size (1920x1080)
   */
  setDesktopViewport: () => Promise<void>

  /**
   * Simulate swipe gesture
   */
  swipe: (
    page: Page,
    direction: 'left' | 'right' | 'up' | 'down',
    distance?: number
  ) => Promise<void>

  /**
   * Check if viewport is mobile size
   */
  isMobile: (page: Page) => Promise<boolean>
}

/**
 * Mobile fixture with viewport helpers
 */
export const test = base.extend<{ mobile: MobileHelpers }>({
  mobile: async ({ page }, use) => {
    const helpers: MobileHelpers = {
      async setMobileViewport() {
        await page.setViewportSize({ width: 375, height: 667 })
      },

      async setTabletViewport() {
        await page.setViewportSize({ width: 768, height: 1024 })
      },

      async setDesktopViewport() {
        await page.setViewportSize({ width: 1920, height: 1080 })
      },

      async swipe(page, direction, distance = 200) {
        const viewport = page.viewportSize()
        if (!viewport) return

        const startX = viewport.width / 2
        const startY = viewport.height / 2

        let endX = startX
        let endY = startY

        switch (direction) {
          case 'left':
            endX = startX - distance
            break
          case 'right':
            endX = startX + distance
            break
          case 'up':
            endY = startY - distance
            break
          case 'down':
            endY = startY + distance
            break
        }

        await page.touchscreen.tap(startX, startY)
        await page.mouse.move(startX, startY)
        await page.mouse.down()
        await page.mouse.move(endX, endY)
        await page.mouse.up()
      },

      async isMobile(page) {
        const viewport = page.viewportSize()
        return viewport ? viewport.width < 768 : false
      },
    }

    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(helpers)
  },
})

export { expect } from '@playwright/test'
