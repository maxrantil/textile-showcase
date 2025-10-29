// ABOUTME: Test suite for MobileButton - Reusable button component with variants, loading states, and haptic feedback

import React, { createRef } from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { MobileButton } from '../MobileButton'

// Mock navigator.vibrate
const mockVibrate = jest.fn()

describe('MobileButton', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Setup navigator.vibrate mock
    Object.defineProperty(navigator, 'vibrate', {
      value: mockVibrate,
      writable: true,
      configurable: true,
    })
  })

  describe('Rendering', () => {
    it('should_render_button_with_children_content', () => {
      render(<MobileButton>Click Me</MobileButton>)

      expect(screen.getByText('Click Me')).toBeInTheDocument()
    })

    it('should_apply_nordic_btn_base_class', () => {
      render(<MobileButton>Button</MobileButton>)

      const button = screen.getByText('Button')
      expect(button).toHaveClass('nordic-btn')
    })

    it('should_forward_ref_to_button_element', () => {
      const ref = createRef<HTMLButtonElement>()

      render(<MobileButton ref={ref}>Button</MobileButton>)

      expect(ref.current).toBeInstanceOf(HTMLButtonElement)
      expect(ref.current?.tagName).toBe('BUTTON')
    })

    it('should_apply_custom_className_prop', () => {
      render(<MobileButton className="custom-class">Button</MobileButton>)

      const button = screen.getByText('Button')
      expect(button).toHaveClass('custom-class')
      expect(button).toHaveClass('nordic-btn')
    })

    it('should_merge_custom_styles_with_default_styles', () => {
      render(
        <MobileButton style={{ backgroundColor: 'red', padding: '20px' }}>
          Button
        </MobileButton>
      )

      const button = screen.getByText('Button')
      // Verify the style attribute contains the custom and default styles
      const styleAttr = button.getAttribute('style') || ''
      expect(styleAttr).toContain('background-color')
      expect(styleAttr).toContain('padding')
      expect(styleAttr).toContain('min-height')
    })

    it('should_set_default_type_button', () => {
      render(<MobileButton>Button</MobileButton>)

      const button = screen.getByText('Button')
      expect(button).toHaveAttribute('type', 'button')
    })
  })

  describe('Variants', () => {
    it('should_apply_nordic_btn_primary_class_for_primary_variant', () => {
      render(<MobileButton variant="primary">Primary</MobileButton>)

      const button = screen.getByText('Primary')
      expect(button).toHaveClass('nordic-btn-primary')
    })

    it('should_apply_nordic_btn_secondary_class_for_secondary_variant', () => {
      render(<MobileButton variant="secondary">Secondary</MobileButton>)

      const button = screen.getByText('Secondary')
      expect(button).toHaveClass('nordic-btn-secondary')
    })

    it('should_apply_nordic_btn_ghost_class_for_ghost_variant', () => {
      render(<MobileButton variant="ghost">Ghost</MobileButton>)

      const button = screen.getByText('Ghost')
      expect(button).toHaveClass('nordic-btn-ghost')
    })

    it('should_apply_nordic_btn_submit_class_for_submit_variant', () => {
      render(<MobileButton variant="submit">Submit</MobileButton>)

      const button = screen.getByText('Submit')
      expect(button).toHaveClass('nordic-btn-submit')
    })

    it('should_default_to_primary_variant_when_not_specified', () => {
      render(<MobileButton>Default</MobileButton>)

      const button = screen.getByText('Default')
      expect(button).toHaveClass('nordic-btn-primary')
    })
  })

  describe('Sizes', () => {
    it('should_apply_nordic_btn_sm_class_for_small_size', () => {
      render(<MobileButton size="small">Small</MobileButton>)

      const button = screen.getByText('Small')
      expect(button).toHaveClass('nordic-btn-sm')
    })

    it('should_apply_nordic_btn_lg_class_for_large_size', () => {
      render(<MobileButton size="large">Large</MobileButton>)

      const button = screen.getByText('Large')
      expect(button).toHaveClass('nordic-btn-lg')
    })

    it('should_apply_no_size_class_for_medium_default', () => {
      render(<MobileButton size="medium">Medium</MobileButton>)

      const button = screen.getByText('Medium')
      expect(button).toHaveClass('nordic-btn')
      expect(button).not.toHaveClass('nordic-btn-sm')
      expect(button).not.toHaveClass('nordic-btn-lg')
    })

    it('should_set_minimum_height_44px_for_touch_targets', () => {
      render(<MobileButton>Touch Target</MobileButton>)

      const button = screen.getByText('Touch Target')
      expect(button).toHaveStyle({ minHeight: '44px' })
    })
  })

  describe('Loading State', () => {
    it('should_display_loading_text_when_loading_true', () => {
      render(<MobileButton loading={true}>Submit</MobileButton>)

      expect(screen.getByText('Loading...')).toBeInTheDocument()
      expect(screen.queryByText('Submit')).not.toBeInTheDocument()
    })

    it('should_apply_nordic_btn_loading_class_when_loading', () => {
      render(<MobileButton loading={true}>Button</MobileButton>)

      const button = screen.getByText('Loading...')
      expect(button).toHaveClass('nordic-btn-loading')
    })

    it('should_disable_button_when_loading_true', () => {
      render(<MobileButton loading={true}>Loading Button</MobileButton>)

      const button = screen.getByText('Loading...')
      expect(button).toBeDisabled()
    })

    it('should_not_trigger_onClick_when_loading', () => {
      const mockOnClick = jest.fn()

      render(
        <MobileButton loading={true} onClick={mockOnClick}>
          Submit
        </MobileButton>
      )

      const button = screen.getByText('Loading...')
      fireEvent.click(button)

      expect(mockOnClick).not.toHaveBeenCalled()
    })

    it('should_not_trigger_haptic_feedback_when_loading', () => {
      render(
        <MobileButton loading={true} hapticFeedback={true}>
          Submit
        </MobileButton>
      )

      const button = screen.getByText('Loading...')
      fireEvent.click(button)

      expect(mockVibrate).not.toHaveBeenCalled()
    })
  })

  describe('Disabled State', () => {
    it('should_disable_button_when_disabled_prop_true', () => {
      render(<MobileButton disabled={true}>Disabled Button</MobileButton>)

      const button = screen.getByText('Disabled Button')
      expect(button).toBeDisabled()
    })

    it('should_not_trigger_onClick_when_disabled', () => {
      const mockOnClick = jest.fn()

      render(
        <MobileButton disabled={true} onClick={mockOnClick}>
          Disabled
        </MobileButton>
      )

      const button = screen.getByText('Disabled')
      fireEvent.click(button)

      expect(mockOnClick).not.toHaveBeenCalled()
    })

    it('should_not_trigger_haptic_feedback_when_disabled', () => {
      render(
        <MobileButton disabled={true} hapticFeedback={true}>
          Disabled
        </MobileButton>
      )

      const button = screen.getByText('Disabled')
      fireEvent.click(button)

      expect(mockVibrate).not.toHaveBeenCalled()
    })
  })

  describe('Haptic Feedback', () => {
    it('should_trigger_haptic_vibration_on_click_when_supported', () => {
      render(<MobileButton hapticFeedback={true}>Haptic Button</MobileButton>)

      const button = screen.getByText('Haptic Button')
      fireEvent.click(button)

      expect(mockVibrate).toHaveBeenCalledTimes(1)
      expect(mockVibrate).toHaveBeenCalledWith(50)
    })

    it('should_not_trigger_haptic_when_hapticFeedback_false', () => {
      render(
        <MobileButton hapticFeedback={false}>No Haptic Button</MobileButton>
      )

      const button = screen.getByText('No Haptic Button')
      fireEvent.click(button)

      expect(mockVibrate).not.toHaveBeenCalled()
    })

    it('should_handle_missing_vibrate_API_gracefully', () => {
      // Remove vibrate API
      Object.defineProperty(navigator, 'vibrate', {
        value: undefined,
        writable: true,
        configurable: true,
      })

      render(<MobileButton hapticFeedback={true}>Button</MobileButton>)

      const button = screen.getByText('Button')

      // Should not throw error when vibrate API is not available
      expect(() => {
        fireEvent.click(button)
      }).not.toThrow()
    })

    it('should_vibrate_for_50ms_light_feedback', () => {
      render(<MobileButton>Vibrate Button</MobileButton>)

      const button = screen.getByText('Vibrate Button')
      fireEvent.click(button)

      expect(mockVibrate).toHaveBeenCalledWith(50)
    })
  })

  describe('Full Width', () => {
    it('should_set_width_100_percent_when_fullWidth_true', () => {
      render(<MobileButton fullWidth={true}>Full Width</MobileButton>)

      const button = screen.getByText('Full Width')
      expect(button).toHaveStyle({ width: '100%' })
    })

    it('should_set_width_auto_when_fullWidth_false', () => {
      render(<MobileButton fullWidth={false}>Auto Width</MobileButton>)

      const button = screen.getByText('Auto Width')
      expect(button).toHaveStyle({ width: 'auto' })
    })
  })
})
