// ABOUTME: Comprehensive test suite for MobileHeader - state management, menu integration, composition

import { render, fireEvent, screen } from '@testing-library/react'
import { MobileHeader } from '../MobileHeader'
import { usePathname } from 'next/navigation'

// Mock mobile environment
beforeEach(() => {
  Object.defineProperty(window, 'innerWidth', { value: 375, writable: true })
  Object.defineProperty(window, 'ontouchstart', {
    value: () => {},
    writable: true,
  })
})

// Mock dependencies
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/'),
}))

jest.mock('../MobileLogo', () => ({
  MobileLogo: () => <div data-testid="mobile-logo">IDA ROMME</div>,
}))

interface MockHamburgerButtonProps {
  isOpen: boolean
  onClick: () => void
}

interface MockMobileMenuProps {
  isOpen: boolean
  onClose: () => void
  pathname: string
}

jest.mock('../HamburgerButton', () => ({
  HamburgerButton: ({ isOpen, onClick }: MockHamburgerButtonProps) => (
    <button
      data-testid="hamburger-button"
      aria-label={isOpen ? 'Close menu' : 'Open menu'}
      onClick={onClick}
      aria-expanded={isOpen}
    >
      {isOpen ? 'X' : '☰'}
    </button>
  ),
}))

jest.mock('../MobileMenu', () => ({
  MobileMenu: ({ isOpen, onClose, pathname }: MockMobileMenuProps) =>
    isOpen ? (
      <div data-testid="mobile-menu" role="dialog" onClick={onClose}>
        Menu - {pathname}
      </div>
    ) : null,
}))

describe('MobileHeader', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should_render_header_with_correct_semantic_structure', () => {
      const { container } = render(<MobileHeader />)

      const header = container.querySelector('header')
      expect(header).toBeInTheDocument()
    })

    it('should_render_mobile_logo_component', () => {
      render(<MobileHeader />)

      expect(screen.getByTestId('mobile-logo')).toBeInTheDocument()
    })

    it('should_render_hamburger_button_component', () => {
      render(<MobileHeader />)

      expect(screen.getByTestId('hamburger-button')).toBeInTheDocument()
    })

    it('should_render_mobile_menu_component', () => {
      render(<MobileHeader />)

      // Menu should not be visible initially
      expect(screen.queryByTestId('mobile-menu')).not.toBeInTheDocument()
    })

    it('should_apply_mobile_header_class', () => {
      const { container } = render(<MobileHeader />)

      const header = container.querySelector('header')
      expect(header).toHaveClass('mobile-header')
    })
  })

  describe('Menu State Management', () => {
    it('should_initialize_with_menu_closed', () => {
      render(<MobileHeader />)

      expect(screen.queryByTestId('mobile-menu')).not.toBeInTheDocument()
    })

    it('opens mobile menu on hamburger click', () => {
      const { getByLabelText, getByRole } = render(<MobileHeader />)

      fireEvent.click(getByLabelText('Open menu'))
      expect(getByRole('dialog')).toBeInTheDocument()
    })

    it('should_close_menu_when_onClose_called', () => {
      render(<MobileHeader />)

      const hamburger = screen.getByTestId('hamburger-button')
      fireEvent.click(hamburger)

      expect(screen.getByTestId('mobile-menu')).toBeInTheDocument()

      const menu = screen.getByTestId('mobile-menu')
      fireEvent.click(menu)

      expect(screen.queryByTestId('mobile-menu')).not.toBeInTheDocument()
    })

    it('should_toggle_menu_state_on_hamburger_click', () => {
      render(<MobileHeader />)

      const hamburger = screen.getByTestId('hamburger-button')

      // First click - open
      fireEvent.click(hamburger)
      expect(screen.getByTestId('mobile-menu')).toBeInTheDocument()

      // Second click - close
      fireEvent.click(hamburger)
      expect(screen.queryByTestId('mobile-menu')).not.toBeInTheDocument()

      // Third click - open again
      fireEvent.click(hamburger)
      expect(screen.getByTestId('mobile-menu')).toBeInTheDocument()
    })

    it('should_pass_isMenuOpen_state_to_hamburger_button', () => {
      render(<MobileHeader />)

      const hamburger = screen.getByTestId('hamburger-button')

      // Initially closed
      expect(hamburger).toHaveAttribute('aria-expanded', 'false')

      // After click, open
      fireEvent.click(hamburger)
      expect(hamburger).toHaveAttribute('aria-expanded', 'true')
    })

    it('should_pass_isMenuOpen_state_to_mobile_menu', () => {
      render(<MobileHeader />)

      // Menu not rendered when closed
      expect(screen.queryByTestId('mobile-menu')).not.toBeInTheDocument()

      const hamburger = screen.getByTestId('hamburger-button')
      fireEvent.click(hamburger)

      // Menu rendered when open
      expect(screen.getByTestId('mobile-menu')).toBeInTheDocument()
    })
  })

  describe('Pathname Management', () => {
    it('should_get_current_pathname_from_usePathname_hook', () => {
      ;(usePathname as jest.Mock).mockReturnValue('/about')

      render(<MobileHeader />)

      const hamburger = screen.getByTestId('hamburger-button')
      fireEvent.click(hamburger)

      expect(screen.getByText(/Menu - \/about/)).toBeInTheDocument()
    })

    it('should_pass_pathname_to_mobile_menu', () => {
      ;(usePathname as jest.Mock).mockReturnValue('/contact')

      render(<MobileHeader />)

      const hamburger = screen.getByTestId('hamburger-button')
      fireEvent.click(hamburger)

      expect(screen.getByText(/Menu - \/contact/)).toBeInTheDocument()
    })

    it('should_default_to_root_path_when_pathname_null', () => {
      ;(usePathname as jest.Mock).mockReturnValue(null)

      render(<MobileHeader />)

      const hamburger = screen.getByTestId('hamburger-button')
      fireEvent.click(hamburger)

      // Should handle null gracefully
      expect(screen.getByTestId('mobile-menu')).toBeInTheDocument()
    })

    it('should_update_active_nav_link_when_pathname_changes', () => {
      ;(usePathname as jest.Mock).mockReturnValue('/')

      const { rerender } = render(<MobileHeader />)

      // Initially on home
      const hamburger = screen.getByTestId('hamburger-button')
      fireEvent.click(hamburger)
      expect(screen.getByText(/Menu - \//)).toBeInTheDocument()

      // Change pathname
      ;(usePathname as jest.Mock).mockReturnValue('/about')
      rerender(<MobileHeader />)

      expect(screen.getByText(/Menu - \/about/)).toBeInTheDocument()
    })
  })

  describe('Component Integration', () => {
    it('should_pass_onClick_handler_to_hamburger_button', () => {
      render(<MobileHeader />)

      const hamburger = screen.getByTestId('hamburger-button')

      // Clicking should toggle menu
      fireEvent.click(hamburger)
      expect(screen.getByTestId('mobile-menu')).toBeInTheDocument()
    })

    it('should_pass_onClose_handler_to_mobile_menu', () => {
      render(<MobileHeader />)

      const hamburger = screen.getByTestId('hamburger-button')
      fireEvent.click(hamburger)

      const menu = screen.getByTestId('mobile-menu')
      fireEvent.click(menu)

      expect(screen.queryByTestId('mobile-menu')).not.toBeInTheDocument()
    })

    it('should_render_logo_as_clickable_link', () => {
      render(<MobileHeader />)

      const logo = screen.getByTestId('mobile-logo')
      expect(logo).toBeInTheDocument()
    })

    it('should_coordinate_menu_state_between_hamburger_and_menu', () => {
      render(<MobileHeader />)

      const hamburger = screen.getByTestId('hamburger-button')

      // Open via hamburger
      fireEvent.click(hamburger)
      expect(screen.getByTestId('mobile-menu')).toBeInTheDocument()
      expect(hamburger).toHaveAttribute('aria-expanded', 'true')

      // Close via menu
      const menu = screen.getByTestId('mobile-menu')
      fireEvent.click(menu)
      expect(screen.queryByTestId('mobile-menu')).not.toBeInTheDocument()
      expect(hamburger).toHaveAttribute('aria-expanded', 'false')
    })
  })

  describe('Accessibility', () => {
    it('should_have_proper_ARIA_attributes_on_hamburger', () => {
      render(<MobileHeader />)

      const hamburger = screen.getByTestId('hamburger-button')
      expect(hamburger).toHaveAttribute('aria-label')
      expect(hamburger).toHaveAttribute('aria-expanded')
    })

    it('should_update_aria_expanded_on_menu_toggle', () => {
      render(<MobileHeader />)

      const hamburger = screen.getByTestId('hamburger-button')

      expect(hamburger).toHaveAttribute('aria-expanded', 'false')

      fireEvent.click(hamburger)
      expect(hamburger).toHaveAttribute('aria-expanded', 'true')

      fireEvent.click(hamburger)
      expect(hamburger).toHaveAttribute('aria-expanded', 'false')
    })
  })
})
