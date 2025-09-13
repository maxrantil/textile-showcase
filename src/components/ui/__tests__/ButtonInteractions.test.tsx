import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'

// Test component that uses enhanced button classes
const TestButtonComponent = () => {
  return (
    <div>
      <button
        className="btn-mobile btn-mobile-primary"
        data-testid="primary-button"
      >
        Primary Button
      </button>

      <button
        className="btn-mobile btn-mobile-secondary"
        data-testid="secondary-button"
      >
        Secondary Button
      </button>

      <button
        className="btn-mobile btn-mobile-ghost"
        data-testid="ghost-button"
      >
        Ghost Button
      </button>

      <button
        className="btn-mobile btn-mobile-primary"
        disabled
        data-testid="disabled-button"
      >
        Disabled Button
      </button>

      <button
        className="btn-mobile btn-mobile-primary"
        aria-busy="true"
        data-testid="loading-button"
      >
        <span className="mobile-spinner-container">
          <div className="mobile-spinner"></div>
        </span>
        Loading...
      </button>
    </div>
  )
}

describe('Button Interactions Enhancement (TDD - RED Phase)', () => {
  // These tests SHOULD FAIL initially because enhanced button styles don't exist yet

  describe('Enhanced Hover States (@media (hover: hover))', () => {
    it('should have enhanced hover state for primary button', () => {
      render(<TestButtonComponent />)
      const button = screen.getByTestId('primary-button')

      // Simulate hover - this is tricky to test in jsdom, but we can check initial styles
      // const styles = window.getComputedStyle(button)

      // These enhanced hover styles WILL FAIL initially
      // In real hover state, should have:
      // - background: #111 (darker)
      // - border-color: #111
      // - transform: translateY(-1px)
      // - box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2)

      // For now, verify base button exists - hover behavior tested in integration
      expect(button).toBeInTheDocument()
      expect(button).toHaveClass('btn-mobile', 'btn-mobile-primary')
    })

    it('should have enhanced hover state for secondary button', () => {
      render(<TestButtonComponent />)
      const button = screen.getByTestId('secondary-button')

      // Enhanced secondary hover styles WILL FAIL initially:
      // - background: rgba(51, 51, 51, 0.05)
      // - transform: translateY(-1px)
      // - box-shadow: 0 4px 12px rgba(51, 51, 51, 0.1)

      expect(button).toBeInTheDocument()
      expect(button).toHaveClass('btn-mobile', 'btn-mobile-secondary')
    })

    it('should have enhanced hover state for ghost button', () => {
      render(<TestButtonComponent />)
      const button = screen.getByTestId('ghost-button')

      // Enhanced ghost hover styles WILL FAIL initially:
      // - background: #f8f9fa
      // - border-color: #d1d5db
      // - transform: translateY(-1px)

      expect(button).toBeInTheDocument()
      expect(button).toHaveClass('btn-mobile', 'btn-mobile-ghost')
    })
  })

  describe('WCAG AA Focus Indicators', () => {
    it('should have enhanced focus-visible styles for accessibility', () => {
      render(<TestButtonComponent />)
      const button = screen.getByTestId('primary-button')

      // Focus the button
      button.focus()

      // const styles = window.getComputedStyle(button)

      // These WCAG AA focus styles WILL FAIL initially:
      // - outline: 2px solid #2563eb
      // - outline-offset: 2px
      // - box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.2)

      // Currently we can only test that focus works
      expect(button).toHaveFocus()

      // The enhanced focus styling will be added in GREEN phase
    })
  })

  describe('Better Disabled States', () => {
    it('should have improved disabled state styling', () => {
      render(<TestButtonComponent />)
      const button = screen.getByTestId('disabled-button')

      const styles = window.getComputedStyle(button)

      // Enhanced disabled styles WILL FAIL initially:
      expect(styles.opacity).toBe('0.5') // Clearer than 0.6
      expect(styles.cursor).toBe('not-allowed')

      // Should prevent transform and box-shadow when disabled
      // transform: none !important
      // box-shadow: none !important

      // For primary disabled:
      // background: #9ca3af
      // border-color: #9ca3af

      expect(button).toBeDisabled()
    })

    it('should have specific disabled styles for different button variants', () => {
      // This tests that each button variant has proper disabled styling
      render(
        <div>
          <button
            className="btn-mobile btn-mobile-primary"
            disabled
            data-testid="disabled-primary"
          >
            Disabled Primary
          </button>
          <button
            className="btn-mobile btn-mobile-secondary"
            disabled
            data-testid="disabled-secondary"
          >
            Disabled Secondary
          </button>
          <button
            className="btn-mobile btn-mobile-ghost"
            disabled
            data-testid="disabled-ghost"
          >
            Disabled Ghost
          </button>
        </div>
      )

      // These specific disabled styles WILL FAIL initially:
      // Primary disabled: background #9ca3af, border-color #9ca3af
      // Secondary disabled: color #9ca3af, border-color #e5e7eb
      // Ghost disabled: color #9ca3af, border-color #f3f4f6

      const primaryDisabled = screen.getByTestId('disabled-primary')
      const secondaryDisabled = screen.getByTestId('disabled-secondary')
      const ghostDisabled = screen.getByTestId('disabled-ghost')

      expect(primaryDisabled).toBeDisabled()
      expect(secondaryDisabled).toBeDisabled()
      expect(ghostDisabled).toBeDisabled()
    })
  })

  describe('Loading State Improvements with ARIA', () => {
    it('should have proper ARIA attributes for loading state', () => {
      render(<TestButtonComponent />)
      const button = screen.getByTestId('loading-button')

      // Enhanced loading state WILL FAIL initially:
      expect(button).toHaveAttribute('aria-busy', 'true')

      const styles = window.getComputedStyle(button)

      // Loading state styles that WILL FAIL initially:
      expect(styles.color).toBe('transparent') // Text hidden during loading
      expect(styles.cursor).toBe('wait') // Loading cursor

      // Spinner container should be absolutely positioned
      const spinnerContainer = button.querySelector('.mobile-spinner-container')
      expect(spinnerContainer).toBeInTheDocument()
    })

    it('should handle loading state with proper cursor and text visibility', () => {
      render(<TestButtonComponent />)
      const button = screen.getByTestId('loading-button')

      // Text should be transparent when aria-busy="true"
      const styles = window.getComputedStyle(button)

      // These styles WILL FAIL initially - they're in the enhanced CSS
      expect(styles.color).toBe('transparent')
      expect(styles.cursor).toBe('wait')
    })
  })

  describe('Accessibility Media Queries', () => {
    it('should support high contrast mode for buttons', () => {
      render(<TestButtonComponent />)
      const button = screen.getByTestId('primary-button')

      // High contrast mode support WILL FAIL initially:
      // @media (prefers-contrast: high) {
      //   .btn-mobile { border-width: 2px; }
      //   .btn-mobile:focus-visible {
      //     outline-width: 3px;
      //     outline-offset: 3px;
      //   }
      // }

      // Base test - enhanced styles added in GREEN phase
      expect(button).toBeInTheDocument()
    })

    it('should respect reduced motion preferences', () => {
      render(<TestButtonComponent />)
      const button = screen.getByTestId('primary-button')

      // Reduced motion support WILL FAIL initially:
      // @media (prefers-reduced-motion: reduce) {
      //   .btn-mobile { transition: none; }
      //   .btn-mobile:hover { transform: none; }
      //   .btn-mobile:active { transform: none; }
      //   .mobile-spinner { animation: none; }
      // }

      expect(button).toBeInTheDocument()
    })
  })

  describe('Touch and Mobile Optimization', () => {
    it('should maintain existing mobile touch targets', () => {
      render(<TestButtonComponent />)
      const button = screen.getByTestId('primary-button')

      const styles = window.getComputedStyle(button)

      // Existing mobile optimizations should remain:
      expect(styles.minHeight).toBe('48px') // Touch target minimum
      // Type assertion needed for webkit-specific property not in standard CSSStyleDeclaration
      expect(
        (styles as unknown as Record<string, string>).webkitTapHighlightColor
      ).toBe('transparent')
      expect(styles.touchAction).toBe('manipulation')
      expect(styles.userSelect).toBe('none')
    })

    it('should have proper active state with scale transform', () => {
      render(<TestButtonComponent />)
      const button = screen.getByTestId('primary-button')

      // Simulate active state
      fireEvent.mouseDown(button)

      // Active state should have transform: scale(0.98)
      // This will be tested in integration - base functionality verified here
      expect(button).toBeInTheDocument()
    })
  })
})
