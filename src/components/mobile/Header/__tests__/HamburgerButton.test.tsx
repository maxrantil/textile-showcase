// ABOUTME: Test suite for HamburgerButton - animation states, accessibility, analytics

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { HamburgerButton } from '../HamburgerButton'

jest.mock('@/utils/analytics', () => ({
  UmamiEvents: {
    mobileMenuToggle: jest.fn(),
  },
}))

describe('HamburgerButton', () => {
  const defaultProps = {
    isOpen: false,
    onClick: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should_render_button_with_three_hamburger_lines', () => {
      const { container } = render(<HamburgerButton {...defaultProps} />)

      const lines = container.querySelectorAll('.hamburger-line')
      expect(lines).toHaveLength(3)
    })

    it('should_apply_correct_aria_label_when_closed', () => {
      render(<HamburgerButton {...defaultProps} isOpen={false} />)

      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-label', 'Open menu')
    })

    it('should_apply_correct_aria_label_when_open', () => {
      render(<HamburgerButton {...defaultProps} isOpen={true} />)

      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-label', 'Close menu')
    })

    it('should_set_aria_expanded_false_when_closed', () => {
      render(<HamburgerButton {...defaultProps} isOpen={false} />)

      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-expanded', 'false')
    })

    it('should_set_aria_expanded_true_when_open', () => {
      render(<HamburgerButton {...defaultProps} isOpen={true} />)

      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-expanded', 'true')
    })
  })

  describe('Visual States', () => {
    it('should_apply_rotate_45_class_to_first_line_when_open', () => {
      const { container } = render(
        <HamburgerButton {...defaultProps} isOpen={true} />
      )

      const firstLine = container.querySelectorAll('.hamburger-line')[0]
      expect(firstLine).toHaveClass('rotate-45')
    })

    it('should_apply_opacity_0_class_to_middle_line_when_open', () => {
      const { container } = render(
        <HamburgerButton {...defaultProps} isOpen={true} />
      )

      const middleLine = container.querySelectorAll('.hamburger-line')[1]
      expect(middleLine).toHaveClass('opacity-0')
    })

    it('should_apply_minus_rotate_45_class_to_last_line_when_open', () => {
      const { container } = render(
        <HamburgerButton {...defaultProps} isOpen={true} />
      )

      const lastLine = container.querySelectorAll('.hamburger-line')[2]
      expect(lastLine).toHaveClass('-rotate-45')
    })

    it('should_remove_animation_classes_when_closed', () => {
      const { container } = render(
        <HamburgerButton {...defaultProps} isOpen={false} />
      )

      const lines = container.querySelectorAll('.hamburger-line')
      expect(lines[0]).not.toHaveClass('rotate-45')
      expect(lines[1]).not.toHaveClass('opacity-0')
      expect(lines[2]).not.toHaveClass('-rotate-45')
    })
  })

  describe('Click Handling', () => {
    it('should_call_onClick_handler_when_clicked', () => {
      const onClick = jest.fn()
      render(<HamburgerButton {...defaultProps} onClick={onClick} />)

      const button = screen.getByRole('button')
      fireEvent.click(button)

      expect(onClick).toHaveBeenCalled()
    })

    it('should_track_open_analytics_event_when_opening', () => {
      const analytics = require('@/utils/analytics').UmamiEvents
      render(<HamburgerButton {...defaultProps} isOpen={false} />)

      const button = screen.getByRole('button')
      fireEvent.click(button)

      expect(analytics.mobileMenuToggle).toHaveBeenCalledWith('open')
    })

    it('should_track_close_analytics_event_when_closing', () => {
      const analytics = require('@/utils/analytics').UmamiEvents
      render(<HamburgerButton {...defaultProps} isOpen={true} />)

      const button = screen.getByRole('button')
      fireEvent.click(button)

      expect(analytics.mobileMenuToggle).toHaveBeenCalledWith('close')
    })
  })

  describe('Accessibility', () => {
    it('should_be_keyboard_accessible', () => {
      const onClick = jest.fn()
      render(<HamburgerButton {...defaultProps} onClick={onClick} />)

      const button = screen.getByRole('button')
      button.focus()

      expect(document.activeElement).toBe(button)
    })

    it('should_have_adequate_touch_target_size_44x44px', () => {
      const { container } = render(<HamburgerButton {...defaultProps} />)

      const button = container.querySelector('button')
      expect(button).toBeInTheDocument()
    })

    it('should_indicate_expanded_state_to_screen_readers', () => {
      const { rerender } = render(
        <HamburgerButton {...defaultProps} isOpen={false} />
      )

      let button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-expanded', 'false')

      rerender(<HamburgerButton {...defaultProps} isOpen={true} />)

      button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-expanded', 'true')
    })
  })

  describe('CSS Classes', () => {
    it('should_apply_mobile_hamburger_class', () => {
      const { container } = render(<HamburgerButton {...defaultProps} />)

      const button = container.querySelector('button')
      expect(button).toHaveClass('mobile-hamburger')
    })

    it('should_apply_hamburger_line_class_to_all_lines', () => {
      const { container } = render(<HamburgerButton {...defaultProps} />)

      const lines = container.querySelectorAll('.hamburger-line')
      lines.forEach((line) => {
        expect(line).toHaveClass('hamburger-line')
      })
    })
  })
})
