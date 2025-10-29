// ABOUTME: Page object for mobile menu interactions and navigation
import { Page, Locator } from '@playwright/test'

/**
 * Mobile Menu Page Object Model
 * Encapsulates mobile navigation menu interactions
 */
export class MobileMenu {
  readonly page: Page
  readonly hamburgerButton: Locator
  readonly menuContainer: Locator
  readonly menuLinks: Locator
  readonly contactLink: Locator
  readonly homeLink: Locator

  constructor(page: Page) {
    this.page = page
    this.hamburgerButton = page.locator(
      '[aria-label*="menu"], button.hamburger, .menu-toggle'
    )
    this.menuContainer = page.locator('.mobile-menu, [role="dialog"]')
    this.menuLinks = this.menuContainer.locator('a')
    this.contactLink = this.menuContainer.locator('a[href="/contact"]')
    this.homeLink = this.menuContainer.locator('a[href="/"]')
  }

  /**
   * Open mobile menu
   */
  async open() {
    await this.hamburgerButton.click()
    await this.menuContainer.waitFor({ state: 'visible' })
  }

  /**
   * Close mobile menu
   */
  async close() {
    await this.hamburgerButton.click()
    await this.menuContainer.waitFor({ state: 'hidden' })
  }

  /**
   * Check if menu is open
   */
  async isOpen(): Promise<boolean> {
    return await this.menuContainer.isVisible()
  }

  /**
   * Click on a menu link by text
   */
  async clickLink(text: string) {
    await this.menuLinks.filter({ hasText: text }).click()
  }

  /**
   * Navigate to contact via menu
   */
  async goToContact() {
    await this.open()
    await this.contactLink.click()
  }

  /**
   * Navigate to home via menu
   */
  async goToHome() {
    await this.open()
    await this.homeLink.click()
  }
}
