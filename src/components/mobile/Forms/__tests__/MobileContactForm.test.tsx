// ABOUTME: Comprehensive test suite for MobileContactForm - form validation, API integration, analytics

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MobileContactForm } from '../MobileContactForm'
import { mockValidFormData } from '../../../../../tests/fixtures/forms'
import {
  submitForm,
  mockSuccessfulSubmission,
  mockFailedSubmission,
  mockNetworkError,
} from '../../../../../tests/utils/form-helpers'
import { UmamiEvents } from '@/utils/analytics'
import { useVirtualKeyboard } from '@/hooks/mobile/useVirtualKeyboard'

// Mock dependencies
jest.mock('@/utils/validation/formValidator')
jest.mock('@/hooks/mobile/useVirtualKeyboard', () => ({
  useVirtualKeyboard: jest.fn(() => ({ isKeyboardOpen: false })),
}))

jest.mock('@/utils/analytics', () => ({
  UmamiEvents: {
    contactFormSubmit: jest.fn(),
    contactFormSuccess: jest.fn(),
    contactFormError: jest.fn(),
  },
}))

jest.mock('@/utils/validation/validators', () => ({
  commonValidationRules: {
    name: jest.fn(),
    email: jest.fn(),
    message: jest.fn(),
  },
}))

jest.mock('../MobileFormField', () => ({
  MobileFormField: ({
    label,
    value,
    onChange,
    error,
    required,
    placeholder,
    type,
  }: {
    label: string
    value: string
    onChange: (value: string) => void
    error?: string
    required?: boolean
    placeholder?: string
    type?: string
  }) => (
    <div className="mobile-form-field">
      <label htmlFor={`field-${label.toLowerCase()}`}>
        {label}
        {required && <span className="text-required"> *</span>}
      </label>
      {type === 'textarea' ? (
        <textarea
          id={`field-${label.toLowerCase()}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      ) : (
        <input
          id={`field-${label.toLowerCase()}`}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      )}
      {error && <span role="alert">{error}</span>}
    </div>
  ),
}))

jest.mock('../../UI/MobileButton', () => ({
  MobileButton: ({
    children,
    disabled,
    loading,
    onClick,
    type,
  }: {
    children: React.ReactNode
    disabled?: boolean
    loading?: boolean
    onClick?: () => void
    type?: 'button' | 'submit' | 'reset'
  }) => (
    <button type={type} disabled={disabled || loading} onClick={onClick}>
      {loading ? 'Sending...' : children}
    </button>
  ),
}))

// Helper function to setup validator that always returns valid
const setupValidFormValidator = () => {
  const { FormValidator } = jest.requireMock('@/utils/validation/formValidator')
  FormValidator.mockImplementation(() => ({
    rules: {},
    errors: {},
    isValid: true,
    validateField: jest.fn(() => ({ error: undefined })),
    validateForm: jest.fn(() => ({ isValid: true, errors: {} })),
    isFormValid: jest.fn(() => true),
    getErrors: jest.fn(() => ({})),
    clearErrors: jest.fn(),
  }))
}

// Helper function to setup default validator with validation logic
const setupDefaultFormValidator = () => {
  const { FormValidator } = jest.requireMock('@/utils/validation/formValidator')
  FormValidator.mockImplementation(() => ({
    rules: {},
    errors: {},
    isValid: true,
    validateField: jest.fn((field: string, value: string) => {
      if (!value) return { error: `${field} is required` }
      if (field === 'email' && !value.includes('@'))
        return { error: 'Please enter a valid email address' }
      if (field === 'message' && value.length < 10)
        return { error: 'Message must be at least 10 characters' }
      return { error: undefined }
    }),
    validateForm: jest.fn(
      (data: { name?: string; email?: string; message?: string }) => {
        const errors: Record<string, string> = {}
        if (!data.name) errors.name = 'Name is required'
        if (!data.email) errors.email = 'Email is required'
        if (!data.message) errors.message = 'Message is required'
        if (data.email && !data.email.includes('@'))
          errors.email = 'Please enter a valid email address'
        if (data.message && data.message.length < 10)
          errors.message = 'Message must be at least 10 characters'
        return { isValid: Object.keys(errors).length === 0, errors }
      }
    ),
    isFormValid: jest.fn(() => true),
    getErrors: jest.fn(() => ({})),
    clearErrors: jest.fn(),
  }))
}

describe('MobileContactForm', () => {
  // Suppress act() warnings for async state updates - these are expected in async form tests
  const originalError = console.error
  beforeAll(() => {
    console.error = (...args: unknown[]) => {
      if (
        typeof args[0] === 'string' &&
        args[0].includes(
          'Warning: An update to MobileContactForm inside a test was not wrapped in act'
        )
      ) {
        return
      }
      originalError.call(console, ...args)
    }
  })

  afterAll(() => {
    console.error = originalError
  })

  beforeEach(() => {
    jest.clearAllMocks()
    setupDefaultFormValidator()
    global.fetch = jest.fn()
  })

  afterEach(() => {
    jest.restoreAllMocks()
    // Ensure real timers are restored after each test (in case fake timers were used)
    jest.useRealTimers()
    // Clean up any pending timers from setTimeout in component
    jest.clearAllTimers()
  })

  describe('Rendering', () => {
    it('should_render_all_form_fields_with_correct_labels', () => {
      render(<MobileContactForm />)

      expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/message/i)).toBeInTheDocument()
    })

    it('should_render_submit_button', () => {
      render(<MobileContactForm />)

      const submitButton = screen.getByRole('button', { name: /send message/i })
      expect(submitButton).toBeInTheDocument()
    })

    it('should_display_required_field_indicators', () => {
      render(<MobileContactForm />)

      const requiredIndicators = screen.getAllByText('*')
      expect(requiredIndicators.length).toBe(3) // All 3 fields are required
    })

    it('should_apply_keyboard_open_class_when_virtual_keyboard_detected', () => {
      ;(useVirtualKeyboard as jest.Mock).mockReturnValue({
        isKeyboardOpen: true,
      })

      const { container } = render(<MobileContactForm />)
      const form = container.querySelector('form')

      expect(form).toHaveClass('keyboard-open')
    })

    it('should_render_with_proper_form_attributes_noValidate', () => {
      const { container } = render(<MobileContactForm />)
      const form = container.querySelector('form')

      expect(form).toHaveAttribute('noValidate')
    })
  })

  describe('Form Validation', () => {
    it('should_validate_name_field_on_change', async () => {
      render(<MobileContactForm />)

      const nameInput = screen.getByLabelText(/name/i)
      await userEvent.clear(nameInput)
      await userEvent.type(nameInput, 'John Doe')

      expect(
        jest.requireMock('@/utils/validation/formValidator').FormValidator.mock
          .results[0].value.validateField
      ).toHaveBeenCalled()
    })

    it('should_validate_email_field_on_change', async () => {
      render(<MobileContactForm />)

      const emailInput = screen.getByLabelText(/email/i)
      await userEvent.type(emailInput, 'test@example.com')

      expect(
        jest.requireMock('@/utils/validation/formValidator').FormValidator.mock
          .results[0].value.validateField
      ).toHaveBeenCalled()
    })

    it('should_validate_message_field_on_change', async () => {
      render(<MobileContactForm />)

      const messageInput = screen.getByLabelText(/message/i)
      await userEvent.type(messageInput, 'This is a test message')

      expect(
        jest.requireMock('@/utils/validation/formValidator').FormValidator.mock
          .results[0].value.validateField
      ).toHaveBeenCalled()
    })

    it('should_show_error_for_empty_required_name_field', async () => {
      render(<MobileContactForm />)

      const emailInput = screen.getByLabelText(/email/i)
      const messageInput = screen.getByLabelText(/message/i)
      await userEvent.type(emailInput, 'test@example.com')
      await userEvent.type(messageInput, 'Valid message here')

      await submitForm('Send Message')

      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument()
      })
    })

    it('should_show_error_for_invalid_email_format', async () => {
      render(<MobileContactForm />)

      const emailInput = screen.getByLabelText(/email/i)
      await userEvent.type(emailInput, 'not-an-email')

      await waitFor(() => {
        expect(
          screen.getByText(/please enter a valid email address/i)
        ).toBeInTheDocument()
      })
    })

    it('should_show_error_for_empty_required_email_field', async () => {
      render(<MobileContactForm />)

      const nameInput = screen.getByLabelText(/name/i)
      const messageInput = screen.getByLabelText(/message/i)
      await userEvent.type(nameInput, 'John Doe')
      await userEvent.type(messageInput, 'Valid message')

      await submitForm('Send Message')

      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument()
      })
    })

    it('should_show_error_for_empty_required_message_field', async () => {
      render(<MobileContactForm />)

      const nameInput = screen.getByLabelText(/name/i)
      const emailInput = screen.getByLabelText(/email/i)
      await userEvent.type(nameInput, 'John Doe')
      await userEvent.type(emailInput, 'test@example.com')

      await submitForm('Send Message')

      await waitFor(() => {
        expect(screen.getByText(/message is required/i)).toBeInTheDocument()
      })
    })

    it('should_show_error_for_message_too_short', async () => {
      render(<MobileContactForm />)

      const messageInput = screen.getByLabelText(/message/i)
      await userEvent.type(messageInput, 'Short')

      await waitFor(() => {
        expect(
          screen.getByText(/message must be at least 10 characters/i)
        ).toBeInTheDocument()
      })
    })

    it('should_clear_field_error_when_user_corrects_input', async () => {
      render(<MobileContactForm />)

      const emailInput = screen.getByLabelText(/email/i)

      // First, enter invalid email
      await userEvent.type(emailInput, 'invalid')
      await waitFor(() => {
        expect(
          screen.getByText(/please enter a valid email address/i)
        ).toBeInTheDocument()
      })

      // Clear and enter valid email
      await userEvent.clear(emailInput)
      await userEvent.type(emailInput, 'valid@example.com')

      await waitFor(() => {
        expect(
          screen.queryByText(/please enter a valid email address/i)
        ).not.toBeInTheDocument()
      })
    })

    it('should_prevent_submission_with_invalid_data', async () => {
      mockSuccessfulSubmission()
      render(<MobileContactForm />)

      await submitForm('Send Message')

      await waitFor(() => {
        expect(global.fetch).not.toHaveBeenCalled()
      })
    })

    it('should_validate_all_fields_before_submission', async () => {
      render(<MobileContactForm />)

      await submitForm('Send Message')

      expect(
        jest.requireMock('@/utils/validation/formValidator').FormValidator.mock
          .results[0].value.validateForm
      ).toHaveBeenCalled()
    })
  })

  describe('User Interactions', () => {
    it('should_update_name_field_value_on_input_change', async () => {
      render(<MobileContactForm />)

      const nameInput = screen.getByLabelText(/name/i)
      await userEvent.type(nameInput, 'Jane Smith')

      expect(nameInput).toHaveValue('Jane Smith')
    })

    it('should_update_email_field_value_on_input_change', async () => {
      render(<MobileContactForm />)

      const emailInput = screen.getByLabelText(/email/i)
      await userEvent.type(emailInput, 'jane@example.com')

      expect(emailInput).toHaveValue('jane@example.com')
    })

    it('should_update_message_field_value_on_input_change', async () => {
      render(<MobileContactForm />)

      const messageInput = screen.getByLabelText(/message/i)
      await userEvent.type(messageInput, 'Hello, this is my message')

      expect(messageInput).toHaveValue('Hello, this is my message')
    })

    it('should_clear_success_message_when_user_starts_typing_again', async () => {
      setupValidFormValidator()
      mockSuccessfulSubmission()

      render(<MobileContactForm />)

      const nameInput = screen.getByLabelText(/name/i)
      const emailInput = screen.getByLabelText(/email/i)
      const messageInput = screen.getByLabelText(/message/i)

      await userEvent.type(nameInput, 'John Doe')
      await userEvent.type(emailInput, 'john@example.com')
      await userEvent.type(messageInput, 'Test message here')

      await submitForm('Send Message')

      await waitFor(() => {
        expect(
          screen.getByText(/message sent successfully/i)
        ).toBeInTheDocument()
      })

      // Type in name field
      await userEvent.type(nameInput, ' Jr')

      await waitFor(() => {
        expect(
          screen.queryByText(/message sent successfully/i)
        ).not.toBeInTheDocument()
      })
    })

    it('should_disable_submit_button_during_submission', async () => {
      setupValidFormValidator()
      mockSuccessfulSubmission()

      render(<MobileContactForm />)

      const nameInput = screen.getByLabelText(/name/i)
      const emailInput = screen.getByLabelText(/email/i)
      const messageInput = screen.getByLabelText(/message/i)

      await userEvent.type(nameInput, mockValidFormData.name)
      await userEvent.type(emailInput, mockValidFormData.email)
      await userEvent.type(messageInput, mockValidFormData.message)

      const submitButton = screen.getByRole('button', { name: /send message/i })
      fireEvent.click(submitButton)

      expect(submitButton).toBeDisabled()
    })

    it('should_show_loading_state_during_submission', async () => {
      // Create a promise we can control to keep fetch pending
      let resolveFetch: () => void
      const fetchPromise = new Promise<Response>((resolve) => {
        resolveFetch = () =>
          resolve({
            ok: true,
            status: 200,
            json: async () => ({ success: true }),
          } as Response)
      })
      global.fetch = jest.fn().mockReturnValue(fetchPromise)

      jest
        .requireMock('@/utils/validation/formValidator')
        .FormValidator.mockImplementation(() => ({
          validateField: jest.fn(() => ({ error: undefined })),
          validateForm: jest.fn(() => ({ isValid: true, errors: {} })),
          isFormValid: jest.fn(() => true),
        }))

      render(<MobileContactForm />)

      const nameInput = screen.getByLabelText(/name/i)
      const emailInput = screen.getByLabelText(/email/i)
      const messageInput = screen.getByLabelText(/message/i)

      await userEvent.type(nameInput, mockValidFormData.name)
      await userEvent.type(emailInput, mockValidFormData.email)
      await userEvent.type(messageInput, mockValidFormData.message)

      // Submit but don't await - we want to check loading state during submission
      const submitButton = screen.getByRole('button', { name: /send message/i })
      const user = userEvent.setup()
      user.click(submitButton)

      // Check for loading state
      await waitFor(() => {
        expect(screen.getByText(/sending/i)).toBeInTheDocument()
      })

      // Clean up by resolving the fetch
      resolveFetch!()
      await waitFor(() => {
        expect(screen.queryByText(/sending/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('API Integration', () => {
    it('should_send_POST_request_to_api_contact_on_submit', async () => {
      mockSuccessfulSubmission()
      jest
        .requireMock('@/utils/validation/formValidator')
        .FormValidator.mockImplementation(() => ({
          validateField: jest.fn(() => ({ error: undefined })),
          validateForm: jest.fn(() => ({ isValid: true, errors: {} })),
          isFormValid: jest.fn(() => true),
        }))

      render(<MobileContactForm />)

      const nameInput = screen.getByLabelText(/name/i)
      const emailInput = screen.getByLabelText(/email/i)
      const messageInput = screen.getByLabelText(/message/i)

      await userEvent.type(nameInput, mockValidFormData.name)
      await userEvent.type(emailInput, mockValidFormData.email)
      await userEvent.type(messageInput, mockValidFormData.message)

      await submitForm('Send Message')

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/contact',
          expect.objectContaining({
            method: 'POST',
          })
        )
      })
    })

    it('should_include_form_data_in_request_body', async () => {
      setupValidFormValidator()
      mockSuccessfulSubmission()

      render(<MobileContactForm />)

      const nameInput = screen.getByLabelText(/name/i)
      const emailInput = screen.getByLabelText(/email/i)
      const messageInput = screen.getByLabelText(/message/i)

      await userEvent.type(nameInput, mockValidFormData.name)
      await userEvent.type(emailInput, mockValidFormData.email)
      await userEvent.type(messageInput, mockValidFormData.message)

      await submitForm('Send Message')

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/contact',
          expect.objectContaining({
            body: JSON.stringify(mockValidFormData),
          })
        )
      })
    })

    it('should_set_correct_content_type_header', async () => {
      setupValidFormValidator()
      mockSuccessfulSubmission()

      render(<MobileContactForm />)

      const nameInput = screen.getByLabelText(/name/i)
      const emailInput = screen.getByLabelText(/email/i)
      const messageInput = screen.getByLabelText(/message/i)

      await userEvent.type(nameInput, mockValidFormData.name)
      await userEvent.type(emailInput, mockValidFormData.email)
      await userEvent.type(messageInput, mockValidFormData.message)

      await submitForm('Send Message')

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/contact',
          expect.objectContaining({
            headers: { 'Content-Type': 'application/json' },
          })
        )
      })
    })

    it('should_handle_successful_submission_200_response', async () => {
      mockSuccessfulSubmission()
      jest
        .requireMock('@/utils/validation/formValidator')
        .FormValidator.mockImplementation(() => ({
          validateField: jest.fn(() => ({ error: undefined })),
          validateForm: jest.fn(() => ({ isValid: true, errors: {} })),
          isFormValid: jest.fn(() => true),
        }))

      render(<MobileContactForm />)

      const nameInput = screen.getByLabelText(/name/i)
      const emailInput = screen.getByLabelText(/email/i)
      const messageInput = screen.getByLabelText(/message/i)

      await userEvent.type(nameInput, mockValidFormData.name)
      await userEvent.type(emailInput, mockValidFormData.email)
      await userEvent.type(messageInput, mockValidFormData.message)

      await submitForm('Send Message')

      await waitFor(() => {
        expect(
          screen.getByText(/message sent successfully/i)
        ).toBeInTheDocument()
      })
    })

    it('should_clear_form_fields_after_successful_submission', async () => {
      mockSuccessfulSubmission()
      jest
        .requireMock('@/utils/validation/formValidator')
        .FormValidator.mockImplementation(() => ({
          validateField: jest.fn(() => ({ error: undefined })),
          validateForm: jest.fn(() => ({ isValid: true, errors: {} })),
          isFormValid: jest.fn(() => true),
        }))

      render(<MobileContactForm />)

      const nameInput = screen.getByLabelText(/name/i)
      const emailInput = screen.getByLabelText(/email/i)
      const messageInput = screen.getByLabelText(/message/i)

      await userEvent.type(nameInput, mockValidFormData.name)
      await userEvent.type(emailInput, mockValidFormData.email)
      await userEvent.type(messageInput, mockValidFormData.message)

      await submitForm('Send Message')

      await waitFor(() => {
        expect(nameInput).toHaveValue('')
        expect(emailInput).toHaveValue('')
        expect(messageInput).toHaveValue('')
      })
    })

    it('should_show_success_message_after_successful_submission', async () => {
      mockSuccessfulSubmission()
      jest
        .requireMock('@/utils/validation/formValidator')
        .FormValidator.mockImplementation(() => ({
          validateField: jest.fn(() => ({ error: undefined })),
          validateForm: jest.fn(() => ({ isValid: true, errors: {} })),
          isFormValid: jest.fn(() => true),
        }))

      render(<MobileContactForm />)

      const nameInput = screen.getByLabelText(/name/i)
      const emailInput = screen.getByLabelText(/email/i)
      const messageInput = screen.getByLabelText(/message/i)

      await userEvent.type(nameInput, mockValidFormData.name)
      await userEvent.type(emailInput, mockValidFormData.email)
      await userEvent.type(messageInput, mockValidFormData.message)

      await submitForm('Send Message')

      await waitFor(() => {
        expect(
          screen.getByText(/message sent successfully/i)
        ).toBeInTheDocument()
      })
    })

    it('should_hide_success_message_after_5_seconds', async () => {
      setupValidFormValidator()
      mockSuccessfulSubmission()

      render(<MobileContactForm />)

      const nameInput = screen.getByLabelText(/name/i)
      const emailInput = screen.getByLabelText(/email/i)
      const messageInput = screen.getByLabelText(/message/i)

      await userEvent.type(nameInput, mockValidFormData.name)
      await userEvent.type(emailInput, mockValidFormData.email)
      await userEvent.type(messageInput, mockValidFormData.message)

      await submitForm('Send Message')

      // Wait for success message to appear
      await waitFor(() => {
        expect(
          screen.getByText(/message sent successfully/i)
        ).toBeInTheDocument()
      })

      // Wait for success message to disappear (5 second setTimeout in component)
      await waitFor(
        () => {
          expect(
            screen.queryByText(/message sent successfully/i)
          ).not.toBeInTheDocument()
        },
        { timeout: 6000 } // Give it 6 seconds to account for the 5s setTimeout
      )
    }, 15000) // Test timeout: user typing (3s) + submission (1s) + setTimeout (5s) + buffer (6s)

    it('should_call_onSuccess_callback_when_provided', async () => {
      const onSuccess = jest.fn()
      mockSuccessfulSubmission()
      jest
        .requireMock('@/utils/validation/formValidator')
        .FormValidator.mockImplementation(() => ({
          validateField: jest.fn(() => ({ error: undefined })),
          validateForm: jest.fn(() => ({ isValid: true, errors: {} })),
          isFormValid: jest.fn(() => true),
        }))

      render(<MobileContactForm onSuccess={onSuccess} />)

      const nameInput = screen.getByLabelText(/name/i)
      const emailInput = screen.getByLabelText(/email/i)
      const messageInput = screen.getByLabelText(/message/i)

      await userEvent.type(nameInput, mockValidFormData.name)
      await userEvent.type(emailInput, mockValidFormData.email)
      await userEvent.type(messageInput, mockValidFormData.message)

      await submitForm('Send Message')

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled()
      })
    })
  })

  describe('Error Handling', () => {
    it('should_call_onError_callback_with_error_message', async () => {
      const onError = jest.fn()
      mockFailedSubmission(500, 'Server error')
      jest
        .requireMock('@/utils/validation/formValidator')
        .FormValidator.mockImplementation(() => ({
          validateField: jest.fn(() => ({ error: undefined })),
          validateForm: jest.fn(() => ({ isValid: true, errors: {} })),
          isFormValid: jest.fn(() => true),
        }))

      render(<MobileContactForm onError={onError} />)

      const nameInput = screen.getByLabelText(/name/i)
      const emailInput = screen.getByLabelText(/email/i)
      const messageInput = screen.getByLabelText(/message/i)

      await userEvent.type(nameInput, mockValidFormData.name)
      await userEvent.type(emailInput, mockValidFormData.email)
      await userEvent.type(messageInput, mockValidFormData.message)

      await submitForm('Send Message')

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith('Failed to send message')
      })
    })

    it('should_handle_network_errors_gracefully', async () => {
      const onError = jest.fn()
      mockNetworkError()
      jest
        .requireMock('@/utils/validation/formValidator')
        .FormValidator.mockImplementation(() => ({
          validateField: jest.fn(() => ({ error: undefined })),
          validateForm: jest.fn(() => ({ isValid: true, errors: {} })),
          isFormValid: jest.fn(() => true),
        }))

      render(<MobileContactForm onError={onError} />)

      const nameInput = screen.getByLabelText(/name/i)
      const emailInput = screen.getByLabelText(/email/i)
      const messageInput = screen.getByLabelText(/message/i)

      await userEvent.type(nameInput, mockValidFormData.name)
      await userEvent.type(emailInput, mockValidFormData.email)
      await userEvent.type(messageInput, mockValidFormData.message)

      await submitForm('Send Message')

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith('Network error')
      })
    })

    it('should_handle_500_server_errors', async () => {
      const onError = jest.fn()
      mockFailedSubmission(500)
      jest
        .requireMock('@/utils/validation/formValidator')
        .FormValidator.mockImplementation(() => ({
          validateField: jest.fn(() => ({ error: undefined })),
          validateForm: jest.fn(() => ({ isValid: true, errors: {} })),
          isFormValid: jest.fn(() => true),
        }))

      render(<MobileContactForm onError={onError} />)

      const nameInput = screen.getByLabelText(/name/i)
      const emailInput = screen.getByLabelText(/email/i)
      const messageInput = screen.getByLabelText(/message/i)

      await userEvent.type(nameInput, mockValidFormData.name)
      await userEvent.type(emailInput, mockValidFormData.email)
      await userEvent.type(messageInput, mockValidFormData.message)

      await submitForm('Send Message')

      await waitFor(() => {
        expect(onError).toHaveBeenCalled()
      })
    })

    it('should_handle_400_validation_errors', async () => {
      const onError = jest.fn()
      setupValidFormValidator()
      mockFailedSubmission(400, 'Validation failed')

      render(<MobileContactForm onError={onError} />)

      const nameInput = screen.getByLabelText(/name/i)
      const emailInput = screen.getByLabelText(/email/i)
      const messageInput = screen.getByLabelText(/message/i)

      await userEvent.type(nameInput, mockValidFormData.name)
      await userEvent.type(emailInput, mockValidFormData.email)
      await userEvent.type(messageInput, mockValidFormData.message)

      await submitForm('Send Message')

      await waitFor(() => {
        expect(onError).toHaveBeenCalled()
      })
    }, 10000)

    it('should_re_enable_form_after_submission_error', async () => {
      setupValidFormValidator()
      mockFailedSubmission(500)

      render(<MobileContactForm />)

      const nameInput = screen.getByLabelText(/name/i)
      const emailInput = screen.getByLabelText(/email/i)
      const messageInput = screen.getByLabelText(/message/i)

      await userEvent.type(nameInput, mockValidFormData.name)
      await userEvent.type(emailInput, mockValidFormData.email)
      await userEvent.type(messageInput, mockValidFormData.message)

      const submitButton = screen.getByRole('button', { name: /send message/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled()
      })
    }, 10000)

    it('should_maintain_form_data_after_submission_error', async () => {
      setupValidFormValidator()
      mockFailedSubmission(500)

      render(<MobileContactForm />)

      const nameInput = screen.getByLabelText(/name/i)
      const emailInput = screen.getByLabelText(/email/i)
      const messageInput = screen.getByLabelText(/message/i)

      await userEvent.type(nameInput, mockValidFormData.name)
      await userEvent.type(emailInput, mockValidFormData.email)
      await userEvent.type(messageInput, mockValidFormData.message)

      await submitForm('Send Message')

      await waitFor(() => {
        expect(nameInput).toHaveValue(mockValidFormData.name)
        expect(emailInput).toHaveValue(mockValidFormData.email)
        expect(messageInput).toHaveValue(mockValidFormData.message)
      })
    }, 10000)
  })

  describe('Analytics Integration', () => {
    it('should_track_form_submit_event_on_submission', async () => {
      setupValidFormValidator()
      mockSuccessfulSubmission()

      render(<MobileContactForm />)

      const nameInput = screen.getByLabelText(/name/i)
      const emailInput = screen.getByLabelText(/email/i)
      const messageInput = screen.getByLabelText(/message/i)

      await userEvent.type(nameInput, mockValidFormData.name)
      await userEvent.type(emailInput, mockValidFormData.email)
      await userEvent.type(messageInput, mockValidFormData.message)

      await submitForm('Send Message')

      await waitFor(() => {
        expect(UmamiEvents.contactFormSubmit).toHaveBeenCalled()
      })
    }, 10000)

    it('should_track_form_success_event_on_successful_submission', async () => {
      setupValidFormValidator()
      mockSuccessfulSubmission()

      render(<MobileContactForm />)

      const nameInput = screen.getByLabelText(/name/i)
      const emailInput = screen.getByLabelText(/email/i)
      const messageInput = screen.getByLabelText(/message/i)

      await userEvent.type(nameInput, mockValidFormData.name)
      await userEvent.type(emailInput, mockValidFormData.email)
      await userEvent.type(messageInput, mockValidFormData.message)

      await submitForm('Send Message')

      await waitFor(() => {
        expect(UmamiEvents.contactFormSuccess).toHaveBeenCalled()
      })
    }, 10000)

    it('should_track_form_error_event_on_failed_submission', async () => {
      setupValidFormValidator()
      mockFailedSubmission(500)

      render(<MobileContactForm />)

      const nameInput = screen.getByLabelText(/name/i)
      const emailInput = screen.getByLabelText(/email/i)
      const messageInput = screen.getByLabelText(/message/i)

      await userEvent.type(nameInput, mockValidFormData.name)
      await userEvent.type(emailInput, mockValidFormData.email)
      await userEvent.type(messageInput, mockValidFormData.message)

      await submitForm('Send Message')

      await waitFor(() => {
        expect(UmamiEvents.contactFormError).toHaveBeenCalled()
      })
    }, 10000)
  })

  describe('Virtual Keyboard Handling', () => {
    it('should_apply_keyboard_open_class_when_keyboard_detected', () => {
      ;(useVirtualKeyboard as jest.Mock).mockReturnValue({
        isKeyboardOpen: true,
      })

      const { container } = render(<MobileContactForm />)
      const form = container.querySelector('form')

      expect(form).toHaveClass('keyboard-open')
    })

    it('should_remove_keyboard_open_class_when_keyboard_closed', () => {
      ;(useVirtualKeyboard as jest.Mock).mockReturnValue({
        isKeyboardOpen: false,
      })

      const { container } = render(<MobileContactForm />)
      const form = container.querySelector('form')

      expect(form).not.toHaveClass('keyboard-open')
    })
  })
})
