// ABOUTME: Page Object Model for gallery interactions and navigation testing
import { Page, Locator, expect } from '@playwright/test'

export class GalleryPage {
  readonly page: Page
  readonly navigationArrows: Locator
  readonly loadingSpinner: Locator

  constructor(page: Page) {
    this.page = page
    this.navigationArrows = page.locator('[data-testid="navigation-arrows"]')
    this.loadingSpinner = page.locator('[data-testid="loading-spinner"]')
  }

  // Viewport-aware getter: returns the visible gallery at the current viewport size
  // Both galleries are in the SSR DOM simultaneously; CSS media queries control visibility (Issue #348)
  get galleryContainer(): Locator {
    const viewport = this.page.viewportSize()
    const selector = !viewport || viewport.width < 768
      ? '[data-testid="mobile-gallery"]'
      : '[data-testid="desktop-gallery"]'
    return this.page.locator(selector)
  }

  // Scoped to visible gallery so first() is never a hidden element from the other gallery
  get galleryItems(): Locator {
    return this.galleryContainer.locator('[data-testid^="gallery-item-"]')
  }

  // Scoped to visible gallery to avoid strict mode violation (both galleries have data-active items)
  get activeItem(): Locator {
    return this.galleryContainer.locator('[data-active="true"]')
  }

  async goto() {
    await this.page.goto('/')
    await this.waitForGalleryLoad()
  }

  async waitForGalleryLoad() {
    // Wait for gallery container to be visible
    await this.galleryContainer.waitFor({ state: 'visible' })

    // Wait for gallery loading skeleton to disappear (ensures gallery is fully hydrated)
    try {
      await this.page.waitForSelector('[data-testid="gallery-loading-skeleton"]', {
        state: 'detached',
        timeout: 10000
      })
    } catch {
      // Skeleton might not exist if gallery loads very quickly, continue
    }

    // Wait for at least one gallery item to load
    await this.galleryItems.first().waitFor({ state: 'visible' })
  }

  async getGalleryItemCount(): Promise<number> {
    return await this.galleryItems.count()
  }

  async navigateRight() {
    // Get the current active item's index before navigation
    const initialIndex = await this.getActiveItemIndex()

    // Determine which gallery is visible to scope the active-item check
    const vp = this.page.viewportSize()
    const galleryTestId = !vp || vp.width < 768 ? 'mobile-gallery' : 'desktop-gallery'

    await this.page.keyboard.press('ArrowRight')

    // Wait for the active item index to actually change in the visible gallery
    await this.page.waitForFunction(
      ({ expectedNewIndex, gallery }) => {
        const activeElement = document.querySelector(
          `[data-testid="${gallery}"] [data-active="true"]`
        )
        if (!activeElement) return false

        const testId = activeElement.getAttribute('data-testid')
        if (!testId || !testId.startsWith('gallery-item-')) return false

        const currentIndex = parseInt(testId.replace('gallery-item-', ''), 10)
        return currentIndex === expectedNewIndex
      },
      { expectedNewIndex: initialIndex + 1, gallery: galleryTestId },
      { timeout: 2000 }
    )

    // Additional buffer for focus management to complete (gallery delays 600ms)
    await this.page.waitForTimeout(700)
  }

  async navigateLeft() {
    // Get the current active item's index before navigation
    const initialIndex = await this.getActiveItemIndex()

    // Determine which gallery is visible to scope the active-item check
    const vp = this.page.viewportSize()
    const galleryTestId = !vp || vp.width < 768 ? 'mobile-gallery' : 'desktop-gallery'

    await this.page.keyboard.press('ArrowLeft')

    // Wait for the active item index to actually change in the visible gallery
    await this.page.waitForFunction(
      ({ expectedNewIndex, gallery }) => {
        const activeElement = document.querySelector(
          `[data-testid="${gallery}"] [data-active="true"]`
        )
        if (!activeElement) return false

        const testId = activeElement.getAttribute('data-testid')
        if (!testId || !testId.startsWith('gallery-item-')) return false

        const currentIndex = parseInt(testId.replace('gallery-item-', ''), 10)
        return currentIndex === expectedNewIndex
      },
      { expectedNewIndex: initialIndex - 1, gallery: galleryTestId },
      { timeout: 2000 }
    )

    // Additional buffer for focus management to complete (gallery delays 600ms)
    await this.page.waitForTimeout(700)
  }

  /**
   * Get the index of the currently FOCUSED gallery item
   * More reliable than getActiveItemIndex for testing focus behavior
   */
  async getFocusedItemIndex(): Promise<number> {
    const testId = await this.page.evaluate(() => {
      const focused = document.activeElement
      return focused?.getAttribute('data-testid') || ''
    })

    if (!testId || !testId.startsWith('gallery-item-')) {
      return -1
    }

    return parseInt(testId.replace('gallery-item-', ''), 10)
  }

  /**
   * Wait for focus to change to expected gallery item
   * More reliable than fixed timeouts for focus testing
   */
  async waitForFocusChange(expectedIndex: number, timeout = 2000) {
    await this.page.waitForFunction(
      (expected) => {
        const activeEl = document.activeElement
        const testId = activeEl?.getAttribute('data-testid')
        return testId === `gallery-item-${expected}`
      },
      expectedIndex,
      { timeout }
    )
  }

  async openActiveProject() {
    await this.page.keyboard.press('Enter')
    // Wait for navigation to project page
    await this.page.waitForURL('/project/*')
  }

  async validateGalleryStructure() {
    // Validate basic gallery structure
    await expect(this.galleryContainer).toBeVisible()
    await expect(this.galleryItems.first()).toBeVisible()

    // Validate at least one active item exists
    await expect(this.activeItem).toBeVisible()
  }

  async getActiveItemIndex(): Promise<number> {
    // Use viewport-aware activeItem getter to avoid matching hidden gallery's active items
    const activeItems = await this.activeItem.all()
    if (activeItems.length === 0) return -1

    // Find index of active item within all gallery items
    const activeElement = activeItems[0]
    const allItems = await this.galleryItems.all()

    for (let i = 0; i < allItems.length; i++) {
      if (
        (await activeElement.isVisible()) &&
        (await allItems[i].isVisible())
      ) {
        const activeBox = await activeElement.boundingBox()
        const itemBox = await allItems[i].boundingBox()

        if (
          activeBox &&
          itemBox &&
          Math.abs(activeBox.x - itemBox.x) < 10 &&
          Math.abs(activeBox.y - itemBox.y) < 10
        ) {
          return i
        }
      }
    }

    return -1
  }
}
