'use client'

import React from 'react'

// Error Boundary State Interface
interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

// Error Boundary Component
export class ErrorBoundary extends React.Component<
  React.PropsWithChildren,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />
    }

    return this.props.children
  }
}

// Error Fallback Component
export function ErrorFallback({
  error,
  retry,
}: {
  error?: Error
  retry?: () => void
}) {
  return (
    <div
      style={{
        minHeight: '400px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#fafafa',
        padding: '40px',
      }}
    >
      <div style={{ textAlign: 'center', maxWidth: '500px' }}>
        <h2
          style={{
            fontSize: '24px',
            fontWeight: 300,
            margin: '0 0 16px 0',
            color: '#333',
          }}
        >
          Something went wrong
        </h2>
        <p
          style={{
            fontSize: '16px',
            color: '#666',
            marginBottom: '24px',
            lineHeight: '1.5',
          }}
        >
          {error?.message ||
            'An unexpected error occurred while loading the content.'}
        </p>
        {retry && (
          <button
            onClick={retry}
            style={{
              fontSize: '14px',
              color: '#333',
              background: 'transparent',
              border: '1px solid #333',
              padding: '12px 24px',
              borderRadius: '6px',
              cursor: 'pointer',
              letterSpacing: '1px',
              textTransform: 'uppercase',
            }}
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  )
}

// Network Error Component
export function NetworkErrorFallback({ retry }: { retry?: () => void }) {
  return (
    <div
      style={{
        minHeight: '400px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#fafafa',
        padding: '40px',
      }}
    >
      <div style={{ textAlign: 'center', maxWidth: '500px' }}>
        <h2
          style={{
            fontSize: '24px',
            fontWeight: 300,
            margin: '0 0 16px 0',
            color: '#333',
          }}
        >
          Connection Error
        </h2>
        <p
          style={{
            fontSize: '16px',
            color: '#666',
            marginBottom: '24px',
            lineHeight: '1.5',
          }}
        >
          Unable to load content. Please check your internet connection and try
          again.
        </p>
        {retry && (
          <button
            onClick={retry}
            style={{
              fontSize: '14px',
              color: '#333',
              background: 'transparent',
              border: '1px solid #333',
              padding: '12px 24px',
              borderRadius: '6px',
              cursor: 'pointer',
              letterSpacing: '1px',
              textTransform: 'uppercase',
            }}
          >
            Retry
          </button>
        )}
      </div>
    </div>
  )
}
