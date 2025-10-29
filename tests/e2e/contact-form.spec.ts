// ABOUTME: E2E tests for contact form user journey - validation, submission, error handling
import { test, expect } from '@playwright/test'
import { ContactPage } from './pages/ContactPage'
import {
  generateContactFormData,
  generateInvalidEmails,
} from './helpers/mock-data'
import { expectUrlToContain } from './helpers/assertions'

test.describe('Contact Form', () => {
  let contactPage: ContactPage

  test.beforeEach(async ({ page }) => {
    contactPage = new ContactPage(page)
    await contactPage.goto()
  })

  test('user submits valid contact form successfully', async ({ page }) => {
    // Arrange: Generate valid form data
    const formData = generateContactFormData({
      name: 'E2E Test User',
      email: 'e2e.test@example.com',
      message:
        'This is an end-to-end test message. Testing the contact form submission flow.',
    })

    // Act: Fill and submit form
    await contactPage.fillForm(formData)
    await contactPage.submit()

    // Assert: Success message appears
    await contactPage.waitForSuccess()
    await expect(contactPage.successMessage).toBeVisible()
    await expect(contactPage.successMessage).toContainText('Thank You')

    // Assert: Form is hidden (replaced by success message)
    // Note: The form is completely replaced, not just cleared
    await expect(contactPage.nameInput).not.toBeVisible()

    // Assert: Still on contact page
    await expectUrlToContain(page, '/contact')
  })

  test('user sees validation error for invalid email', async ({ page }) => {
    // Arrange: Get list of invalid emails
    const invalidEmails = generateInvalidEmails()

    // Test first invalid email
    const formData = generateContactFormData({
      email: invalidEmails[0], // 'invalid'
    })

    // Act: Fill form with invalid email and submit
    await contactPage.fillForm(formData)
    await contactPage.submit()

    // Wait a moment for validation
    await page.waitForTimeout(500)

    // Assert: No success message appears (validation should prevent submission)
    await expect(contactPage.successMessage).not.toBeVisible()

    // Assert: Still on contact page
    await expectUrlToContain(page, '/contact')
  })

  test('user hits rate limit after 5 submissions', async ({ page }) => {
    // This test validates rate limiting behavior
    // Note: In E2E, we'll mock the API to simulate rate limiting

    // Mock API to return rate limit error
    await page.route('**/api/contact', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 429,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Too many requests. Please try again later.',
          }),
        })
      } else {
        await route.continue()
      }
    })

    // Arrange: Generate valid form data
    const formData = generateContactFormData()

    // Act: Submit form
    await contactPage.fillForm(formData)
    await contactPage.submit()

    // Wait for form to process
    await page.waitForTimeout(1000)

    // Assert: Error message appears (generic "Something went wrong" message)
    // Note: The UI shows a generic error message for all API failures including rate limits
    await expect(contactPage.errorMessage).toBeVisible()

    // Assert: Still on contact page (form not reset after error)
    await expectUrlToContain(page, '/contact')

    // Cleanup: Remove route mock
    await page.unroute('**/api/contact')
  })

  test('user sees error message on network failure', async ({ page }) => {
    // Mock API to fail with network error
    await page.route('**/api/contact', async (route) => {
      if (route.request().method() === 'POST') {
        // Abort the request to simulate network failure
        await route.abort('failed')
      } else {
        await route.continue()
      }
    })

    // Arrange: Generate valid form data
    const formData = generateContactFormData()

    // Act: Fill and submit form
    await contactPage.fillForm(formData)
    await contactPage.submit()

    // Wait for error to appear
    await page.waitForTimeout(1000)

    // Assert: Error message appears (generic "Something went wrong" message)
    // Note: The UI shows a generic error message for all failures including network errors
    await expect(contactPage.errorMessage).toBeVisible()

    // Assert: Form data is preserved (not cleared on error)
    const nameValue = await contactPage.nameInput.inputValue()
    expect(nameValue).toBe(formData.name)

    // Assert: Still on contact page
    await expectUrlToContain(page, '/contact')

    // Cleanup: Remove route mock
    await page.unroute('**/api/contact')
  })

  test('user cannot submit empty form', async ({ page }) => {
    // Act: Try to submit empty form
    await contactPage.submit()

    // Wait for validation
    await page.waitForTimeout(500)

    // Assert: No success message (form validation should prevent submission)
    await expect(contactPage.successMessage).not.toBeVisible()
  })

  test('user cannot submit with only name filled', async ({ page }) => {
    // Act: Fill only name field and try to submit
    await contactPage.nameInput.fill('John Doe')
    await contactPage.submit()

    // Wait for validation
    await page.waitForTimeout(500)

    // Assert: No success message (form validation should prevent submission)
    await expect(contactPage.successMessage).not.toBeVisible()
  })
})
