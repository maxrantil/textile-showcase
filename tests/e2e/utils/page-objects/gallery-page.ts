// ABOUTME: Page Object Model for gallery interactions and navigation testing
import { Page, Locator, expect } from '@playwright/test'

export class GalleryPage {
  readonly page: Page
  readonly galleryContainer: Locator
  readonly galleryItems: Locator
  readonly activeItem: Locator
  readonly navigationArrows: Locator
  readonly loadingSpinner: Locator

  constructor(page: Page) {
    this.page = page
    // Accept either desktop or mobile gallery container
    this.galleryContainer = page.locator('[data-testid="desktop-gallery"], [data-testid="mobile-gallery"]')
    this.galleryItems = page.locator('[data-testid^="gallery-item-"]')
    this.activeItem = page.locator('[data-active="true"]')
    this.navigationArrows = page.locator('[data-testid="navigation-arrows"]')
    this.loadingSpinner = page.locator('[data-testid="loading-spinner"]')
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

    await this.page.keyboard.press('ArrowRight')

    // Wait for the active item index to actually change
    await this.page.waitForFunction(
      (expectedNewIndex) => {
        const activeElement = document.querySelector('[data-active="true"]')
        if (!activeElement) return false

        const testId = activeElement.getAttribute('data-testid')
        if (!testId || !testId.startsWith('gallery-item-')) return false

        const currentIndex = parseInt(testId.replace('gallery-item-', ''), 10)
        return currentIndex === expectedNewIndex
      },
      initialIndex + 1,
      { timeout: 2000 }
    )

    // Additional buffer for focus management to complete (gallery delays 600ms)
    await this.page.waitForTimeout(700)
  }

  async navigateLeft() {
    // Get the current active item's index before navigation
    const initialIndex = await this.getActiveItemIndex()

    await this.page.keyboard.press('ArrowLeft')

    // Wait for the active item index to actually change
    await this.page.waitForFunction(
      (expectedNewIndex) => {
        const activeElement = document.querySelector('[data-active="true"]')
        if (!activeElement) return false

        const testId = activeElement.getAttribute('data-testid')
        if (!testId || !testId.startsWith('gallery-item-')) return false

        const currentIndex = parseInt(testId.replace('gallery-item-', ''), 10)
        return currentIndex === expectedNewIndex
      },
      initialIndex - 1,
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
    const activeItems = await this.page.locator('[data-active="true"]').all()
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
