// ABOUTME: Unit tests for useContactForm hook — field change, validation, submit, success state, callbacks

import { renderHook, act, waitFor } from '@testing-library/react'
import { useContactForm } from '@/hooks/shared/useContactForm'

jest.mock('@/utils/analytics', () => ({
  UmamiEvents: {
    contactFormSubmit: jest.fn(),
    contactFormSuccess: jest.fn(),
    contactFormError: jest.fn(),
  },
}))

import { UmamiEvents } from '@/utils/analytics'

const mockFetch = jest.fn()
global.fetch = mockFetch

describe('useContactForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset Once queues that clearMocks does not clear
    mockFetch.mockReset()
  })

  describe('Initial State', () => {
    it('should_initialise_formData_with_empty_strings', () => {
      const { result } = renderHook(() => useContactForm())

      expect(result.current.formData).toEqual({
        name: '',
        email: '',
        message: '',
      })
    })

    it('should_initialise_errors_as_empty_object', () => {
      const { result } = renderHook(() => useContactForm())

      expect(result.current.errors).toEqual({})
    })

    it('should_initialise_isSubmitting_as_false', () => {
      const { result } = renderHook(() => useContactForm())

      expect(result.current.isSubmitting).toBe(false)
    })

    it('should_initialise_showSuccess_as_false', () => {
      const { result } = renderHook(() => useContactForm())

      expect(result.current.showSuccess).toBe(false)
    })
  })

  describe('handleFieldChange', () => {
    it('should_update_formData_on_field_change', () => {
      const { result } = renderHook(() => useContactForm())

      act(() => {
        result.current.handleFieldChange('name', 'Alice')
      })

      expect(result.current.formData.name).toBe('Alice')
    })

    it('should_clear_showSuccess_when_user_types_after_success', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true })

      const { result } = renderHook(() => useContactForm())

      act(() => {
        result.current.handleFieldChange('name', 'Alice')
        result.current.handleFieldChange('email', 'alice@example.com')
        result.current.handleFieldChange(
          'message',
          'Hello, this is a test message that is long enough.'
        )
      })

      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: jest.fn(),
        } as unknown as React.FormEvent)
      })

      expect(result.current.showSuccess).toBe(true)

      // Typing again should clear the success state
      act(() => {
        result.current.handleFieldChange('name', 'Bob')
      })

      expect(result.current.showSuccess).toBe(false)
    })

    it('should_set_field_error_when_value_is_invalid', () => {
      const { result } = renderHook(() => useContactForm())

      act(() => {
        result.current.handleFieldChange('email', 'not-an-email')
      })

      expect(result.current.errors.email).toBeTruthy()
    })

    it('should_clear_field_error_when_value_becomes_valid', () => {
      const { result } = renderHook(() => useContactForm())

      act(() => {
        result.current.handleFieldChange('email', 'not-an-email')
      })
      expect(result.current.errors.email).toBeTruthy()

      act(() => {
        result.current.handleFieldChange('email', 'valid@example.com')
      })
      expect(result.current.errors.email).toBeFalsy()
    })
  })

  describe('handleSubmit — validation', () => {
    it('should_set_errors_and_not_call_fetch_when_form_invalid', async () => {
      const { result } = renderHook(() => useContactForm())

      const fakeEvent = { preventDefault: jest.fn() } as unknown as React.FormEvent

      await act(async () => {
        await result.current.handleSubmit(fakeEvent)
      })

      expect(fakeEvent.preventDefault).toHaveBeenCalled()
      expect(mockFetch).not.toHaveBeenCalled()
      expect(Object.keys(result.current.errors).length).toBeGreaterThan(0)
    })
  })

  describe('handleSubmit — success', () => {
    const fillValidForm = (result: ReturnType<typeof useContactForm>) => {
      act(() => {
        result.handleFieldChange('name', 'Alice')
        result.handleFieldChange('email', 'alice@example.com')
        result.handleFieldChange(
          'message',
          'Hello, this is a test message that is long enough.'
        )
      })
    }

    it('should_call_fetch_with_correct_payload_on_valid_submit', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true })

      const { result } = renderHook(() => useContactForm())
      fillValidForm(result.current)

      const fakeEvent = { preventDefault: jest.fn() } as unknown as React.FormEvent

      await act(async () => {
        await result.current.handleSubmit(fakeEvent)
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Alice',
          email: 'alice@example.com',
          message: 'Hello, this is a test message that is long enough.',
        }),
      })
    })

    it('should_set_showSuccess_true_after_successful_submit', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true })

      const { result } = renderHook(() => useContactForm())
      fillValidForm(result.current)

      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: jest.fn(),
        } as unknown as React.FormEvent)
      })

      expect(result.current.showSuccess).toBe(true)
    })

    it('should_reset_formData_after_successful_submit', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true })

      const { result } = renderHook(() => useContactForm())
      fillValidForm(result.current)

      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: jest.fn(),
        } as unknown as React.FormEvent)
      })

      expect(result.current.formData).toEqual({
        name: '',
        email: '',
        message: '',
      })
    })

    it('should_hide_showSuccess_after_5_seconds', async () => {
      jest.useFakeTimers()
      mockFetch.mockResolvedValueOnce({ ok: true })

      const { result } = renderHook(() => useContactForm())
      fillValidForm(result.current)

      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: jest.fn(),
        } as unknown as React.FormEvent)
      })

      expect(result.current.showSuccess).toBe(true)

      act(() => {
        jest.advanceTimersByTime(5000)
      })

      expect(result.current.showSuccess).toBe(false)
      jest.useRealTimers()
    })

    it('should_call_onSuccess_callback_after_successful_submit', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true })
      const onSuccess = jest.fn()

      const { result } = renderHook(() => useContactForm({ onSuccess }))
      fillValidForm(result.current)

      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: jest.fn(),
        } as unknown as React.FormEvent)
      })

      expect(onSuccess).toHaveBeenCalledTimes(1)
    })

    it('should_track_submit_and_success_analytics_events', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true })

      const { result } = renderHook(() => useContactForm())
      fillValidForm(result.current)

      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: jest.fn(),
        } as unknown as React.FormEvent)
      })

      expect(UmamiEvents.contactFormSubmit).toHaveBeenCalledTimes(1)
      expect(UmamiEvents.contactFormSuccess).toHaveBeenCalledTimes(1)
    })
  })

  describe('handleSubmit — error', () => {
    const fillValidForm = (result: ReturnType<typeof useContactForm>) => {
      act(() => {
        result.handleFieldChange('name', 'Alice')
        result.handleFieldChange('email', 'alice@example.com')
        result.handleFieldChange(
          'message',
          'Hello, this is a test message that is long enough.'
        )
      })
    }

    it('should_not_show_success_and_fire_error_analytics_on_server_non_ok', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })

      const { result } = renderHook(() => useContactForm())
      fillValidForm(result.current)

      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: jest.fn(),
        } as unknown as React.FormEvent)
      })

      expect(result.current.showSuccess).toBe(false)
      expect(UmamiEvents.contactFormError).toHaveBeenCalledTimes(1)
    })

    it('should_not_show_success_and_fire_error_analytics_when_fetch_throws', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network failure'))

      const { result } = renderHook(() => useContactForm())
      fillValidForm(result.current)

      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: jest.fn(),
        } as unknown as React.FormEvent)
      })

      expect(result.current.showSuccess).toBe(false)
      expect(UmamiEvents.contactFormError).toHaveBeenCalledTimes(1)
    })

    it('should_track_error_analytics_event_on_failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })

      const { result } = renderHook(() => useContactForm())
      fillValidForm(result.current)

      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: jest.fn(),
        } as unknown as React.FormEvent)
      })

      expect(UmamiEvents.contactFormError).toHaveBeenCalledTimes(1)
    })

    it('should_set_isSubmitting_false_after_error', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })

      const { result } = renderHook(() => useContactForm())
      fillValidForm(result.current)

      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: jest.fn(),
        } as unknown as React.FormEvent)
      })

      expect(result.current.isSubmitting).toBe(false)
    })
  })

  describe('isFormValid', () => {
    it('should_return_true_on_fresh_untouched_form', () => {
      // Validator only marks invalid after validateForm/validateField is triggered
      const { result } = renderHook(() => useContactForm())

      expect(result.current.isFormValid()).toBe(true)
    })

    it('should_return_false_after_invalid_field_is_typed', () => {
      const { result } = renderHook(() => useContactForm())

      act(() => {
        result.current.handleFieldChange('email', 'not-an-email')
      })

      expect(result.current.isFormValid()).toBe(false)
    })
  })
})
