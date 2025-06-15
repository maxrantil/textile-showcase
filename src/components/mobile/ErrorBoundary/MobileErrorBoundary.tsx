'use client'
import React, { Component, ReactNode } from 'react'
import { MobileButton } from '../UI/MobileButton'
import { trackEvent } from '../../../utils/analytics'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class MobileErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Mobile component error:', error, errorInfo)

    // Send to Umami analytics using your existing trackEvent utility
    trackEvent('mobile-error', {
      error_message: error.message,
      error_stack: error.stack?.substring(0, 500), // Limit stack trace length
      component_stack: errorInfo.componentStack?.substring(0, 500),
      device_type: 'mobile',
      fatal: false,
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="mobile-error-container">
            <div className="mobile-error-content">
              <h2>Something went wrong</h2>
              <p>Please try refreshing the page</p>
              <MobileButton
                onClick={() => window.location.reload()}
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
