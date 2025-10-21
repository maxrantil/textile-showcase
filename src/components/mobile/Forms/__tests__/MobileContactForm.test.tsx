// ABOUTME: Comprehensive test suite for MobileContactForm - form validation, API integration, analytics

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MobileContactForm } from '../MobileContactForm'
import {
  mockValidFormData,
  mockInvalidFormData,
  mockFormValidationErrors,
} from '../../../../../tests/fixtures/forms'
import {
  fillFormField,
  submitForm,
  expectValidationError,
  expectNoValidationErrors,
  mockSuccessfulSubmission,
  mockFailedSubmission,
  mockNetworkError,
} from '../../../../../tests/utils/form-helpers'

// Mock dependencies
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

jest.mock('@/utils/validation/formValidator')
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
  }: any) => (
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
  MobileButton: ({ children, disabled, loading, onClick, type }: any) => (
    <button type={type} disabled={disabled || loading} onClick={onClick}>
      {loading ? 'Sending...' : children}
    </button>
  ),
}))

describe('MobileContactForm', () => {
  let analytics: any
  let useVirtualKeyboard: any
  let FormValidator: any

  beforeEach(() => {
    jest.clearAllMocks()

    analytics = require('@/utils/analytics').UmamiEvents
    useVirtualKeyboard =
      require('@/hooks/mobile/useVirtualKeyboard').useVirtualKeyboard

    FormValidator = require('@/utils/validation/formValidator').FormValidator
    FormValidator.mockImplementation(() => ({
      validateField: jest.fn((field: string, value: string) => {
        if (!value) return { error: `${field} is required` }
        if (field === 'email' && !value.includes('@'))
          return { error: 'Please enter a valid email address' }
        if (field === 'message' && value.length < 10)
          return { error: 'Message must be at least 10 characters' }
        return { error: undefined }
      }),
      validateForm: jest.fn((data: any) => {
        const errors: any = {}
        if (!data.name) errors.name = 'Name is required'
        if (!data.email) errors.email = 'Email is required'
        if (!data.message) errors.message = 'Message is required'
        if (data.email && !data.email.includes('@'))
          errors.email = 'Please enter a valid email address'
        if (data.message && data.message.length < 10)
          errors.message = 'Message must be at least 10 characters'
        return { isValid: Object.keys(errors).length === 0, errors }
      }),
      isFormValid: jest.fn(() => true),
    }))

    global.fetch = jest.fn()
  })

  afterEach(() => {
    jest.restoreAllMocks()
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
      useVirtualKeyboard.mockReturnValue({ isKeyboardOpen: true })

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
        FormValidator.mock.results[0].value.validateField
      ).toHaveBeenCalled()
    })

    it('should_validate_email_field_on_change', async () => {
      render(<MobileContactForm />)

      const emailInput = screen.getByLabelText(/email/i)
      await userEvent.type(emailInput, 'test@example.com')

      expect(
        FormValidator.mock.results[0].value.validateField
      ).toHaveBeenCalled()
    })

    it('should_validate_message_field_on_change', async () => {
      render(<MobileContactForm />)

      const messageInput = screen.getByLabelText(/message/i)
      await userEvent.type(messageInput, 'This is a test message')

      expect(
        FormValidator.mock.results[0].value.validateField
      ).toHaveBeenCalled()
    })

    it('should_show_error_for_empty_required_name_field', async () => {
      render(<MobileContactForm />)

      const emailInput = screen.getByLabelText(/email/i)
      const messageInput = screen.getByLabelText(/message/i)
      await userEvent.type(emailInput, 'test@example.com')
      await userEvent.type(messageInput, 'Valid message here')

      submitForm()

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

      submitForm()

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

      submitForm()

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

      submitForm()

      await waitFor(() => {
        expect(global.fetch).not.toHaveBeenCalled()
      })
    })

    it('should_validate_all_fields_before_submission', async () => {
      render(<MobileContactForm />)

      submitForm()

      expect(
        FormValidator.mock.results[0].value.validateForm
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
      mockSuccessfulSubmission()
      FormValidator.mockImplementation(() => ({
        validateField: jest.fn(() => ({ error: undefined })),
        validateForm: jest.fn(() => ({ isValid: true, errors: {} })),
        isFormValid: jest.fn(() => true),
      }))

      render(<MobileContactForm />)

      const nameInput = screen.getByLabelText(/name/i)
      const emailInput = screen.getByLabelText(/email/i)
      const messageInput = screen.getByLabelText(/message/i)

      await userEvent.type(nameInput, 'John Doe')
      await userEvent.type(emailInput, 'john@example.com')
      await userEvent.type(messageInput, 'Test message here')

      submitForm()

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
      mockSuccessfulSubmission()
      FormValidator.mockImplementation(() => ({
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

      const submitButton = screen.getByRole('button', { name: /send message/i })
      fireEvent.click(submitButton)

      expect(submitButton).toBeDisabled()
    })

    it('should_show_loading_state_during_submission', async () => {
      mockSuccessfulSubmission()
      FormValidator.mockImplementation(() => ({
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

      submitForm()

      expect(screen.getByText(/sending/i)).toBeInTheDocument()
    })
  })

  describe('API Integration', () => {
    it('should_send_POST_request_to_api_contact_on_submit', async () => {
      mockSuccessfulSubmission()
      FormValidator.mockImplementation(() => ({
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

      submitForm()

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
      mockSuccessfulSubmission()
      FormValidator.mockImplementation(() => ({
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

      submitForm()

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
      mockSuccessfulSubmission()
      FormValidator.mockImplementation(() => ({
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

      submitForm()

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
      FormValidator.mockImplementation(() => ({
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

      submitForm()

      await waitFor(() => {
        expect(
          screen.getByText(/message sent successfully/i)
        ).toBeInTheDocument()
      })
    })

    it('should_clear_form_fields_after_successful_submission', async () => {
      mockSuccessfulSubmission()
      FormValidator.mockImplementation(() => ({
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

      submitForm()

      await waitFor(() => {
        expect(nameInput).toHaveValue('')
        expect(emailInput).toHaveValue('')
        expect(messageInput).toHaveValue('')
      })
    })

    it('should_show_success_message_after_successful_submission', async () => {
      mockSuccessfulSubmission()
      FormValidator.mockImplementation(() => ({
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

      submitForm()

      await waitFor(() => {
        expect(
          screen.getByText(/message sent successfully/i)
        ).toBeInTheDocument()
      })
    })

    it('should_hide_success_message_after_5_seconds', async () => {
      jest.useFakeTimers()
      mockSuccessfulSubmission()
      FormValidator.mockImplementation(() => ({
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

      submitForm()

      await waitFor(() => {
        expect(
          screen.getByText(/message sent successfully/i)
        ).toBeInTheDocument()
      })

      jest.advanceTimersByTime(5000)

      await waitFor(() => {
        expect(
          screen.queryByText(/message sent successfully/i)
        ).not.toBeInTheDocument()
      })

      jest.useRealTimers()
    })

    it('should_call_onSuccess_callback_when_provided', async () => {
      const onSuccess = jest.fn()
      mockSuccessfulSubmission()
      FormValidator.mockImplementation(() => ({
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

      submitForm()

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled()
      })
    })
  })

  describe('Error Handling', () => {
    it('should_call_onError_callback_with_error_message', async () => {
      const onError = jest.fn()
      mockFailedSubmission(500, 'Server error')
      FormValidator.mockImplementation(() => ({
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

      submitForm()

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith('Failed to send message')
      })
    })

    it('should_handle_network_errors_gracefully', async () => {
      const onError = jest.fn()
      mockNetworkError()
      FormValidator.mockImplementation(() => ({
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

      submitForm()

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith('Network error')
      })
    })

    it('should_handle_500_server_errors', async () => {
      const onError = jest.fn()
      mockFailedSubmission(500)
      FormValidator.mockImplementation(() => ({
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

      submitForm()

      await waitFor(() => {
        expect(onError).toHaveBeenCalled()
      })
    })

    it('should_handle_400_validation_errors', async () => {
      const onError = jest.fn()
      mockFailedSubmission(400, 'Validation failed')
      FormValidator.mockImplementation(() => ({
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

      submitForm()

      await waitFor(() => {
        expect(onError).toHaveBeenCalled()
      })
    })

    it('should_re_enable_form_after_submission_error', async () => {
      mockFailedSubmission(500)
      FormValidator.mockImplementation(() => ({
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

      const submitButton = screen.getByRole('button', { name: /send message/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled()
      })
    })

    it('should_maintain_form_data_after_submission_error', async () => {
      mockFailedSubmission(500)
      FormValidator.mockImplementation(() => ({
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

      submitForm()

      await waitFor(() => {
        expect(nameInput).toHaveValue(mockValidFormData.name)
        expect(emailInput).toHaveValue(mockValidFormData.email)
        expect(messageInput).toHaveValue(mockValidFormData.message)
      })
    })
  })

  describe('Analytics Integration', () => {
    it('should_track_form_submit_event_on_submission', async () => {
      mockSuccessfulSubmission()
      FormValidator.mockImplementation(() => ({
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

      submitForm()

      await waitFor(() => {
        expect(analytics.contactFormSubmit).toHaveBeenCalled()
      })
    })

    it('should_track_form_success_event_on_successful_submission', async () => {
      mockSuccessfulSubmission()
      FormValidator.mockImplementation(() => ({
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

      submitForm()

      await waitFor(() => {
        expect(analytics.contactFormSuccess).toHaveBeenCalled()
      })
    })

    it('should_track_form_error_event_on_failed_submission', async () => {
      mockFailedSubmission(500)
      FormValidator.mockImplementation(() => ({
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

      submitForm()

      await waitFor(() => {
        expect(analytics.contactFormError).toHaveBeenCalled()
      })
    })
  })

  describe('Virtual Keyboard Handling', () => {
    it('should_apply_keyboard_open_class_when_keyboard_detected', () => {
      useVirtualKeyboard.mockReturnValue({ isKeyboardOpen: true })

      const { container } = render(<MobileContactForm />)
      const form = container.querySelector('form')

      expect(form).toHaveClass('keyboard-open')
    })

    it('should_remove_keyboard_open_class_when_keyboard_closed', () => {
      useVirtualKeyboard.mockReturnValue({ isKeyboardOpen: false })

      const { container, rerender } = render(<MobileContactForm />)
      const form = container.querySelector('form')

      expect(form).not.toHaveClass('keyboard-open')
    })
  })
})
