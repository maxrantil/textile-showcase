// ABOUTME: Page object for contact form interactions and assertions
import { Page, Locator } from '@playwright/test'

/**
 * Contact Page Object Model
 * Encapsulates contact form interactions and validations
 */
export class ContactPage {
  readonly page: Page

  // Form fields
  readonly nameInput: Locator
  readonly emailInput: Locator
  readonly messageTextarea: Locator
  readonly submitButton: Locator

  // Status messages
  readonly successMessage: Locator
  readonly errorMessage: Locator

  // Field errors
  readonly nameError: Locator
  readonly emailError: Locator
  readonly messageError: Locator

  constructor(page: Page) {
    this.page = page

    // Form fields (using id attribute from DesktopFormField/MobileFormField)
    this.nameInput = page.locator('#field-name, input[id="field-name"]')
    this.emailInput = page.locator('#field-email, input[id="field-email"]')
    this.messageTextarea = page.locator(
      '#field-message, textarea[id="field-message"]'
    )
    this.submitButton = page.locator(
      'button[type="submit"], button:has-text("SEND MESSAGE")'
    )

    // Status messages (be specific to avoid matching textarea content)
    this.successMessage = page.locator('h3.nordic-h3:has-text("Thank You")')
    this.errorMessage = page.locator(
      'p.nordic-body:has-text("Something went wrong")'
    )

    // Field errors (look for error spans)
    this.nameError = page
      .locator('.desktop-form-error, .mobile-form-error')
      .first()
    this.emailError = page
      .locator('.desktop-form-error, .mobile-form-error')
      .nth(1)
    this.messageError = page
      .locator('.desktop-form-error, .mobile-form-error')
      .nth(2)
  }

  /**
   * Navigate to contact page
   */
  async goto() {
    await this.page.goto('/contact')
    await this.page.waitForLoadState('networkidle')
    // Wait for form fields to be visible (ensures React has hydrated)
    await this.nameInput.waitFor({ state: 'visible', timeout: 10000 })
  }

  /**
   * Fill contact form with data
   */
  async fillForm(data: { name: string; email: string; message: string }) {
    await this.nameInput.fill(data.name)
    await this.emailInput.fill(data.email)
    await this.messageTextarea.fill(data.message)
  }

  /**
   * Submit the contact form
   */
  async submit() {
    await this.submitButton.click()
  }

  /**
   * Fill and submit form in one action
   */
  async fillAndSubmit(data: { name: string; email: string; message: string }) {
    await this.fillForm(data)
    await this.submit()
  }

  /**
   * Wait for success message to appear
   */
  async waitForSuccess() {
    await this.successMessage.waitFor({ state: 'visible' })
  }

  /**
   * Wait for error message to appear
   */
  async waitForError() {
    await this.errorMessage.waitFor({ state: 'visible' })
  }

  /**
   * Check if submit button is disabled
   */
  async isSubmitDisabled(): Promise<boolean> {
    return await this.submitButton.isDisabled()
  }

  /**
   * Get field error message
   */
  async getFieldError(field: 'name' | 'email' | 'message'): Promise<string> {
    const errorLocator =
      field === 'name'
        ? this.nameError
        : field === 'email'
          ? this.emailError
          : this.messageError
    return await errorLocator.textContent().then((text) => text || '')
  }

  /**
   * Check if form is cleared (all fields empty)
   */
  async isFormCleared(): Promise<boolean> {
    const nameValue = await this.nameInput.inputValue()
    const emailValue = await this.emailInput.inputValue()
    const messageValue = await this.messageTextarea.inputValue()

    return nameValue === '' && emailValue === '' && messageValue === ''
  }
}
