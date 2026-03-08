// ABOUTME: Unit tests for DesktopButton — variants, sizes, loading state, disabled state, fullWidth, ref forwarding

import React, { createRef } from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { DesktopButton } from '../DesktopButton'

describe('DesktopButton', () => {
  describe('Rendering', () => {
    it('should_render_button_with_children_content', () => {
      render(<DesktopButton>Click Me</DesktopButton>)

      expect(screen.getByText('Click Me')).toBeInTheDocument()
    })

    it('should_apply_nordic_btn_base_class', () => {
      render(<DesktopButton>Button</DesktopButton>)

      const button = screen.getByText('Button')
      expect(button).toHaveClass('nordic-btn')
    })

    it('should_forward_ref_to_button_element', () => {
      const ref = createRef<HTMLButtonElement>()

      render(<DesktopButton ref={ref}>Button</DesktopButton>)

      expect(ref.current).toBeInstanceOf(HTMLButtonElement)
      expect(ref.current?.tagName).toBe('BUTTON')
    })

    it('should_apply_custom_className_prop', () => {
      render(<DesktopButton className="custom-class">Button</DesktopButton>)

      const button = screen.getByText('Button')
      expect(button).toHaveClass('custom-class')
      expect(button).toHaveClass('nordic-btn')
    })

    it('should_merge_custom_styles_with_default_styles', () => {
      render(
        <DesktopButton style={{ backgroundColor: 'red' }}>Button</DesktopButton>
      )

      const button = screen.getByText('Button')
      const styleAttr = button.getAttribute('style') || ''
      expect(styleAttr).toContain('background-color')
    })

    it('should_set_default_type_button', () => {
      render(<DesktopButton>Button</DesktopButton>)

      const button = screen.getByText('Button')
      expect(button).toHaveAttribute('type', 'button')
    })

    it('should_set_type_submit_when_specified', () => {
      render(<DesktopButton type="submit">Submit</DesktopButton>)

      const button = screen.getByText('Submit')
      expect(button).toHaveAttribute('type', 'submit')
    })
  })

  describe('Variants', () => {
    it('should_apply_nordic_btn_primary_class_for_primary_variant', () => {
      render(<DesktopButton variant="primary">Primary</DesktopButton>)

      const button = screen.getByText('Primary')
      expect(button).toHaveClass('nordic-btn-primary')
    })

    it('should_apply_nordic_btn_secondary_class_for_secondary_variant', () => {
      render(<DesktopButton variant="secondary">Secondary</DesktopButton>)

      const button = screen.getByText('Secondary')
      expect(button).toHaveClass('nordic-btn-secondary')
    })

    it('should_apply_nordic_btn_ghost_class_for_ghost_variant', () => {
      render(<DesktopButton variant="ghost">Ghost</DesktopButton>)

      const button = screen.getByText('Ghost')
      expect(button).toHaveClass('nordic-btn-ghost')
    })

    it('should_apply_nordic_btn_submit_class_for_submit_variant', () => {
      render(<DesktopButton variant="submit">Submit</DesktopButton>)

      const button = screen.getByText('Submit')
      expect(button).toHaveClass('nordic-btn-submit')
    })

    it('should_default_to_primary_variant_when_not_specified', () => {
      render(<DesktopButton>Default</DesktopButton>)

      const button = screen.getByText('Default')
      expect(button).toHaveClass('nordic-btn-primary')
    })
  })

  describe('Sizes', () => {
    it('should_apply_nordic_btn_sm_class_for_small_size', () => {
      render(<DesktopButton size="small">Small</DesktopButton>)

      const button = screen.getByText('Small')
      expect(button).toHaveClass('nordic-btn-sm')
    })

    it('should_apply_nordic_btn_lg_class_for_large_size', () => {
      render(<DesktopButton size="large">Large</DesktopButton>)

      const button = screen.getByText('Large')
      expect(button).toHaveClass('nordic-btn-lg')
    })

    it('should_apply_no_size_class_for_medium_default', () => {
      render(<DesktopButton size="medium">Medium</DesktopButton>)

      const button = screen.getByText('Medium')
      expect(button).toHaveClass('nordic-btn')
      expect(button).not.toHaveClass('nordic-btn-sm')
      expect(button).not.toHaveClass('nordic-btn-lg')
    })
  })

  describe('Loading State', () => {
    it('should_display_default_loading_text_Sending_when_loading_true', () => {
      render(<DesktopButton loading={true}>Submit</DesktopButton>)

      expect(screen.getByText('Sending...')).toBeInTheDocument()
      expect(screen.queryByText('Submit')).not.toBeInTheDocument()
    })

    it('should_display_custom_loadingText_when_provided', () => {
      render(
        <DesktopButton loading={true} loadingText="Please wait...">
          Submit
        </DesktopButton>
      )

      expect(screen.getByText('Please wait...')).toBeInTheDocument()
      expect(screen.queryByText('Submit')).not.toBeInTheDocument()
    })

    it('should_apply_nordic_btn_loading_class_when_loading', () => {
      render(<DesktopButton loading={true}>Button</DesktopButton>)

      const button = screen.getByText('Sending...')
      expect(button).toHaveClass('nordic-btn-loading')
    })

    it('should_disable_button_when_loading_true', () => {
      render(<DesktopButton loading={true}>Loading Button</DesktopButton>)

      const button = screen.getByText('Sending...')
      expect(button).toBeDisabled()
    })

    it('should_not_trigger_onClick_when_loading', () => {
      const mockOnClick = jest.fn()

      render(
        <DesktopButton loading={true} onClick={mockOnClick}>
          Submit
        </DesktopButton>
      )

      const button = screen.getByText('Sending...')
      fireEvent.click(button)

      expect(mockOnClick).not.toHaveBeenCalled()
    })

    it('should_show_children_when_loading_false', () => {
      render(<DesktopButton loading={false}>Submit</DesktopButton>)

      expect(screen.getByText('Submit')).toBeInTheDocument()
      expect(screen.queryByText('Sending...')).not.toBeInTheDocument()
    })
  })

  describe('Disabled State', () => {
    it('should_disable_button_when_disabled_prop_true', () => {
      render(<DesktopButton disabled={true}>Disabled Button</DesktopButton>)

      const button = screen.getByText('Disabled Button')
      expect(button).toBeDisabled()
    })

    it('should_not_trigger_onClick_when_disabled', () => {
      const mockOnClick = jest.fn()

      render(
        <DesktopButton disabled={true} onClick={mockOnClick}>
          Disabled
        </DesktopButton>
      )

      const button = screen.getByText('Disabled')
      fireEvent.click(button)

      expect(mockOnClick).not.toHaveBeenCalled()
    })
  })

  describe('Full Width', () => {
    it('should_set_width_100_percent_when_fullWidth_true', () => {
      render(<DesktopButton fullWidth={true}>Full Width</DesktopButton>)

      const button = screen.getByText('Full Width')
      expect(button).toHaveStyle({ width: '100%' })
    })

    it('should_set_width_auto_when_fullWidth_false', () => {
      render(<DesktopButton fullWidth={false}>Auto Width</DesktopButton>)

      const button = screen.getByText('Auto Width')
      expect(button).toHaveStyle({ width: 'auto' })
    })
  })
})
