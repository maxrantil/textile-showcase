// ABOUTME: Test suite for MobileNavLink - Simple navigation link component with active state highlighting

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { MobileNavLink } from '../MobileNavLink'
import { checkTouchTargetSize } from '../../../../../tests/utils/a11y-helpers'

// Mock Next.js Link
jest.mock('next/link', () => ({
  __esModule: true,
  default: function MockLink({
    children,
    href,
    onClick,
    className,
  }: {
    children: React.ReactNode
    href: string
    onClick?: () => void
    className?: string
  }) {
    return (
      <a href={href} onClick={onClick} className={className}>
        {children}
      </a>
    )
  },
}))

describe('MobileNavLink', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should_render_Next_Link_with_correct_href', () => {
      render(<MobileNavLink href="/about">About</MobileNavLink>)

      const link = screen.getByText('About')
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', '/about')
    })

    it('should_render_children_content', () => {
      render(
        <MobileNavLink href="/contact">
          <span>Contact Us</span>
        </MobileNavLink>
      )

      expect(screen.getByText('Contact Us')).toBeInTheDocument()
    })

    it('should_apply_mobile_nav_link_base_class', () => {
      render(<MobileNavLink href="/gallery">Gallery</MobileNavLink>)

      const link = screen.getByText('Gallery')
      expect(link).toHaveClass('mobile-nav-link')
    })

    it('should_apply_nordic_h3_typography_class', () => {
      render(<MobileNavLink href="/home">Home</MobileNavLink>)

      const link = screen.getByText('Home')
      expect(link).toHaveClass('nordic-h3')
    })
  })

  describe('Active State', () => {
    it('should_apply_active_class_when_isActive_true', () => {
      render(
        <MobileNavLink href="/about" isActive={true}>
          About
        </MobileNavLink>
      )

      const link = screen.getByText('About')
      expect(link).toHaveClass('active')
      expect(link).toHaveClass('mobile-nav-link')
      expect(link).toHaveClass('nordic-h3')
    })

    it('should_not_apply_active_class_when_isActive_false', () => {
      render(
        <MobileNavLink href="/about" isActive={false}>
          About
        </MobileNavLink>
      )

      const link = screen.getByText('About')
      expect(link).not.toHaveClass('active')
      expect(link).toHaveClass('mobile-nav-link')
    })

    it('should_handle_undefined_isActive_prop', () => {
      render(<MobileNavLink href="/contact">Contact</MobileNavLink>)

      const link = screen.getByText('Contact')
      expect(link).not.toHaveClass('active')
      expect(link).toHaveClass('mobile-nav-link')
    })
  })

  describe('Click Handling', () => {
    it('should_call_onClick_handler_when_clicked', () => {
      const mockOnClick = jest.fn()

      render(
        <MobileNavLink href="/gallery" onClick={mockOnClick}>
          Gallery
        </MobileNavLink>
      )

      const link = screen.getByText('Gallery')
      fireEvent.click(link)

      expect(mockOnClick).toHaveBeenCalledTimes(1)
    })

    it('should_navigate_to_href_when_clicked', () => {
      render(<MobileNavLink href="/projects">Projects</MobileNavLink>)

      const link = screen.getByText('Projects')
      expect(link).toHaveAttribute('href', '/projects')

      // Verify link is clickable
      fireEvent.click(link)
      // In real browser, this would navigate to /projects
      // In test environment, we just verify the href is set correctly
    })
  })

  describe('Accessibility', () => {
    it('should_be_keyboard_accessible', () => {
      render(<MobileNavLink href="/about">About</MobileNavLink>)

      const link = screen.getByText('About')

      // Links are naturally keyboard accessible (focusable by default)
      link.focus()
      expect(document.activeElement).toBe(link)
    })

    it('should_have_adequate_touch_target_size', () => {
      const { container } = render(
        <MobileNavLink href="/contact">Contact</MobileNavLink>
      )

      const link = container.querySelector('.mobile-nav-link')
      expect(link).toBeInTheDocument()

      // Check touch target size (minimum 44x44px)
      if (link) {
        checkTouchTargetSize(link as HTMLElement)
      }
    })
  })
})
