// ABOUTME: Page object for homepage gallery interactions and navigation
import { Page, Locator } from '@playwright/test'

/**
 * Home Page Object Model
 * Encapsulates homepage/gallery interactions
 */
export class HomePage {
  readonly page: Page
  readonly header: Locator

  constructor(page: Page) {
    this.page = page
    this.header = page.locator('header')
  }

  // Viewport-aware: scoped to visible gallery (both galleries in SSR DOM after Issue #348)
  get projectCards(): Locator {
    const viewport = this.page.viewportSize()
    const galleryTestId = !viewport || viewport.width < 768 ? 'mobile-gallery' : 'desktop-gallery'
    return this.page.locator(`[data-testid="${galleryTestId}"] [data-testid^="gallery-item-"]`)
  }

  get firstProject(): Locator {
    return this.projectCards.first()
  }

  /**
   * Navigate to homepage
   */
  async goto() {
    await this.page.goto('/')
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * Click on a project card by index
   */
  async clickProject(index: number = 0) {
    await this.projectCards.nth(index).click()
  }

  /**
   * Wait for gallery to load
   */
  async waitForGallery() {
    await this.projectCards.first().waitFor({ state: 'visible' })
  }

  /**
   * Get count of visible project cards
   */
  async getProjectCount(): Promise<number> {
    return await this.projectCards.count()
  }
}
