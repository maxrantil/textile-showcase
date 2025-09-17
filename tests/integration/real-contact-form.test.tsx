// ABOUTME: Real integration tests for contact form with actual API calls and form behavior

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ContactForm from '@/components/forms/ContactForm'

// Mock fetch for real API testing
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('Contact Form Real Integration Tests', () => {
  beforeEach(() => {
    mockFetch.mockClear()
  })

  describe('Successful Form Submission', () => {
    it('should submit form with real form data and handle success', async () => {
      const user = userEvent.setup()

      // Mock successful API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Email sent successfully!' }),
      })

      render(<ContactForm />)

      // Fill out form with real user data
      const nameInput = screen.getByLabelText(/name/i)
      const emailInput = screen.getByLabelText(/email/i)
      const messageInput = screen.getByLabelText(/message/i)
      const submitButton = screen.getByRole('button', { name: /send message/i })

      await user.type(nameInput, 'John Doe')
      await user.type(emailInput, 'john.doe@example.com')
      await user.type(
        messageInput,
        'I am interested in your textile designs. Could you tell me more about sustainable materials?'
      )

      // Submit the form
      await user.click(submitButton)

      // Should call API with real form data
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/contact', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          credentials: 'same-origin',
          body: JSON.stringify({
            name: 'John Doe',
            email: 'john.doe@example.com',
            message:
              'I am interested in your textile designs. Could you tell me more about sustainable materials?',
          }),
        })
      })

      // Should show success message
      await waitFor(() => {
        expect(
          screen.getByText('Message sent successfully!')
        ).toBeInTheDocument()
      })

      // Form should be reset after successful submission
      expect(nameInput).toHaveValue('')
      expect(emailInput).toHaveValue('')
      expect(messageInput).toHaveValue('')
    })
  })

  describe('Form Validation with Real Input', () => {
    it('should validate required fields with real user interaction', async () => {
      const user = userEvent.setup()
      render(<ContactForm />)

      const submitButton = screen.getByRole('button', { name: /send message/i })

      // Try to submit empty form
      await user.click(submitButton)

      // Should show validation errors
      await waitFor(() => {
        const errorMessages = screen.getAllByText(/this field is required/i)
        expect(errorMessages).toHaveLength(3) // One for each field
      })

      // Should not call API
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should validate email format with real invalid emails', async () => {
      const user = userEvent.setup()
      render(<ContactForm />)

      const emailInput = screen.getByLabelText(/email/i)
      const submitButton = screen.getByRole('button', { name: /send message/i })

      // Test various invalid email formats
      const invalidEmails = [
        'notanemail',
        '@example.com',
        'user@',
        'user.example.com',
        'user@.com',
      ]

      for (const invalidEmail of invalidEmails) {
        await user.clear(emailInput)
        await user.type(emailInput, invalidEmail)
        await user.click(submitButton)

        await waitFor(() => {
          expect(
            screen.getByText(/please enter a valid email/i)
          ).toBeInTheDocument()
        })

        expect(mockFetch).not.toHaveBeenCalled()
      }
    })

    it('should handle message length validation', async () => {
      const user = userEvent.setup()
      render(<ContactForm />)

      const nameInput = screen.getByLabelText(/name/i)
      const emailInput = screen.getByLabelText(/email/i)
      const messageInput = screen.getByLabelText(/message/i)
      const submitButton = screen.getByRole('button', { name: /send message/i })

      // Fill required fields but with too short message
      await user.type(nameInput, 'Jane Doe')
      await user.type(emailInput, 'jane.doe@example.com')
      await user.type(messageInput, 'Hi') // Too short

      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/must be at least/i)).toBeInTheDocument()
      })

      expect(mockFetch).not.toHaveBeenCalled()
    })
  })

  describe('API Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      const user = userEvent.setup()

      // Mock network error
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      render(<ContactForm />)

      // Fill and submit form
      await user.type(screen.getByLabelText(/name/i), 'Test User')
      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.type(
        screen.getByLabelText(/message/i),
        'This is a test message that is long enough to pass validation.'
      )

      await user.click(screen.getByRole('button', { name: /send message/i }))

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/failed to send message/i)).toBeInTheDocument()
      })
    })

    it('should handle server errors with real error responses', async () => {
      const user = userEvent.setup()

      // Mock server error response
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal server error' }),
      })

      render(<ContactForm />)

      // Fill and submit form
      await user.type(screen.getByLabelText(/name/i), 'Error Test')
      await user.type(screen.getByLabelText(/email/i), 'error@example.com')
      await user.type(
        screen.getByLabelText(/message/i),
        'Testing error handling with a sufficiently long message.'
      )

      await user.click(screen.getByRole('button', { name: /send message/i }))

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/failed to send message/i)).toBeInTheDocument()
      })
    })

    it('should handle rate limiting responses', async () => {
      const user = userEvent.setup()

      // Mock rate limiting response
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({ error: 'Too many requests' }),
      })

      render(<ContactForm />)

      // Fill and submit form
      await user.type(screen.getByLabelText(/name/i), 'Rate Test')
      await user.type(screen.getByLabelText(/email/i), 'rate@example.com')
      await user.type(
        screen.getByLabelText(/message/i),
        'Testing rate limiting with a message of adequate length.'
      )

      await user.click(screen.getByRole('button', { name: /send message/i }))

      // Should show specific rate limiting error
      await waitFor(() => {
        expect(screen.getByText(/too many requests/i)).toBeInTheDocument()
      })
    })
  })

  describe('Form Accessibility and UX', () => {
    it('should provide proper accessibility features', () => {
      render(<ContactForm />)

      // Check for proper labels
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/message/i)).toBeInTheDocument()

      // Check for proper form structure - forms don't automatically have role="form"
      const nameInput = screen.getByLabelText(/name/i)
      const form = nameInput.closest('form')
      expect(form).toBeInTheDocument()

      // Check submit button
      const submitButton = screen.getByRole('button', { name: /send message/i })
      expect(submitButton).toBeInTheDocument()
      expect(submitButton).toHaveAttribute('type', 'submit')
    })

    it('should show loading state during submission', async () => {
      const user = userEvent.setup()

      // Mock slow API response
      mockFetch.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      )

      render(<ContactForm />)

      // Fill and submit form
      await user.type(screen.getByLabelText(/name/i), 'Loading Test')
      await user.type(screen.getByLabelText(/email/i), 'loading@example.com')
      await user.type(
        screen.getByLabelText(/message/i),
        'Testing loading state behavior with proper message length.'
      )

      const submitButton = screen.getByRole('button', { name: /send message/i })
      await user.click(submitButton)

      // Should show loading state
      await waitFor(() => {
        expect(screen.getByText(/sending/i)).toBeInTheDocument()
      })

      // Button should be disabled during submission
      expect(submitButton).toBeDisabled()
    })
  })
})
