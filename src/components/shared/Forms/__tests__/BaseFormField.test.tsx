// ABOUTME: Unit tests for BaseFormField — classPrefix desktop/mobile, input/textarea, errors, required, ref forwarding

import React, { createRef } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BaseFormField } from '../BaseFormField'

describe('BaseFormField', () => {
  describe('Desktop classPrefix', () => {
    it('should_apply_desktop_form_field_wrapper_class', () => {
      const { container } = render(
        <BaseFormField
          label="Name"
          type="text"
          classPrefix="desktop"
        />
      )

      expect(container.firstChild).toHaveClass('desktop-form-field')
    })

    it('should_apply_desktop_form_label_class', () => {
      render(<BaseFormField label="Name" type="text" classPrefix="desktop" />)

      expect(screen.getByText('Name')).toHaveClass('desktop-form-label')
    })

    it('should_apply_desktop_form_input_class_for_text_type', () => {
      render(<BaseFormField label="Name" type="text" classPrefix="desktop" />)

      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('desktop-form-input')
    })

    it('should_apply_desktop_form_textarea_class_for_textarea_type', () => {
      render(
        <BaseFormField label="Message" type="textarea" classPrefix="desktop" />
      )

      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveClass('desktop-form-textarea')
    })

    it('should_apply_desktop_form_error_class_to_error_span', () => {
      render(
        <BaseFormField
          label="Name"
          type="text"
          classPrefix="desktop"
          error="Required"
        />
      )

      expect(screen.getByText('Required')).toHaveClass('desktop-form-error')
    })
  })

  describe('Mobile classPrefix', () => {
    it('should_apply_mobile_form_field_wrapper_class', () => {
      const { container } = render(
        <BaseFormField
          label="Name"
          type="text"
          classPrefix="mobile"
        />
      )

      expect(container.firstChild).toHaveClass('mobile-form-field')
    })

    it('should_apply_mobile_form_label_class', () => {
      render(<BaseFormField label="Name" type="text" classPrefix="mobile" />)

      expect(screen.getByText('Name')).toHaveClass('mobile-form-label')
    })

    it('should_apply_mobile_form_input_class_for_text_type', () => {
      render(<BaseFormField label="Name" type="text" classPrefix="mobile" />)

      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('mobile-form-input')
    })

    it('should_apply_mobile_form_textarea_class_for_textarea_type', () => {
      render(
        <BaseFormField label="Message" type="textarea" classPrefix="mobile" />
      )

      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveClass('mobile-form-textarea')
    })
  })

  describe('Input type', () => {
    it('should_render_input_element_for_text_type', () => {
      render(<BaseFormField label="Name" type="text" classPrefix="desktop" />)

      const input = screen.getByRole('textbox')
      expect(input.tagName).toBe('INPUT')
      expect(input).toHaveAttribute('type', 'text')
    })

    it('should_render_input_element_for_email_type', () => {
      render(<BaseFormField label="Email" type="email" classPrefix="desktop" />)

      const input = screen.getByRole('textbox')
      expect(input.tagName).toBe('INPUT')
      expect(input).toHaveAttribute('type', 'email')
    })

    it('should_render_textarea_element_for_textarea_type', () => {
      render(
        <BaseFormField label="Message" type="textarea" classPrefix="desktop" />
      )

      const textarea = screen.getByRole('textbox')
      expect(textarea.tagName).toBe('TEXTAREA')
    })

    it('should_render_textarea_with_custom_rows', () => {
      render(
        <BaseFormField
          label="Message"
          type="textarea"
          classPrefix="desktop"
          rows={5}
        />
      )

      expect(screen.getByRole('textbox')).toHaveAttribute('rows', '5')
    })
  })

  describe('Label and ID association', () => {
    it('should_associate_label_with_input_via_htmlFor', () => {
      render(<BaseFormField label="Name" type="text" classPrefix="desktop" />)

      const input = screen.getByLabelText('Name')
      expect(input).toBeInTheDocument()
    })

    it('should_associate_label_with_email_input', () => {
      render(
        <BaseFormField label="Email" type="email" classPrefix="desktop" />
      )

      expect(screen.getByLabelText('Email')).toBeInTheDocument()
    })

    it('should_generate_id_from_label_text_lowercased', () => {
      render(<BaseFormField label="My Field" type="text" classPrefix="desktop" />)

      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('id', 'field-my-field')
    })
  })

  describe('Required indicator', () => {
    it('should_show_required_asterisk_when_required_true', () => {
      render(
        <BaseFormField
          label="Name"
          type="text"
          classPrefix="desktop"
          required
        />
      )

      expect(screen.getByText('*')).toBeInTheDocument()
    })

    it('should_not_show_required_asterisk_when_required_false', () => {
      render(
        <BaseFormField
          label="Name"
          type="text"
          classPrefix="desktop"
          required={false}
        />
      )

      expect(screen.queryByText('*')).not.toBeInTheDocument()
    })

    it('should_pass_required_attribute_to_input', () => {
      render(
        <BaseFormField
          label="Name"
          type="text"
          classPrefix="desktop"
          required
        />
      )

      expect(screen.getByRole('textbox')).toBeRequired()
    })
  })

  describe('Error display', () => {
    it('should_show_error_message_when_error_prop_provided', () => {
      render(
        <BaseFormField
          label="Name"
          type="text"
          classPrefix="desktop"
          error="This field is required"
        />
      )

      expect(screen.getByText('This field is required')).toBeInTheDocument()
    })

    it('should_not_show_error_span_when_no_error', () => {
      render(
        <BaseFormField label="Name" type="text" classPrefix="desktop" />
      )

      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    it('should_add_error_class_to_input_when_error_present', () => {
      render(
        <BaseFormField
          label="Name"
          type="text"
          classPrefix="desktop"
          error="Required"
        />
      )

      expect(screen.getByRole('textbox')).toHaveClass('error')
    })

    it('should_apply_error_role_to_error_span_when_errorRole_alert', () => {
      render(
        <BaseFormField
          label="Name"
          type="text"
          classPrefix="mobile"
          error="Required"
          errorRole="alert"
        />
      )

      expect(screen.getByRole('alert')).toHaveTextContent('Required')
    })
  })

  describe('Value and onChange', () => {
    it('should_display_provided_value', () => {
      render(
        <BaseFormField
          label="Name"
          type="text"
          classPrefix="desktop"
          value="Alice"
          onChange={jest.fn()}
        />
      )

      expect(screen.getByRole('textbox')).toHaveValue('Alice')
    })

    it('should_call_onChange_with_new_value_on_input', async () => {
      const user = userEvent.setup()
      const onChange = jest.fn()

      render(
        <BaseFormField
          label="Name"
          type="text"
          classPrefix="desktop"
          value=""
          onChange={onChange}
        />
      )

      await user.type(screen.getByRole('textbox'), 'A')

      expect(onChange).toHaveBeenCalledWith('A')
    })
  })

  describe('Placeholder', () => {
    it('should_apply_placeholder_to_input', () => {
      render(
        <BaseFormField
          label="Name"
          type="text"
          classPrefix="desktop"
          placeholder="Enter your name"
        />
      )

      expect(screen.getByPlaceholderText('Enter your name')).toBeInTheDocument()
    })
  })

  describe('Ref forwarding', () => {
    it('should_forward_ref_to_input_element', () => {
      const ref = createRef<HTMLInputElement | HTMLTextAreaElement>()

      render(
        <BaseFormField
          ref={ref}
          label="Name"
          type="text"
          classPrefix="desktop"
        />
      )

      expect(ref.current).toBeInstanceOf(HTMLInputElement)
    })

    it('should_forward_ref_to_textarea_element', () => {
      const ref = createRef<HTMLInputElement | HTMLTextAreaElement>()

      render(
        <BaseFormField
          ref={ref}
          label="Message"
          type="textarea"
          classPrefix="desktop"
        />
      )

      expect(ref.current).toBeInstanceOf(HTMLTextAreaElement)
    })
  })

  describe('Extra props passthrough', () => {
    it('should_pass_extraInputProps_to_input', () => {
      render(
        <BaseFormField
          label="Name"
          type="text"
          classPrefix="desktop"
          extraInputProps={{ autoComplete: 'name', 'data-testid': 'name-input' } as React.InputHTMLAttributes<HTMLInputElement>}
        />
      )

      const input = screen.getByTestId('name-input')
      expect(input).toHaveAttribute('autocomplete', 'name')
    })

    it('should_pass_extraTextareaProps_to_textarea', () => {
      render(
        <BaseFormField
          label="Message"
          type="textarea"
          classPrefix="desktop"
          extraTextareaProps={{ 'data-testid': 'msg-textarea' } as React.TextareaHTMLAttributes<HTMLTextAreaElement>}
        />
      )

      expect(screen.getByTestId('msg-textarea')).toBeInTheDocument()
    })
  })
})
