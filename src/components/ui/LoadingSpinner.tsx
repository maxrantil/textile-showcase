'use client'

// Loading Spinner Component
export function LoadingSpinner({
  size = 'medium',
  className = '',
}: {
  size?: 'small' | 'medium' | 'large'
  className?: string
}) {
  const sizeClasses = {
    small: 'h-6 w-6',
    medium: 'h-12 w-12',
    large: 'h-16 w-16',
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
    <div
      style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#fafafa',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <LoadingSpinner size="large" />
        <p
          style={{
            color: '#666',
            fontSize: '14px',
            letterSpacing: '1px',
            marginTop: '16px',
            textTransform: 'uppercase',
          }}
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
