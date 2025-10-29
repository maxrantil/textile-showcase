// ABOUTME: React error boundary for mobile components with analytics tracking and custom reload handler
'use client'
import React, { Component, ReactNode } from 'react'
import { MobileButton } from '../UI/MobileButton'
import { trackEvent } from '../../../utils/analytics'

/**
 * Props for MobileErrorBoundary component
 */
interface MobileErrorBoundaryProps {
  /** Child components to render */
  children: ReactNode

  /**
   * Custom fallback UI to display when an error occurs.
   * If not provided, a default error UI with reload button is shown.
   */
  fallback?: ReactNode

  /**
   * Custom reload handler for testing or custom navigation behavior.
   * If not provided, defaults to window.location.reload().
   *
   * @example
   * // In tests (enables JSDOM compatibility)
   * <MobileErrorBoundary onReload={mockReload}>
   *   <ComponentUnderTest />
   * </MobileErrorBoundary>
   */
  onReload?: () => void
}

interface State {
  hasError: boolean
  error?: Error
}

/**
 * Error boundary component for catching React errors in mobile components.
 * Displays a fallback UI and tracks errors to analytics.
 */
export class MobileErrorBoundary extends Component<
  MobileErrorBoundaryProps,
  State
> {
  constructor(props: MobileErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('Mobile component error:', error, errorInfo)

    // Wrap analytics in try-catch to prevent error boundary failure
    try {
      trackEvent('mobile-error', {
        error_message: error.message,
        error_stack: error.stack?.substring(0, 500),
        component_stack: errorInfo.componentStack?.substring(0, 500),
        device_type: 'mobile',
        fatal: false,
      })
    } catch (analyticsError) {
      console.warn('Analytics tracking failed:', analyticsError)
    }
  }

  /**
   * Handles page reload. Uses custom onReload prop if provided,
   * otherwise falls back to window.location.reload().
   */
  private handleReload = (): void => {
    if (this.props.onReload) {
      this.props.onReload()
    } else {
      window.location.reload()
    }
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="mobile-error-container">
            <div className="mobile-error-content">
              <h2>Something went wrong</h2>
              <p>Please try refreshing the page</p>
              <MobileButton
                onClick={this.handleReload}
                variant="primary"
                fullWidth
              >
                Refresh Page
              </MobileButton>
            </div>
          </div>
        )
      )
    }
    return this.props.children
  }
}
