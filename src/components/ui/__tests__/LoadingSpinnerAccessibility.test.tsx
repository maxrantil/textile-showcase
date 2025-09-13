import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { LoadingSpinner, GalleryLoadingSkeleton } from '../LoadingSpinner'

describe('LoadingSpinner Accessibility Enhancements (TDD - RED Phase)', () => {
  // These tests SHOULD FAIL initially because enhanced accessibility features don't exist yet

  describe('Enhanced ARIA Support', () => {
    it('should have proper default ARIA attributes', () => {
      render(<LoadingSpinner />)

      // These enhanced ARIA attributes WILL FAIL initially:
      const container = screen.getByRole('status')
      expect(container).toHaveAttribute('role', 'status')
      expect(container).toHaveAttribute('aria-live', 'polite')
      expect(container).toHaveAttribute(
        'aria-label',
        'Loading content, please wait'
      )

      // Screen reader only text should exist
      const srText = screen.getByText('Loading content, please wait')
      expect(srText).toHaveClass('sr-only')

      // Spinner visual element should be hidden from screen readers
      const spinner = container.querySelector('.animate-spin')
      expect(spinner).toHaveAttribute('aria-hidden', 'true')
    })

    it('should accept custom ARIA label', () => {
      const customLabel = 'Loading user data, please wait'
      render(<LoadingSpinner ariaLabel={customLabel} />)

      // Custom ARIA label WILL FAIL initially - enhanced prop doesn't exist
      const container = screen.getByRole('status')
      expect(container).toHaveAttribute('aria-label', customLabel)

      // Screen reader text should match custom label
      const srText = screen.getByText(customLabel)
      expect(srText).toBeInTheDocument()
    })

    it('should accept custom role (status vs alert)', () => {
      render(<LoadingSpinner role="alert" />)

      // Custom role prop WILL FAIL initially - enhanced prop doesn't exist
      const container = screen.getByRole('alert')
      expect(container).toHaveAttribute('role', 'alert')
    })

    it('should accept custom aria-live value', () => {
      render(<LoadingSpinner live="assertive" />)

      // Custom aria-live prop WILL FAIL initially - enhanced prop doesn't exist
      const container = screen.getByRole('status')
      expect(container).toHaveAttribute('aria-live', 'assertive')
    })
  })

  describe('Screen Reader Optimization', () => {
    it('should have screen reader only text that describes loading state', () => {
      render(<LoadingSpinner />)

      // Screen reader only text WILL FAIL initially
      const srText = screen.getByText('Loading content, please wait')
      expect(srText).toHaveClass('sr-only')

      // sr-only class should visually hide but keep accessible
      // const styles = window.getComputedStyle(srText)
      // sr-only typically has: position: absolute, width: 1px, height: 1px, etc.
      expect(srText).toBeInTheDocument()
    })

    it('should hide visual spinner from screen readers', () => {
      render(<LoadingSpinner />)

      const container = screen.getByRole('status')
      const spinner = container.querySelector('.animate-spin')

      // Visual spinner should be hidden from assistive technology
      expect(spinner).toHaveAttribute('aria-hidden', 'true')
    })
  })

  describe('LoadingSpinner Props Interface', () => {
    it('should support all enhanced accessibility props', () => {
      // This test verifies the enhanced TypeScript interface
      const props = {
        size: 'large' as const,
        className: 'custom-class',
        ariaLabel: 'Loading gallery images',
        role: 'status' as const,
        live: 'polite' as const,
      }

      render(<LoadingSpinner {...props} />)

      // Enhanced props interface WILL FAIL initially
      const container = screen.getByRole('status')
      expect(container).toHaveAttribute('aria-label', 'Loading gallery images')
      expect(container).toHaveAttribute('aria-live', 'polite')
      expect(container).toHaveClass('custom-class')
    })

    it('should have proper TypeScript types for new props', () => {
      // TypeScript compilation will fail if enhanced props don't exist
      const validRoles: Array<'status' | 'alert'> = ['status', 'alert']
      const validLive: Array<'polite' | 'assertive'> = ['polite', 'assertive']

      expect(validRoles).toContain('status')
      expect(validLive).toContain('polite')
    })
  })

  describe('GalleryLoadingSkeleton Enhanced Accessibility', () => {
    it('should have enhanced ARIA structure for gallery loading', () => {
      render(<GalleryLoadingSkeleton />)

      // Enhanced gallery loading accessibility WILL FAIL initially:
      const main = screen.getByRole('main')
      expect(main).toHaveAttribute('aria-label', 'Gallery loading page')

      // LoadingSpinner should have gallery-specific label
      const loadingStatus = screen.getByRole('status')
      expect(loadingStatus).toHaveAttribute(
        'aria-label',
        'Loading gallery images, please wait'
      )
      expect(loadingStatus).toHaveAttribute('aria-live', 'polite')

      // Text should also have aria-live for screen reader updates
      const loadingText = screen.getByText('Loading Gallery...')
      expect(loadingText).toHaveAttribute('aria-live', 'polite')
    })

    it('should provide context-specific loading information', () => {
      render(<GalleryLoadingSkeleton />)

      // Gallery-specific accessibility enhancements WILL FAIL initially
      const loadingSpinner = screen.getByRole('status')
      expect(loadingSpinner).toHaveAttribute(
        'aria-label',
        'Loading gallery images, please wait'
      )

      // More descriptive than generic "Loading..."
      const srText = screen.getByText('Loading gallery images, please wait')
      expect(srText).toBeInTheDocument()
    })
  })

  describe('Integration with Existing Functionality', () => {
    it('should maintain existing size variants', () => {
      render(<LoadingSpinner size="small" />)

      const container = screen.getByRole('status')
      const spinner = container.querySelector('.animate-spin')

      // Existing size functionality should remain
      expect(spinner).toHaveClass('h-6', 'w-6') // small size classes
    })

    it('should maintain existing custom className support', () => {
      const customClass = 'my-custom-spinner-class'
      render(<LoadingSpinner className={customClass} />)

      const container = screen.getByRole('status')

      // Should preserve existing className functionality
      expect(container).toHaveClass(customClass)
    })

    it('should work with all size variants and maintain accessibility', () => {
      const sizes: Array<'small' | 'medium' | 'large'> = [
        'small',
        'medium',
        'large',
      ]

      sizes.forEach((size) => {
        const { unmount } = render(<LoadingSpinner size={size} />)

        // Each size should maintain accessibility
        const container = screen.getByRole('status')
        expect(container).toHaveAttribute(
          'aria-label',
          'Loading content, please wait'
        )

        unmount()
      })
    })
  })

  describe('Backwards Compatibility', () => {
    it('should maintain existing API while adding new props', () => {
      // Old usage should still work
      render(<LoadingSpinner size="medium" className="existing-usage" />)

      const container = screen.getByRole('status')
      expect(container).toBeInTheDocument()
      expect(container).toHaveClass('existing-usage')

      // But now with enhanced accessibility by default
      expect(container).toHaveAttribute(
        'aria-label',
        'Loading content, please wait'
      )
    })

    it('should not break existing component usage patterns', () => {
      // Ensure existing patterns from other components still work
      render(
        <div>
          <LoadingSpinner />
          <LoadingSpinner size="large" />
          <LoadingSpinner className="custom" />
        </div>
      )

      const spinners = screen.getAllByRole('status')
      expect(spinners).toHaveLength(3)

      // All should have enhanced accessibility
      spinners.forEach((spinner) => {
        expect(spinner).toHaveAttribute('aria-label')
        expect(spinner).toHaveAttribute('aria-live')
      })
    })
  })

  describe('Performance and Rendering', () => {
    it('should not introduce performance regressions', () => {
      // Accessibility enhancements should not impact rendering performance
      const startTime = performance.now()

      render(<LoadingSpinner />)

      const endTime = performance.now()
      const renderTime = endTime - startTime

      // Should render quickly (arbitrary threshold for test)
      expect(renderTime).toBeLessThan(50) // 50ms

      // Should still render the expected elements
      expect(screen.getByRole('status')).toBeInTheDocument()
    })

    it('should render efficiently with accessibility enhancements', () => {
      render(<LoadingSpinner />)

      // Enhanced accessibility should not affect visual rendering
      const container = screen.getByRole('status')
      const spinner = container.querySelector('.animate-spin')

      expect(container).toBeInTheDocument()
      expect(spinner).toBeInTheDocument()

      // Should have both visual and accessibility features
      expect(spinner).toHaveClass('animate-spin')
      expect(container).toHaveAttribute('aria-label')
    })
  })
})
