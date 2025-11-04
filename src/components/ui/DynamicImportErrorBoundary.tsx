// ABOUTME: Error boundary for dynamic imports with retry logic and fallback UI
'use client'

import React, { useState, useEffect } from 'react'

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
  maxRetries?: number
}

export function DynamicImportErrorBoundary({
  children,
  fallback,
  maxRetries = 3,
}: Props) {
  const [error, setError] = useState<Error | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [isRetrying, setIsRetrying] = useState(false)

  const handleRetry = () => {
    if (retryCount >= maxRetries) return

    setIsRetrying(true)
    setError(null)
    setRetryCount((prev) => prev + 1)

    // Force reload of component
    setTimeout(() => {
      setIsRetrying(false)
      window.location.reload()
    }, 1000)
  }

  if (error) {
    if (retryCount >= maxRetries) {
      return (
        <div
          data-testid="import-error-fallback"
          style={{
            minHeight: '400px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            padding: '2rem',
            textAlign: 'center',
          }}
        >
          <p style={{ marginBottom: '1rem', color: '#666' }}>
            Unable to load gallery. Please check your connection.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#000',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Reload Page
          </button>
        </div>
      )
    }

    if (isRetrying) {
      return (
        <div
          data-testid="gallery-loading-skeleton"
          style={{
            minHeight: '400px',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0.3,
          }}
          aria-hidden="true"
        >
          <div style={{ fontSize: '14px', color: '#999' }}>
            Loading gallery...
          </div>
        </div>
      )
    }

    return (
      <div data-testid="import-error-retry">
        <p>
          Failed to load content. Retrying... ({retryCount}/{maxRetries})
        </p>
        <button onClick={handleRetry}>Retry Now</button>
      </div>
    )
  }

  return (
    <ErrorBoundaryWrapper onError={setError}>{children}</ErrorBoundaryWrapper>
  )
}

// React Error Boundary wrapper
class ErrorBoundaryWrapper extends React.Component<{
  children: React.ReactNode
  onError: (error: Error) => void
}> {
  componentDidCatch(error: Error) {
    this.props.onError(error)
  }

  render() {
    return this.props.children
  }
}
