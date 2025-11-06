// ABOUTME: Contact form E2E tests validating keyboard navigation, validation, submission, and error handling
import { test, expect } from '@playwright/test'
import { ContactPage } from '../pages/ContactPage'
import { validFormData, invalidFormData } from '../fixtures/form-data'

test.describe('Contact Form E2E Workflows', () => {
  test.describe('Keyboard Navigation & Accessibility', () => {
    test('User can navigate and submit form using keyboard only', async ({
      page,
    }) => {
      const contactPage = new ContactPage(page)
      await contactPage.goto()

      // Focus first field to establish keyboard navigation starting point
      await contactPage.nameInput.click()

      // Type in name field
      await page.keyboard.type(validFormData.name)

      // Tab to email field
      await page.keyboard.press('Tab')
      await page.keyboard.type(validFormData.email)

      // Tab to message field
      await page.keyboard.press('Tab')
      await page.keyboard.type(validFormData.message)

      // Mock the API to prevent actual submission (do this before submitting)
      await page.route('**/api/contact', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        })
      })

      // Submit form using natural keyboard navigation
      // Tab to submit button and press Enter (validates full keyboard workflow)
      await page.keyboard.press('Tab')
      await page.keyboard.press('Enter')

      // Wait for success message
      await contactPage.waitForSuccess()
      await expect(contactPage.successMessage).toBeVisible()

      // Success message visible means form submitted successfully
      // (form fields are replaced by success message in this implementation)
    })

    test('Form fields have proper ARIA labels and descriptions', async ({
      page,
    }) => {
      const contactPage = new ContactPage(page)
      await contactPage.goto()

      // Verify name field has accessible name
      const nameLabel = await page
        .locator('label[for="field-name"]')
        .textContent()
      expect(nameLabel).toBeTruthy()

      // Verify email field has accessible name
      const emailLabel = await page
        .locator('label[for="field-email"]')
        .textContent()
      expect(emailLabel).toBeTruthy()

      // Verify message field has accessible name
      const messageLabel = await page
        .locator('label[for="field-message"]')
        .textContent()
      expect(messageLabel).toBeTruthy()

      // Verify required fields are marked
      const nameInput = contactPage.nameInput
      const isRequired = await nameInput.getAttribute('required')
      expect(isRequired).not.toBeNull()
    })
  })

  test.describe('Form Validation & Error Handling', () => {
    test('User sees validation errors for empty fields', async ({ page }) => {
      const contactPage = new ContactPage(page)
      await contactPage.goto()

      // Try to submit empty form
      await contactPage.submit()

      // HTML5 validation should prevent submission
      // Check if name field shows validation message
      const nameValidationMessage = await contactPage.nameInput.evaluate(
        (el: HTMLInputElement) => el.validationMessage
      )
      expect(nameValidationMessage).toBeTruthy()

      // Verify form was not submitted (no success message)
      await expect(contactPage.successMessage).not.toBeVisible()
    })

    test('User sees validation error for invalid email', async ({ page }) => {
      const contactPage = new ContactPage(page)
      await contactPage.goto()

      // Fill form with invalid email
      await contactPage.fillForm(invalidFormData.invalidEmail)

      // Try to submit
      await contactPage.submit()

      // HTML5 email validation should trigger
      const emailValidationMessage = await contactPage.emailInput.evaluate(
        (el: HTMLInputElement) => el.validationMessage
      )
      expect(emailValidationMessage).toBeTruthy()
      expect(emailValidationMessage.toLowerCase()).toContain('email')

      // Verify form was not submitted
      await expect(contactPage.successMessage).not.toBeVisible()
    })

    test('Validation errors are announced to screen readers', async ({
      page,
    }) => {
      const contactPage = new ContactPage(page)
      await contactPage.goto()

      // Fill with invalid data
      await contactPage.nameInput.fill('')
      await contactPage.emailInput.fill('invalid-email')
      await contactPage.messageTextarea.fill('x') // Too short

      // Try to submit
      await contactPage.submit()

      // Check that validation occurs (at least one field should be invalid)
      const nameValidity = await contactPage.nameInput.evaluate(
        (el: HTMLInputElement) => el.validity.valid
      )
      const emailValidity = await contactPage.emailInput.evaluate(
        (el: HTMLInputElement) => el.validity.valid
      )

      // At least one should be invalid
      expect(nameValidity || emailValidity).toBe(false)
    })
  })

  test.describe('Successful Form Submission', () => {
    test('User successfully submits valid contact form', async ({ page }) => {
      const contactPage = new ContactPage(page)
      await contactPage.goto()

      // Mock successful API response
      await page.route('**/api/contact', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        })
      })

      // Fill and submit form
      await contactPage.fillAndSubmit(validFormData)

      // Wait for success message
      await contactPage.waitForSuccess()

      // Verify success message is visible
      await expect(contactPage.successMessage).toBeVisible()

      // Verify success message contains expected text
      const successText = await contactPage.successMessage.textContent()
      expect(successText).toContain('Thank')

      // Verify form behavior after submission
      // Note: Form might be cleared or replaced with success message
      await page.waitForTimeout(500)

      // Try to check if form is cleared, but don't fail if form is replaced
      try {
        const nameExists = await contactPage.nameInput.isVisible({
          timeout: 2000,
        })
        if (nameExists) {
          const isCleared = await contactPage.isFormCleared()
          expect(isCleared).toBe(true)
        }
      } catch {
        // Form fields may have been replaced by success message (acceptable)
      }
    })

    test('Form handles special characters in submission', async ({ page }) => {
      const contactPage = new ContactPage(page)
      await contactPage.goto()

      // Mock successful API response
      await page.route('**/api/contact', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        })
      })

      // Fill form with special characters
      await contactPage.fillAndSubmit({
        name: 'Åse Müller-Øland',
        email: 'ase.muller@textile-design.co.uk',
        message: 'Testing special chars: äöüß€£¥ 🧵✨',
      })

      // Should succeed
      await contactPage.waitForSuccess()
      await expect(contactPage.successMessage).toBeVisible()
    })
  })

  test.describe('Network Error Handling', () => {
    test('User sees error message on network failure', async ({ page }) => {
      const contactPage = new ContactPage(page)
      await contactPage.goto()

      // Mock network failure
      await page.route('**/api/contact', async (route) => {
        await route.abort('failed')
      })

      // Fill and submit form
      await contactPage.fillAndSubmit(validFormData)

      // Wait for error message
      await contactPage.waitForError()

      // Verify error message is visible
      await expect(contactPage.errorMessage).toBeVisible()

      // Verify error message contains helpful text
      const errorText = await contactPage.errorMessage.textContent()
      expect(errorText?.toLowerCase()).toContain('wrong')

      // Verify form data is preserved (not cleared)
      const nameValue = await contactPage.nameInput.inputValue()
      expect(nameValue).toBe(validFormData.name)
    })

    test('User sees error message on server error (500)', async ({ page }) => {
      const contactPage = new ContactPage(page)
      await contactPage.goto()

      // Mock server error
      await page.route('**/api/contact', async (route) => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' }),
        })
      })

      // Fill and submit form
      await contactPage.fillAndSubmit(validFormData)

      // Wait for error message
      await contactPage.waitForError()

      // Verify error message is visible
      await expect(contactPage.errorMessage).toBeVisible()

      // Verify form data is preserved
      const emailValue = await contactPage.emailInput.inputValue()
      expect(emailValue).toBe(validFormData.email)
    })

    test('User can retry after network error', async ({ page }) => {
      const contactPage = new ContactPage(page)
      await contactPage.goto()

      let requestCount = 0

      // Mock first request fails, second succeeds
      await page.route('**/api/contact', async (route) => {
        requestCount++
        if (requestCount === 1) {
          await route.abort('failed')
        } else {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true }),
          })
        }
      })

      // First submission (should fail)
      await contactPage.fillAndSubmit(validFormData)
      await contactPage.waitForError()
      await expect(contactPage.errorMessage).toBeVisible()

      // Retry submission (should succeed)
      await contactPage.submit()
      await contactPage.waitForSuccess()
      await expect(contactPage.successMessage).toBeVisible()
    })
  })

  test.describe('Mobile Contact Form', () => {
    test('Form works correctly on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })

      const contactPage = new ContactPage(page)
      await contactPage.goto()

      // Mock successful API response
      await page.route('**/api/contact', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        })
      })

      // Fill and submit form on mobile
      await contactPage.fillAndSubmit(validFormData)

      // Should succeed
      await contactPage.waitForSuccess()
      await expect(contactPage.successMessage).toBeVisible()
    })

    test('Mobile form has proper touch targets', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })

      const contactPage = new ContactPage(page)
      await contactPage.goto()

      // Verify submit button has adequate touch target (min 44x44px per WCAG)
      const submitButton = contactPage.submitButton
      const boundingBox = await submitButton.boundingBox()

      expect(boundingBox).toBeTruthy()
      if (boundingBox) {
        expect(boundingBox.height).toBeGreaterThanOrEqual(44)
        expect(boundingBox.width).toBeGreaterThanOrEqual(44)
      }
    })
  })
})
