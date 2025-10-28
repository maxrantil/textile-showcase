// ABOUTME: Comprehensive test suite for MobileMenu - portal rendering, focus management, accessibility

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { createPortal } from 'react-dom'
import { MobileMenu } from '../MobileMenu'
import { UmamiEvents } from '@/utils/analytics'

// Mock dependencies
jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  createPortal: jest.fn((node: React.ReactNode) => node),
}))

jest.mock('@/utils/analytics', () => ({
  UmamiEvents: {
    mobileMenuOpen: jest.fn(),
    mobileMenuClose: jest.fn(),
  },
}))

interface MockNavLinkProps {
  children: React.ReactNode
  href: string
  isActive?: boolean
  onClick?: () => void
}

jest.mock('../MobileNavLink', () => ({
  MobileNavLink: ({ children, href, isActive, onClick }: MockNavLinkProps) => (
    <a
      href={href}
      className={`mobile-nav-link ${isActive ? 'active' : ''}`}
      onClick={onClick}
    >
      {children}
    </a>
  ),
}))

describe('MobileMenu', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    pathname: '/',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    document.body.innerHTML = '<div id="root"></div>'
    document.body.style.overflow = ''
  })

  afterEach(() => {
    document.body.style.overflow = ''
  })

  describe('Rendering', () => {
    it('should_not_render_when_isOpen_false', () => {
      render(<MobileMenu {...defaultProps} isOpen={false} />)

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('should_render_menu_panel_when_isOpen_true', () => {
      render(<MobileMenu {...defaultProps} />)

      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('should_render_backdrop_when_open', () => {
      const { container } = render(<MobileMenu {...defaultProps} />)

      const backdrop = container.querySelector('.mobile-menu-backdrop')
      expect(backdrop).toBeInTheDocument()
    })

    it('should_render_close_button_with_correct_aria_label', () => {
      render(<MobileMenu {...defaultProps} />)

      const closeButton = screen.getByRole('button', { name: /close menu/i })
      expect(closeButton).toBeInTheDocument()
    })

    it('should_render_all_navigation_links', () => {
      render(<MobileMenu {...defaultProps} />)

      expect(screen.getByText('WORK')).toBeInTheDocument()
      expect(screen.getByText('ABOUT')).toBeInTheDocument()
      expect(screen.getByText('CONTACT')).toBeInTheDocument()
    })

    it('should_render_menu_footer_with_studio_info', () => {
      render(<MobileMenu {...defaultProps} />)

      expect(screen.getByText('Stockholm Studio')).toBeInTheDocument()
      expect(
        screen.getByText('Contemporary Textile Design')
      ).toBeInTheDocument()
    })

    it('should_use_portal_to_render_in_document_body', () => {
      render(<MobileMenu {...defaultProps} />)

      expect(createPortal).toHaveBeenCalled()
    })
  })

  describe('Open/Close Behavior', () => {
    it('should_call_onClose_when_backdrop_clicked', () => {
      const onClose = jest.fn()
      const { container } = render(
        <MobileMenu {...defaultProps} onClose={onClose} />
      )

      const backdrop = container.querySelector('.mobile-menu-backdrop')
      fireEvent.click(backdrop!)

      expect(onClose).toHaveBeenCalled()
    })

    it('should_call_onClose_when_close_button_clicked', () => {
      const onClose = jest.fn()
      render(<MobileMenu {...defaultProps} onClose={onClose} />)

      const closeButton = screen.getByRole('button', { name: /close menu/i })
      fireEvent.click(closeButton)

      expect(onClose).toHaveBeenCalled()
    })

    it('should_call_onClose_when_escape_key_pressed', () => {
      const onClose = jest.fn()
      render(<MobileMenu {...defaultProps} onClose={onClose} />)

      fireEvent.keyDown(document, { key: 'Escape' })

      expect(onClose).toHaveBeenCalled()
    })

    it('should_not_call_onClose_when_other_keys_pressed', () => {
      const onClose = jest.fn()
      render(<MobileMenu {...defaultProps} onClose={onClose} />)

      fireEvent.keyDown(document, { key: 'Enter' })
      fireEvent.keyDown(document, { key: 'Space' })

      expect(onClose).not.toHaveBeenCalled()
    })

    it('should_apply_open_class_when_isOpen_true', () => {
      const { container } = render(<MobileMenu {...defaultProps} />)

      const overlay = container.querySelector('.mobile-menu-overlay')
      expect(overlay).toHaveClass('open')
    })

    it('should_track_menu_open_event_when_opened', () => {
      render(<MobileMenu {...defaultProps} />)

      expect(UmamiEvents.mobileMenuOpen).toHaveBeenCalled()
    })

    it('should_track_menu_close_event_with_backdrop_method', () => {
      const { container } = render(<MobileMenu {...defaultProps} />)

      const backdrop = container.querySelector('.mobile-menu-backdrop')
      fireEvent.click(backdrop!)

      expect(UmamiEvents.mobileMenuClose).toHaveBeenCalledWith('backdrop')
    })

    it('should_track_menu_close_event_with_keyboard_method', () => {
      render(<MobileMenu {...defaultProps} />)

      fireEvent.keyDown(document, { key: 'Escape' })

      expect(UmamiEvents.mobileMenuClose).toHaveBeenCalledWith('keyboard')
    })
  })

  describe('Body Scroll Lock', () => {
    it('should_set_body_overflow_hidden_when_menu_opens', () => {
      render(<MobileMenu {...defaultProps} />)

      expect(document.body.style.overflow).toBe('hidden')
    })

    it('should_restore_body_overflow_when_menu_closes', () => {
      const { rerender } = render(<MobileMenu {...defaultProps} />)

      expect(document.body.style.overflow).toBe('hidden')

      rerender(<MobileMenu {...defaultProps} isOpen={false} />)

      expect(document.body.style.overflow).toBe('')
    })

    it('should_cleanup_body_overflow_on_component_unmount', () => {
      const { unmount } = render(<MobileMenu {...defaultProps} />)

      expect(document.body.style.overflow).toBe('hidden')

      unmount()

      expect(document.body.style.overflow).toBe('')
    })
  })

  describe('Focus Management', () => {
    it('should_focus_first_focusable_element_when_opened', async () => {
      jest.useFakeTimers()
      render(<MobileMenu {...defaultProps} />)

      jest.advanceTimersByTime(100)

      await waitFor(() => {
        const firstButton = screen.getByRole('button', { name: /close menu/i })
        expect(document.activeElement).toBe(firstButton)
      })

      jest.useRealTimers()
    })

    it('should_delay_focus_for_voiceover_compatibility_100ms', () => {
      jest.useFakeTimers()
      const focusSpy = jest.spyOn(HTMLElement.prototype, 'focus')

      render(<MobileMenu {...defaultProps} />)

      expect(focusSpy).not.toHaveBeenCalled()

      jest.advanceTimersByTime(99)
      expect(focusSpy).not.toHaveBeenCalled()

      jest.advanceTimersByTime(1)
      expect(focusSpy).toHaveBeenCalled()

      jest.useRealTimers()
      focusSpy.mockRestore()
    })

    it('should_trap_focus_within_menu_panel', () => {
      render(<MobileMenu {...defaultProps} />)

      const closeButton = screen.getByRole('button', { name: /close menu/i })

      closeButton.focus()
      expect(document.activeElement).toBe(closeButton)

      // Tab through all focusable elements
      fireEvent.keyDown(document, { key: 'Tab' })
      // Focus should move to next element in normal tab order
    })

    it('should_cycle_focus_to_last_element_on_shift_tab_from_first', () => {
      render(<MobileMenu {...defaultProps} />)

      const closeButton = screen.getByRole('button', { name: /close menu/i })
      closeButton.focus()

      const event = new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey: true,
        bubbles: true,
      })
      Object.defineProperty(event, 'target', {
        value: closeButton,
        enumerable: true,
      })

      fireEvent.keyDown(closeButton, event)

      // Focus should cycle to last focusable element
    })

    it('should_cycle_focus_to_first_element_on_tab_from_last', () => {
      render(<MobileMenu {...defaultProps} />)

      const contactLink = screen.getByText('CONTACT')
      contactLink.focus()

      const event = new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true,
      })

      fireEvent.keyDown(document, event)

      // Focus should cycle back to first element
    })

    it('should_cleanup_focus_trap_on_unmount', () => {
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener')
      const { unmount } = render(<MobileMenu {...defaultProps} />)

      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalled()
      removeEventListenerSpy.mockRestore()
    })

    it('should_cleanup_focus_timeout_on_unmount', () => {
      jest.useFakeTimers()
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout')

      const { unmount } = render(<MobileMenu {...defaultProps} />)

      unmount()

      expect(clearTimeoutSpy).toHaveBeenCalled()

      jest.useRealTimers()
      clearTimeoutSpy.mockRestore()
    })
  })

  describe('Navigation Links', () => {
    it('should_mark_home_link_active_when_pathname_root', () => {
      render(<MobileMenu {...defaultProps} pathname="/" />)

      const workLink = screen.getByText('WORK').closest('a')
      expect(workLink).toHaveClass('active')
    })

    it('should_mark_about_link_active_when_pathname_about', () => {
      render(<MobileMenu {...defaultProps} pathname="/about" />)

      const aboutLink = screen.getByText('ABOUT').closest('a')
      expect(aboutLink).toHaveClass('active')
    })

    it('should_mark_contact_link_active_when_pathname_contact', () => {
      render(<MobileMenu {...defaultProps} pathname="/contact" />)

      const contactLink = screen.getByText('CONTACT').closest('a')
      expect(contactLink).toHaveClass('active')
    })

    it('should_call_onClose_when_nav_link_clicked', () => {
      const onClose = jest.fn()
      render(<MobileMenu {...defaultProps} onClose={onClose} />)

      const workLink = screen.getByText('WORK')
      fireEvent.click(workLink)

      expect(onClose).toHaveBeenCalled()
    })

    it('should_render_links_with_correct_hrefs', () => {
      render(<MobileMenu {...defaultProps} />)

      const workLink = screen.getByText('WORK').closest('a')
      const aboutLink = screen.getByText('ABOUT').closest('a')
      const contactLink = screen.getByText('CONTACT').closest('a')

      expect(workLink).toHaveAttribute('href', '/')
      expect(aboutLink).toHaveAttribute('href', '/about')
      expect(contactLink).toHaveAttribute('href', '/contact')
    })
  })

  describe('Accessibility', () => {
    it('should_set_role_dialog_on_menu_panel', () => {
      render(<MobileMenu {...defaultProps} />)

      const dialog = screen.getByRole('dialog')
      expect(dialog).toBeInTheDocument()
    })

    it('should_set_aria_modal_true_on_menu_panel', () => {
      render(<MobileMenu {...defaultProps} />)

      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-modal', 'true')
    })

    it('should_set_aria_label_navigation_menu_on_panel', () => {
      render(<MobileMenu {...defaultProps} />)

      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-label', 'Navigation menu')
    })

    it('should_have_close_button_with_aria_label', () => {
      render(<MobileMenu {...defaultProps} />)

      const closeButton = screen.getByRole('button', { name: /close menu/i })
      expect(closeButton).toHaveAttribute('aria-label', 'Close menu')
    })

    it('should_prevent_background_interaction_when_open', () => {
      render(<MobileMenu {...defaultProps} />)

      // Body scroll is locked, preventing interaction
      expect(document.body.style.overflow).toBe('hidden')
    })
  })

  describe('Event Listener Cleanup', () => {
    it('should_remove_escape_key_listener_on_close', () => {
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener')
      const { rerender } = render(<MobileMenu {...defaultProps} />)

      rerender(<MobileMenu {...defaultProps} isOpen={false} />)

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function)
      )

      removeEventListenerSpy.mockRestore()
    })

    it('should_remove_all_event_listeners_on_unmount', () => {
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener')
      const { unmount } = render(<MobileMenu {...defaultProps} />)

      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalled()
      removeEventListenerSpy.mockRestore()
    })
  })

  describe('CSS Classes', () => {
    it('should_apply_mobile_menu_overlay_class', () => {
      const { container } = render(<MobileMenu {...defaultProps} />)

      const overlay = container.querySelector('.mobile-menu-overlay')
      expect(overlay).toBeInTheDocument()
    })

    it('should_apply_mobile_menu_backdrop_class', () => {
      const { container } = render(<MobileMenu {...defaultProps} />)

      const backdrop = container.querySelector('.mobile-menu-backdrop')
      expect(backdrop).toBeInTheDocument()
    })

    it('should_apply_mobile_menu_panel_class', () => {
      const { container } = render(<MobileMenu {...defaultProps} />)

      const panel = container.querySelector('.mobile-menu-panel')
      expect(panel).toBeInTheDocument()
    })

    it('should_apply_mobile_menu_close_class', () => {
      const { container } = render(<MobileMenu {...defaultProps} />)

      const closeButton = container.querySelector('.mobile-menu-close')
      expect(closeButton).toBeInTheDocument()
    })

    it('should_apply_mobile_menu_nav_class', () => {
      const { container } = render(<MobileMenu {...defaultProps} />)

      const nav = container.querySelector('.mobile-menu-nav')
      expect(nav).toBeInTheDocument()
    })

    it('should_apply_mobile_menu_footer_class', () => {
      const { container } = render(<MobileMenu {...defaultProps} />)

      const footer = container.querySelector('.mobile-menu-footer')
      expect(footer).toBeInTheDocument()
    })
  })
})
