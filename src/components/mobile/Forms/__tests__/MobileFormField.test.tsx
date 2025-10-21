// ABOUTME: Comprehensive test suite for MobileFormField - reusable form input with touch feedback

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MobileFormField } from '../MobileFormField'

// Mock dependencies
jest.mock('@/hooks/mobile/useTouchFeedback', () => ({
  useTouchFeedback: jest.fn(() => ({
    touchProps: {
      onTouchStart: jest.fn(),
      onTouchEnd: jest.fn(),
    },
  })),
}))

describe('MobileFormField', () => {
  const defaultProps = {
    label: 'Test Field',
    type: 'text' as const,
    value: '',
    onChange: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should_render_text_input_with_correct_type', () => {
      render(<MobileFormField {...defaultProps} type="text" />)

      const input = screen.getByLabelText('Test Field')
      expect(input).toHaveAttribute('type', 'text')
    })

    it('should_render_email_input_with_correct_type', () => {
      render(<MobileFormField {...defaultProps} type="email" />)

      const input = screen.getByLabelText('Test Field')
      expect(input).toHaveAttribute('type', 'email')
    })

    it('should_render_textarea_for_textarea_type', () => {
      render(<MobileFormField {...defaultProps} type="textarea" />)

      const textarea = screen.getByLabelText('Test Field')
      expect(textarea.tagName).toBe('TEXTAREA')
    })

    it('should_render_label_with_correct_htmlFor_attribute', () => {
      const { container } = render(<MobileFormField {...defaultProps} />)

      const label = container.querySelector('label')
      expect(label).toHaveAttribute('for', 'field-test-field')
    })

    it('should_display_required_indicator_when_required_true', () => {
      render(<MobileFormField {...defaultProps} required={true} />)

      expect(screen.getByText('*')).toBeInTheDocument()
    })

    it('should_not_display_required_indicator_when_required_false', () => {
      render(<MobileFormField {...defaultProps} required={false} />)

      expect(screen.queryByText('*')).not.toBeInTheDocument()
    })

    it('should_generate_unique_field_id_from_label', () => {
      render(<MobileFormField {...defaultProps} label="Email Address" />)

      const input = screen.getByLabelText('Email Address')
      expect(input).toHaveAttribute('id', 'field-email-address')
    })

    it('should_apply_correct_CSS_classes_to_inputs', () => {
      const { container } = render(<MobileFormField {...defaultProps} />)

      const input = container.querySelector('input')
      expect(input).toHaveClass('mobile-form-input')
    })
  })

  describe('Input Types & Attributes', () => {
    it('should_set_inputMode_email_for_email_type', () => {
      render(<MobileFormField {...defaultProps} type="email" />)

      const input = screen.getByLabelText('Test Field')
      expect(input).toHaveAttribute('inputMode', 'email')
    })

    it('should_set_inputMode_text_for_text_type_by_default', () => {
      render(<MobileFormField {...defaultProps} type="text" />)

      const input = screen.getByLabelText('Test Field')
      expect(input).toHaveAttribute('inputMode', 'text')
    })

    it('should_accept_custom_inputMode_prop', () => {
      render(
        <MobileFormField {...defaultProps} type="text" inputMode="numeric" />
      )

      const input = screen.getByLabelText('Test Field')
      expect(input).toHaveAttribute('inputMode', 'numeric')
    })

    it('should_set_autoComplete_attribute_correctly', () => {
      render(<MobileFormField {...defaultProps} autoComplete="email" />)

      const input = screen.getByLabelText('Test Field')
      expect(input).toHaveAttribute('autoComplete', 'email')
    })

    it('should_set_placeholder_attribute', () => {
      render(<MobileFormField {...defaultProps} placeholder="Enter text" />)

      const input = screen.getByLabelText('Test Field')
      expect(input).toHaveAttribute('placeholder', 'Enter text')
    })

    it('should_set_rows_attribute_for_textarea', () => {
      render(<MobileFormField {...defaultProps} type="textarea" rows={10} />)

      const textarea = screen.getByLabelText('Test Field')
      expect(textarea).toHaveAttribute('rows', '10')
    })

    it('should_set_required_attribute_when_required_true', () => {
      render(<MobileFormField {...defaultProps} required={true} />)

      const input = screen.getByLabelText(/test field/i)
      expect(input).toBeRequired()
    })
  })

  describe('Value Management', () => {
    it('should_display_current_value_in_input', () => {
      render(<MobileFormField {...defaultProps} value="Test Value" />)

      const input = screen.getByLabelText('Test Field') as HTMLInputElement
      expect(input.value).toBe('Test Value')
    })

    it('should_call_onChange_with_new_value_on_input_change', async () => {
      const onChange = jest.fn()
      render(<MobileFormField {...defaultProps} onChange={onChange} />)

      const input = screen.getByLabelText('Test Field')
      await userEvent.type(input, 'New Value')

      expect(onChange).toHaveBeenCalled()
    })

    it('should_handle_empty_string_value', () => {
      render(<MobileFormField {...defaultProps} value="" />)

      const input = screen.getByLabelText('Test Field') as HTMLInputElement
      expect(input.value).toBe('')
    })

    it('should_update_displayed_value_when_value_prop_changes', () => {
      const { rerender } = render(
        <MobileFormField {...defaultProps} value="Initial" />
      )

      let input = screen.getByLabelText('Test Field') as HTMLInputElement
      expect(input.value).toBe('Initial')

      rerender(<MobileFormField {...defaultProps} value="Updated" />)

      input = screen.getByLabelText('Test Field') as HTMLInputElement
      expect(input.value).toBe('Updated')
    })
  })

  describe('Error States', () => {
    it('should_display_error_message_when_error_prop_provided', () => {
      render(
        <MobileFormField {...defaultProps} error="This field is required" />
      )

      expect(screen.getByText('This field is required')).toBeInTheDocument()
    })

    it('should_apply_error_class_to_input_when_error_present', () => {
      const { container } = render(
        <MobileFormField {...defaultProps} error="Error message" />
      )

      const input = container.querySelector('input')
      expect(input).toHaveClass('error')
    })

    it('should_set_role_alert_on_error_message', () => {
      render(<MobileFormField {...defaultProps} error="Error message" />)

      const error = screen.getByRole('alert')
      expect(error).toHaveTextContent('Error message')
    })

    it('should_not_display_error_message_when_error_undefined', () => {
      render(<MobileFormField {...defaultProps} error={undefined} />)

      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    it('should_remove_error_class_when_error_cleared', () => {
      const { container, rerender } = render(
        <MobileFormField {...defaultProps} error="Error" />
      )

      let input = container.querySelector('input')
      expect(input).toHaveClass('error')

      rerender(<MobileFormField {...defaultProps} error={undefined} />)

      input = container.querySelector('input')
      expect(input).not.toHaveClass('error')
    })
  })

  describe('Touch Feedback', () => {
    it('should_apply_touch_feedback_props_to_input', () => {
      const useTouchFeedback =
        require('@/hooks/mobile/useTouchFeedback').useTouchFeedback
      const mockTouchProps = {
        onTouchStart: jest.fn(),
        onTouchEnd: jest.fn(),
      }
      useTouchFeedback.mockReturnValue({ touchProps: mockTouchProps })

      const { container } = render(<MobileFormField {...defaultProps} />)

      const input = container.querySelector('input')
      fireEvent.touchStart(input!)

      expect(mockTouchProps.onTouchStart).toHaveBeenCalled()
    })

    it('should_apply_touch_feedback_props_to_textarea', () => {
      const useTouchFeedback =
        require('@/hooks/mobile/useTouchFeedback').useTouchFeedback
      const mockTouchProps = {
        onTouchStart: jest.fn(),
        onTouchEnd: jest.fn(),
      }
      useTouchFeedback.mockReturnValue({ touchProps: mockTouchProps })

      const { container } = render(
        <MobileFormField {...defaultProps} type="textarea" />
      )

      const textarea = container.querySelector('textarea')
      fireEvent.touchStart(textarea!)

      expect(mockTouchProps.onTouchStart).toHaveBeenCalled()
    })

    it('should_receive_props_from_useTouchFeedback_hook', () => {
      const useTouchFeedback =
        require('@/hooks/mobile/useTouchFeedback').useTouchFeedback

      render(<MobileFormField {...defaultProps} />)

      expect(useTouchFeedback).toHaveBeenCalled()
    })
  })

  describe('Ref Forwarding', () => {
    it('should_forward_ref_to_input_element', () => {
      const ref = React.createRef<HTMLInputElement>()
      render(<MobileFormField {...defaultProps} ref={ref} />)

      expect(ref.current).toBeInstanceOf(HTMLInputElement)
    })

    it('should_forward_ref_to_textarea_element', () => {
      const ref = React.createRef<HTMLTextAreaElement>()
      render(<MobileFormField {...defaultProps} type="textarea" ref={ref} />)

      expect(ref.current).toBeInstanceOf(HTMLTextAreaElement)
    })

    it('should_allow_parent_to_focus_input_via_ref', () => {
      const ref = React.createRef<HTMLInputElement>()
      render(<MobileFormField {...defaultProps} ref={ref} />)

      ref.current?.focus()

      expect(document.activeElement).toBe(ref.current)
    })
  })

  describe('Accessibility', () => {
    it('should_associate_label_with_input_via_htmlFor', () => {
      const { container } = render(<MobileFormField {...defaultProps} />)

      const label = container.querySelector('label')
      const input = container.querySelector('input')

      expect(label).toHaveAttribute('for', input?.id)
    })

    it('should_have_proper_ARIA_attributes_for_required_fields', () => {
      render(<MobileFormField {...defaultProps} required={true} />)

      const input = screen.getByLabelText(/test field/i)
      expect(input).toHaveAttribute('required')
    })

    it('should_use_role_alert_for_error_messages', () => {
      render(<MobileFormField {...defaultProps} error="Error" />)

      const error = screen.getByRole('alert')
      expect(error).toBeInTheDocument()
    })
  })

  describe('CSS Classes', () => {
    it('should_apply_mobile_form_field_container_class', () => {
      const { container } = render(<MobileFormField {...defaultProps} />)

      const fieldContainer = container.querySelector('.mobile-form-field')
      expect(fieldContainer).toBeInTheDocument()
    })

    it('should_apply_mobile_form_label_class_to_label', () => {
      const { container } = render(<MobileFormField {...defaultProps} />)

      const label = container.querySelector('label')
      expect(label).toHaveClass('mobile-form-label')
    })

    it('should_apply_mobile_form_input_class_to_input', () => {
      const { container } = render(<MobileFormField {...defaultProps} />)

      const input = container.querySelector('input')
      expect(input).toHaveClass('mobile-form-input')
    })

    it('should_apply_mobile_form_textarea_class_to_textarea', () => {
      const { container } = render(
        <MobileFormField {...defaultProps} type="textarea" />
      )

      const textarea = container.querySelector('textarea')
      expect(textarea).toHaveClass('mobile-form-textarea')
    })

    it('should_apply_mobile_form_error_class_to_error_message', () => {
      const { container } = render(
        <MobileFormField {...defaultProps} error="Error" />
      )

      const error = container.querySelector('.mobile-form-error')
      expect(error).toBeInTheDocument()
    })
  })
})
