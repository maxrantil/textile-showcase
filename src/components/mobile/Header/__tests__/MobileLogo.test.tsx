// ABOUTME: Test suite for MobileLogo - Simple branding link component that navigates to home page

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { MobileLogo } from '../MobileLogo'
import { checkTouchTargetSize } from '../../../../../tests/utils/a11y-helpers'

// Mock Next.js Link
jest.mock('next/link', () => ({
  __esModule: true,
  default: function MockLink({
    children,
    href,
    className,
  }: {
    children: React.ReactNode
    href: string
    className?: string
  }) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    )
  },
}))

describe('MobileLogo', () => {
  describe('Rendering', () => {
    it('should_render_Next_Link_component', () => {
      render(<MobileLogo />)

      const link = screen.getByText('IDA ROMME')
      expect(link).toBeInTheDocument()
      expect(link.tagName).toBe('A')
    })

    it('should_link_to_root_path', () => {
      render(<MobileLogo />)

      const link = screen.getByText('IDA ROMME')
      expect(link).toHaveAttribute('href', '/')
    })

    it('should_display_IDA_ROMME_text', () => {
      render(<MobileLogo />)

      expect(screen.getByText('IDA ROMME')).toBeInTheDocument()
    })

    it('should_apply_mobile_logo_class', () => {
      render(<MobileLogo />)

      const link = screen.getByText('IDA ROMME')
      expect(link).toHaveClass('mobile-logo')
    })
  })

  describe('Styling', () => {
    it('should_apply_nordic_label_typography_class', () => {
      render(<MobileLogo />)

      const link = screen.getByText('IDA ROMME')
      expect(link).toHaveClass('nordic-label')
    })

    it('should_be_visually_consistent_with_brand', () => {
      render(<MobileLogo />)

      const link = screen.getByText('IDA ROMME')

      // Verify brand consistency by checking for required classes
      expect(link).toHaveClass('mobile-logo')
      expect(link).toHaveClass('nordic-label')

      // Verify brand name is correct
      expect(link).toHaveTextContent('IDA ROMME')
    })
  })

  describe('Accessibility', () => {
    it('should_be_keyboard_accessible', () => {
      render(<MobileLogo />)

      const link = screen.getByText('IDA ROMME')

      // Links are naturally keyboard accessible (focusable by default)
      link.focus()
      expect(document.activeElement).toBe(link)
    })

    it('should_have_adequate_touch_target_size', () => {
      const { container } = render(<MobileLogo />)

      const link = container.querySelector('.mobile-logo')
      expect(link).toBeInTheDocument()

      // Check touch target size (minimum 44x44px)
      if (link) {
        checkTouchTargetSize(link as HTMLElement)
      }
    })
  })

  describe('Navigation', () => {
    it('should_navigate_to_home_when_clicked', () => {
      render(<MobileLogo />)

      const link = screen.getByText('IDA ROMME')

      // Verify link points to home
      expect(link).toHaveAttribute('href', '/')

      // Simulate click
      fireEvent.click(link)

      // In real browser, this would navigate to home
      // In test environment, we verify the href is correct
    })

    it('should_work_from_any_page', () => {
      render(<MobileLogo />)

      const link = screen.getByText('IDA ROMME')

      // Logo should always link to home regardless of current page
      expect(link).toHaveAttribute('href', '/')

      // Component doesn't depend on current route, always links to "/"
      expect(link).toBeInTheDocument()
    })
  })
})
