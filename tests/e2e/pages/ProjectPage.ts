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
    // Project images - match all images in project view main area
    // Using main img to catch both desktop and mobile views reliably
    this.projectImages = page.locator('main img')
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
    // First wait for navigation/network to settle
    await this.page.waitForLoadState('networkidle', { timeout: 10000 })
    // Wait for loading indicator to disappear (if it was shown)
    await this.page.waitForFunction(
      () => !document.body.textContent?.includes('Loading project'),
      { timeout: 10000 }
    )
    // Then wait for project title
    await this.projectTitle.waitFor({ state: 'visible' })
    // Give components time to render
    await this.page.waitForTimeout(1000)
  }

  /**
   * Wait for project images to be present in DOM
   */
  async waitForImages() {
    // Wait for at least one image to be present
    await this.projectImages.first().waitFor({ state: 'attached', timeout: 10000 })
  }

  /**
   * Get count of project images
   */
  async getImageCount(): Promise<number> {
    // Wait a moment for images to be in DOM after component renders
    await this.page.waitForTimeout(500)
    return await this.projectImages.count()
  }
}
