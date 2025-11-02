// ABOUTME: Page object for project detail page interactions and navigation
import { Page, Locator } from '@playwright/test'

/**
 * Project Page Object Model
 * Encapsulates project detail page interactions
 */
export class ProjectPage {
  readonly page: Page
  readonly projectTitle: Locator
  readonly projectImages: Locator
  readonly nextButton: Locator
  readonly previousButton: Locator
  readonly backButton: Locator

  constructor(page: Page) {
    this.page = page
    // Project title uses class desktop-project-title in h1
    this.projectTitle = page.locator('h1.desktop-project-title, h1')
    // Project images - will match any img in project view
    this.projectImages = page.locator(
      '.desktop-project-view img, .mobile-project-view img, main img'
    )
    // Navigation buttons use specific classes
    this.nextButton = page.locator('.desktop-nav-next, .mobile-nav-next')
    this.previousButton = page.locator(
      '.desktop-nav-previous, .mobile-nav-previous'
    )
    this.backButton = page.locator('.desktop-nav-back, .mobile-nav-back')
  }

  /**
   * Navigate to project by slug
   */
  async goto(slug: string) {
    await this.page.goto(`/projects/${slug}`)
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * Click next project button
   */
  async clickNext() {
    await this.nextButton.click()
  }

  /**
   * Click previous project button
   */
  async clickPrevious() {
    await this.previousButton.click()
  }

  /**
   * Click back/home button
   */
  async clickBack() {
    await this.backButton.click()
  }

  /**
   * Get project title text
   */
  async getTitle(): Promise<string> {
    return await this.projectTitle.textContent().then((text) => text || '')
  }

  /**
   * Wait for project to load
   */
  async waitForProject() {
    await this.projectTitle.waitFor({ state: 'visible' })
  }

  /**
   * Get count of project images
   */
  async getImageCount(): Promise<number> {
    return await this.projectImages.count()
  }
}
