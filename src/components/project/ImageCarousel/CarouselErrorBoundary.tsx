// src/components/project/ImageCarousel/CarouselErrorBoundary.tsx
'use client'
import React, { Component, ReactNode } from 'react'

interface CarouselErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

interface CarouselErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

export class CarouselErrorBoundary extends Component<
  CarouselErrorBoundaryProps,
  CarouselErrorBoundaryState
> {
  constructor(props: CarouselErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): CarouselErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo })
    // Log error for debugging
    console.error('ImageCarousel Error:', error)
    console.error('Error Info:', errorInfo)
    // Call optional error callback
    this.props.onError?.(error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback or default error UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div
          style={{
            minHeight: '50vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#fafafa',
            padding: '40px',
            textAlign: 'center',
          }}
        >
          <div>
            <h2
              style={{
                fontSize: '24px',
                fontWeight: 300,
                margin: '0 0 16px 0',
                color: '#333',
              }}
            >
              Unable to load project images
            </h2>
            <p
              style={{
                fontSize: '16px',
                color: '#666',
                marginBottom: '24px',
              }}
            >
              Something went wrong while loading the image carousel.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '12px 24px',
                background: '#333',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
