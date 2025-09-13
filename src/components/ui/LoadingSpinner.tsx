'use client'

// Loading Spinner Component with Enhanced Accessibility
export function LoadingSpinner({
  size = 'medium',
  className = '',
  ariaLabel = 'Loading content, please wait',
  role = 'status',
  live = 'polite',
}: {
  size?: 'small' | 'medium' | 'large'
  className?: string
  ariaLabel?: string
  role?: 'status' | 'alert'
  live?: 'polite' | 'assertive'
}) {
  const sizeClasses = {
    small: 'h-6 w-6',
    medium: 'h-12 w-12',
    large: 'h-16 w-16',
  }

  return (
    <div
      className={`flex items-center justify-center ${className}`}
      role={role}
      aria-live={live}
      aria-label={ariaLabel}
    >
      <div
        className={`animate-spin rounded-full border-2 border-gray-300 border-t-gray-900 ${sizeClasses[size]}`}
        aria-hidden="true"
      />
      {/* Screen reader only text */}
      <span className="sr-only">{ariaLabel}</span>
    </div>
  )
}

// Gallery Loading Skeleton with Enhanced Accessibility
export function GalleryLoadingSkeleton() {
  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#fafafa',
      }}
      role="main"
      aria-label="Gallery loading page"
    >
      <div style={{ textAlign: 'center' }}>
        <LoadingSpinner
          size="large"
          ariaLabel="Loading gallery images, please wait"
          role="status"
          live="polite"
        />
        <p
          style={{
            color: '#666',
            fontSize: '14px',
            letterSpacing: '1px',
            marginTop: '16px',
            textTransform: 'uppercase',
          }}
          aria-live="polite"
        >
          Loading Gallery...
        </p>
      </div>
    </div>
  )
}

// Image Loading Placeholder
export function ImageLoadingPlaceholder({
  width = '100%',
  height = '400px',
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
        overflow: 'hidden',
      }}
    >
      {/* Shimmer effect */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '-100%',
          width: '100%',
          height: '100%',
          background:
            'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
          animation: 'shimmer 1.5s infinite',
        }}
      />
      <style jsx>{`
        @keyframes shimmer {
          0% {
            left: -100%;
          }
          100% {
            left: 100%;
          }
        }
      `}</style>
    </div>
  )
}
