// ABOUTME: Test suite for MobileErrorBoundary - React error boundary component with analytics tracking

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { MobileErrorBoundary } from '../MobileErrorBoundary'
import { trackEvent } from '@/utils/analytics'

// Mock dependencies
jest.mock('@/utils/analytics')

const mockTrackEvent = trackEvent as jest.MockedFunction<typeof trackEvent>
const mockWindowReload = jest.fn()

jest.mock('@/components/mobile/UI/MobileButton', () => ({
  MobileButton: ({
    children,
    onClick,
    variant,
    fullWidth,
  }: {
    children: React.ReactNode
    onClick?: () => void
    variant?: string
    fullWidth?: boolean
  }) => (
    <button
      onClick={onClick}
      data-variant={variant}
      data-full-width={fullWidth}
    >
      {children}
    </button>
  ),
}))

// Test utility component that throws errors
const ThrowError = ({ error }: { error: Error }) => {
  throw error
}

describe('MobileErrorBoundary', () => {
  let consoleErrorSpy: jest.SpyInstance

  beforeEach(() => {
    jest.clearAllMocks()

    // Suppress console.error in tests (error boundaries log to console)
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorSpy?.mockRestore()
  })

  describe('Error Catching', () => {
    it('should_catch_errors_from_child_components', () => {
      const testError = new Error('Test error')

      render(
        <MobileErrorBoundary onReload={mockWindowReload}>
          <ThrowError error={testError} />
        </MobileErrorBoundary>
      )

      // Should show error UI instead of throwing
      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    })

    it('should_update_state_via_getDerivedStateFromError', () => {
      const testError = new Error('State update test')

      render(
        <MobileErrorBoundary onReload={mockWindowReload}>
          <ThrowError error={testError} />
        </MobileErrorBoundary>
      )

      // Verify error boundary caught the error and updated state
      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    })

    it('should_set_hasError_true_when_error_caught', () => {
      const testError = new Error('Has error test')

      render(
        <MobileErrorBoundary onReload={mockWindowReload}>
          <ThrowError error={testError} />
        </MobileErrorBoundary>
      )

      // Error UI should be visible (indicating hasError is true)
      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
      expect(
        screen.getByText('Please try refreshing the page')
      ).toBeInTheDocument()
    })

    it('should_store_error_object_in_state', () => {
      const testError = new Error('Error storage test')

      render(
        <MobileErrorBoundary onReload={mockWindowReload}>
          <ThrowError error={testError} />
        </MobileErrorBoundary>
      )

      // Error should be caught and fallback UI rendered
      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    })

    it('should_prevent_error_from_bubbling_up', () => {
      const testError = new Error('Bubbling test')

      // Should not throw error to parent
      expect(() => {
        render(
          <MobileErrorBoundary onReload={mockWindowReload}>
            <ThrowError error={testError} />
          </MobileErrorBoundary>
        )
      }).not.toThrow()
    })
  })

  describe('Error Logging', () => {
    it('should_log_error_to_console_in_componentDidCatch', () => {
      const testError = new Error('Console log test')

      render(
        <MobileErrorBoundary onReload={mockWindowReload}>
          <ThrowError error={testError} />
        </MobileErrorBoundary>
      )

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Mobile component error:',
        testError,
        expect.any(Object)
      )
    })

    it('should_track_error_to_analytics', () => {
      const testError = new Error('Analytics test')

      render(
        <MobileErrorBoundary onReload={mockWindowReload}>
          <ThrowError error={testError} />
        </MobileErrorBoundary>
      )

      expect(mockTrackEvent).toHaveBeenCalledTimes(1)
      expect(mockTrackEvent).toHaveBeenCalledWith(
        'mobile-error',
        expect.any(Object)
      )
    })

    it('should_include_error_message_in_analytics', () => {
      const testError = new Error('Specific error message')

      render(
        <MobileErrorBoundary onReload={mockWindowReload}>
          <ThrowError error={testError} />
        </MobileErrorBoundary>
      )

      expect(mockTrackEvent).toHaveBeenCalledWith(
        'mobile-error',
        expect.objectContaining({
          error_message: 'Specific error message',
        })
      )
    })

    it('should_include_component_stack_in_analytics', () => {
      const testError = new Error('Component stack test')

      render(
        <MobileErrorBoundary onReload={mockWindowReload}>
          <ThrowError error={testError} />
        </MobileErrorBoundary>
      )

      expect(mockTrackEvent).toHaveBeenCalledWith(
        'mobile-error',
        expect.objectContaining({
          component_stack: expect.any(String),
        })
      )
    })
  })

  describe('Default Fallback UI', () => {
    it('should_render_default_fallback_when_error_occurs', () => {
      const testError = new Error('Fallback test')

      render(
        <MobileErrorBoundary onReload={mockWindowReload}>
          <ThrowError error={testError} />
        </MobileErrorBoundary>
      )

      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
      expect(
        screen.getByText('Please try refreshing the page')
      ).toBeInTheDocument()
      expect(screen.getByText('Refresh Page')).toBeInTheDocument()
    })

    it('should_display_something_went_wrong_message', () => {
      const testError = new Error('Message test')

      render(
        <MobileErrorBoundary onReload={mockWindowReload}>
          <ThrowError error={testError} />
        </MobileErrorBoundary>
      )

      const heading = screen.getByText('Something went wrong')
      expect(heading.tagName).toBe('H2')
    })

    it('should_display_refresh_suggestion', () => {
      const testError = new Error('Suggestion test')

      render(
        <MobileErrorBoundary onReload={mockWindowReload}>
          <ThrowError error={testError} />
        </MobileErrorBoundary>
      )

      expect(
        screen.getByText('Please try refreshing the page')
      ).toBeInTheDocument()
    })

    it('should_render_refresh_button', () => {
      const testError = new Error('Button test')

      render(
        <MobileErrorBoundary onReload={mockWindowReload}>
          <ThrowError error={testError} />
        </MobileErrorBoundary>
      )

      const button = screen.getByText('Refresh Page')
      expect(button).toBeInTheDocument()
    })

    it('should_reload_page_when_refresh_button_clicked', () => {
      const testError = new Error('Reload test')

      render(
        <MobileErrorBoundary onReload={mockWindowReload}>
          <ThrowError error={testError} />
        </MobileErrorBoundary>
      )

      const button = screen.getByText('Refresh Page')
      fireEvent.click(button)

      expect(mockWindowReload).toHaveBeenCalledTimes(1)
    })

    it('should_use_MobileButton_for_refresh_action', () => {
      const testError = new Error('MobileButton test')

      render(
        <MobileErrorBoundary onReload={mockWindowReload}>
          <ThrowError error={testError} />
        </MobileErrorBoundary>
      )

      const button = screen.getByText('Refresh Page')
      expect(button).toHaveAttribute('data-variant', 'primary')
      expect(button).toHaveAttribute('data-full-width', 'true')
    })
  })

  describe('Custom Fallback', () => {
    it('should_render_custom_fallback_when_provided', () => {
      const testError = new Error('Custom fallback test')
      const customFallback = <div>Custom error message</div>

      render(
        <MobileErrorBoundary
          fallback={customFallback}
          onReload={mockWindowReload}
        >
          <ThrowError error={testError} />
        </MobileErrorBoundary>
      )

      expect(screen.getByText('Custom error message')).toBeInTheDocument()
    })

    it('should_not_render_default_fallback_when_custom_provided', () => {
      const testError = new Error('No default test')
      const customFallback = <div>Custom error UI</div>

      render(
        <MobileErrorBoundary
          fallback={customFallback}
          onReload={mockWindowReload}
        >
          <ThrowError error={testError} />
        </MobileErrorBoundary>
      )

      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
      expect(screen.getByText('Custom error UI')).toBeInTheDocument()
    })

    it('should_render_custom_fallback_element', () => {
      const testError = new Error('Element test')
      const customFallback = (
        <div className="custom-error">
          <h3>Oops!</h3>
          <p>An error occurred</p>
        </div>
      )

      render(
        <MobileErrorBoundary
          fallback={customFallback}
          onReload={mockWindowReload}
        >
          <ThrowError error={testError} />
        </MobileErrorBoundary>
      )

      expect(screen.getByText('Oops!')).toBeInTheDocument()
      expect(screen.getByText('An error occurred')).toBeInTheDocument()
    })
  })

  describe('Normal Rendering', () => {
    it('should_render_children_when_no_error', () => {
      render(
        <MobileErrorBoundary>
          <div>Normal content</div>
        </MobileErrorBoundary>
      )

      expect(screen.getByText('Normal content')).toBeInTheDocument()
    })

    it('should_not_show_fallback_when_no_error', () => {
      render(
        <MobileErrorBoundary>
          <div>Working component</div>
        </MobileErrorBoundary>
      )

      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
      expect(screen.getByText('Working component')).toBeInTheDocument()
    })
  })

  describe('Analytics Integration', () => {
    it('should_limit_error_stack_to_500_characters', () => {
      // Create error with long stack
      const longStack = 'a'.repeat(1000)
      const testError = new Error('Stack limit test')
      testError.stack = longStack

      render(
        <MobileErrorBoundary onReload={mockWindowReload}>
          <ThrowError error={testError} />
        </MobileErrorBoundary>
      )

      expect(mockTrackEvent).toHaveBeenCalledWith(
        'mobile-error',
        expect.objectContaining({
          error_stack: expect.any(String),
        })
      )

      const analyticsCall = mockTrackEvent.mock.calls[0][1]
      if (
        analyticsCall &&
        analyticsCall.error_stack &&
        typeof analyticsCall.error_stack === 'string'
      ) {
        expect(analyticsCall.error_stack.length).toBeLessThanOrEqual(500)
      }
    })

    it('should_limit_component_stack_to_500_characters', () => {
      const testError = new Error('Component stack test')

      render(
        <MobileErrorBoundary onReload={mockWindowReload}>
          <ThrowError error={testError} />
        </MobileErrorBoundary>
      )

      const analyticsCall = mockTrackEvent.mock.calls[0][1]

      if (
        analyticsCall &&
        analyticsCall.component_stack &&
        typeof analyticsCall.component_stack === 'string'
      ) {
        expect(analyticsCall.component_stack.length).toBeLessThanOrEqual(500)
      }
    })

    it('should_mark_error_as_non_fatal', () => {
      const testError = new Error('Fatal flag test')

      render(
        <MobileErrorBoundary onReload={mockWindowReload}>
          <ThrowError error={testError} />
        </MobileErrorBoundary>
      )

      expect(mockTrackEvent).toHaveBeenCalledWith(
        'mobile-error',
        expect.objectContaining({
          fatal: false,
          device_type: 'mobile',
        })
      )
    })
  })
})
