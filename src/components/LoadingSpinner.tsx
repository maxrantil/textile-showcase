'use client'

import React from 'react'

// Loading Spinner Component
export function LoadingSpinner({ 
  size = 'medium', 
  className = '' 
}: { 
  size?: 'small' | 'medium' | 'large'
  className?: string 
}) {
  const sizeClasses = {
    small: 'h-6 w-6',
    medium: 'h-12 w-12',
    large: 'h-16 w-16'
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div 
        className={`animate-spin rounded-full border-2 border-gray-300 border-t-gray-900 ${sizeClasses[size]}`}
        aria-label="Loading..."
      />
    </div>
  )
}

// Gallery Loading Skeleton
export function GalleryLoadingSkeleton() {
  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: '#fafafa'
    }}>
      <div style={{ textAlign: 'center' }}>
        <LoadingSpinner size="large" />
        <p style={{ 
          color: '#666', 
          fontSize: '14px', 
          letterSpacing: '1px',
          marginTop: '16px',
          textTransform: 'uppercase'
        }}>
          Loading Gallery...
        </p>
      </div>
    </div>
  )
}

// Image Loading Placeholder
export function ImageLoadingPlaceholder({ 
  width = '100%', 
  height = '400px' 
}: { 
  width?: string
  height?: string 
}) {
  return (
    <div 
      style={{ 
        width, 
        height, 
        backgroundColor: '#f5f5f5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Shimmer effect */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: '-100%',
        width: '100%',
        height: '100%',
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
        animation: 'shimmer 1.5s infinite'
      }} />
      <style jsx>{`
        @keyframes shimmer {
          0% { left: -100%; }
          100% { left: 100%; }
        }
      `}</style>
    </div>
  )
}

// Error Boundary State Interface
interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

// Error Boundary Component - Fixed syntax
export class ErrorBoundary extends React.Component<React.PropsWithChildren<{}>, ErrorBoundaryState> {
  constructor(props: React.PropsWithChildren<{}>) {
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
  retry
}: { 
  error?: Error
  retry?: () => void 
}) {
  return (
    <div style={{ 
      minHeight: '400px',
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: '#fafafa',
      padding: '40px'
    }}>
      <div style={{ textAlign: 'center', maxWidth: '500px' }}>
        <h2 style={{ 
          fontSize: '24px', 
          fontWeight: 300, 
          margin: '0 0 16px 0',
          color: '#333'
        }}>
          Something went wrong
        </h2>
        <p style={{ 
          fontSize: '16px', 
          color: '#666',
          marginBottom: '24px',
          lineHeight: '1.5'
        }}>
          {error?.message || 'An unexpected error occurred while loading the content.'}
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
              textTransform: 'uppercase'
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
    <div style={{ 
      minHeight: '400px',
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: '#fafafa',
      padding: '40px'
    }}>
      <div style={{ textAlign: 'center', maxWidth: '500px' }}>
        <h2 style={{ 
          fontSize: '24px', 
          fontWeight: 300, 
          margin: '0 0 16px 0',
          color: '#333'
        }}>
          Connection Error
        </h2>
        <p style={{ 
          fontSize: '16px', 
          color: '#666',
          marginBottom: '24px',
          lineHeight: '1.5'
        }}>
          Unable to load content. Please check your internet connection and try again.
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
              textTransform: 'uppercase'
            }}
          >
            Retry
          </button>
        )}
      </div>
    </div>
  )
}
