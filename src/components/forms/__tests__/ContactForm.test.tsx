import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import ContactForm from '../ContactForm'

// Mock the fetch API
global.fetch = jest.fn()

describe('ContactForm Component', () => {
  beforeEach(() => {
    ;(global.fetch as jest.Mock).mockClear()
    // Suppress console.error for tests where we expect errors
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    // Restore console.error
    ;(console.error as jest.Mock).mockRestore()
  })

  it('renders all form fields', () => {
    render(<ContactForm />)

    expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/message/i)).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /send message/i })
    ).toBeInTheDocument()
  })

  it('shows validation errors for empty fields', async () => {
    render(<ContactForm />)

    const submitButton = screen.getByRole('button', { name: /send message/i })

    // Try to submit empty form
    fireEvent.click(submitButton)

    // Wait for all validation errors to appear
    // Use getAllByText since there are multiple elements with this text
    const errors = await screen.findAllByText(/this field is required/i)

    // Should have 3 errors (one for each required field)
    expect(errors).toHaveLength(3)

    // Verify each field has its specific error
    expect(screen.getByLabelText(/name/i)).toHaveAttribute(
      'aria-invalid',
      'true'
    )
    expect(screen.getByLabelText(/email/i)).toHaveAttribute(
      'aria-invalid',
      'true'
    )
    expect(screen.getByLabelText(/message/i)).toHaveAttribute(
      'aria-invalid',
      'true'
    )

    // Button should be disabled
    expect(submitButton).toBeDisabled()
  })

  it('shows email validation error for invalid email', async () => {
    render(<ContactForm />)

    const emailInput = screen.getByLabelText(/email/i)
    const nameInput = screen.getByLabelText(/name/i)
    const messageInput = screen.getByLabelText(/message/i)

    // Fill in valid name and message
    fireEvent.change(nameInput, { target: { value: 'John Doe' } })
    fireEvent.change(messageInput, { target: { value: 'Test message' } })

    // Enter invalid email
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
    fireEvent.blur(emailInput)

    // Wait for email validation error
    const emailError = await screen.findByText(
      /please enter a valid email address/i
    )
    expect(emailError).toBeInTheDocument()

    // Email field should be marked as invalid
    expect(emailInput).toHaveAttribute('aria-invalid', 'true')
  })

  it('successfully submits form with valid data', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    })

    render(<ContactForm />)

    // Fill in all fields
    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'John Doe' },
    })
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'john@example.com' },
    })
    fireEvent.change(screen.getByLabelText(/message/i), {
      target: { value: 'This is a test message' },
    })

    const submitButton = screen.getByRole('button', { name: /send message/i })

    // Submit form
    fireEvent.click(submitButton)

    // Wait for the success message
    await waitFor(() => {
      expect(screen.getByText(/message sent successfully/i)).toBeInTheDocument()
    })

    // Verify API was called with correct data
    expect(global.fetch).toHaveBeenCalledWith('/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'John Doe',
        email: 'john@example.com',
        message: 'This is a test message',
      }),
    })

    // Form should be reset
    expect(screen.getByLabelText(/name/i)).toHaveValue('')
    expect(screen.getByLabelText(/email/i)).toHaveValue('')
    expect(screen.getByLabelText(/message/i)).toHaveValue('')
  })

  it('shows error message when submission fails', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error('Network error')
    )

    render(<ContactForm />)

    // Fill in all fields
    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'John Doe' },
    })
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'john@example.com' },
    })
    fireEvent.change(screen.getByLabelText(/message/i), {
      target: { value: 'This is a test message' },
    })

    const submitButton = screen.getByRole('button', { name: /send message/i })

    // Submit form
    fireEvent.click(submitButton)

    // Wait for error message - check for the actual error message structure
    await waitFor(() => {
      // Check for the error title
      expect(screen.getByText(/failed to send message/i)).toBeInTheDocument()
      // Check for the error message
      expect(
        screen.getByText(
          /network error. please check your connection and try again./i
        )
      ).toBeInTheDocument()
      // Check for the retry button
      expect(
        screen.getByRole('button', { name: /try again/i })
      ).toBeInTheDocument()
    })
  })

  it('disables submit button while form is submitting', async () => {
    // Mock a slow response
    ;(global.fetch as jest.Mock).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: async () => ({ success: true }),
              }),
            100
          )
        )
    )

    render(<ContactForm />)

    // Fill in all fields
    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'John Doe' },
    })
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'john@example.com' },
    })
    fireEvent.change(screen.getByLabelText(/message/i), {
      target: { value: 'This is a test message' },
    })

    const submitButton = screen.getByRole('button', { name: /send message/i })

    // Submit form
    fireEvent.click(submitButton)

    // Button should show loading state
    expect(
      screen.getByRole('button', { name: /sending.../i })
    ).toBeInTheDocument()
    expect(submitButton).toBeDisabled()

    // Wait for submission to complete
    await waitFor(() => {
      expect(screen.getByText(/message sent successfully/i)).toBeInTheDocument()
    })
  })
})
