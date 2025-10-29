// ABOUTME: Page object for homepage gallery interactions and navigation
import { Page, Locator } from '@playwright/test'

/**
 * Home Page Object Model
 * Encapsulates homepage/gallery interactions
 */
export class HomePage {
  readonly page: Page
  readonly header: Locator
  readonly projectCards: Locator
  readonly firstProject: Locator

  constructor(page: Page) {
    this.page = page
    this.header = page.locator('header')
    // Gallery items use data-testid="gallery-item-0", "gallery-item-1", etc.
    this.projectCards = page.locator('[data-testid^="gallery-item-"]')
    this.firstProject = this.projectCards.first()
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
