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
    this.galleryContainer = page.locator('[data-testid="gallery-container"]')
    this.galleryItems = page.locator('[data-testid="gallery-item"]')
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

    // Wait for at least one gallery item to load
    await this.galleryItems.first().waitFor({ state: 'visible' })

    // Wait for loading spinner to disappear if present
    try {
      await this.loadingSpinner.waitFor({ state: 'hidden', timeout: 5000 })
    } catch {
      // Loading spinner might not exist, continue
    }
  }

  async getGalleryItemCount(): Promise<number> {
    return await this.galleryItems.count()
  }

  async navigateRight() {
    await this.page.keyboard.press('ArrowRight')
    // Small delay to allow for smooth animation
    await this.page.waitForTimeout(300)
  }

  async navigateLeft() {
    await this.page.keyboard.press('ArrowLeft')
    await this.page.waitForTimeout(300)
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
