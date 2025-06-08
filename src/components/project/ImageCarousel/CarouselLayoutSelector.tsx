'use client'
import { memo, Suspense, lazy } from 'react'
import { useCarouselLayoutDetector } from './CarouselLayoutDetector'
import { CarouselLayoutProps } from './CarouselLayoutProps'

// Import components directly for non-lazy loading
import CarouselMobileLayoutDirect from './CarouselMobileLayout'
import CarouselDesktopLayoutDirect from './CarouselDesktopLayout'

// Lazy load layouts for better performance
const CarouselMobileLayout = lazy(() => import('./CarouselMobileLayout'))
const CarouselDesktopLayout = lazy(() => import('./CarouselDesktopLayout'))

// Loading fallback component
const CarouselLoadingFallback = memo(function CarouselLoadingFallback() {
  return (
    <div
      style={{
        minHeight: '50vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#fafafa',
      }}
    >
      <div
        style={{
          padding: '20px',
          textAlign: 'center',
          color: '#666',
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            border: '3px solid #f3f3f3',
            borderTop: '3px solid #333',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 10px',
          }}
        />
        <p>Loading project...</p>
      </div>
      <style jsx>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  )
})

interface CarouselLayoutSelectorProps extends CarouselLayoutProps {
  customBreakpoint?: number
  fallbackToMobile?: boolean
  enableLazyLoading?: boolean
}

const CarouselLayoutSelector = memo(function CarouselLayoutSelector({
  customBreakpoint,
  fallbackToMobile = false,
  enableLazyLoading = true,
  ...carouselProps
}: CarouselLayoutSelectorProps) {
  const { isMobile, isInitialized } = useCarouselLayoutDetector({
    mobileBreakpoint: customBreakpoint,
  })

  // Show loading state during hydration to prevent layout shift
  if (!isInitialized) {
    return <CarouselLoadingFallback />
  }

  // Determine which layout to show
  const shouldShowMobile = isMobile || fallbackToMobile

  // If lazy loading is disabled, use direct imports
  if (!enableLazyLoading) {
    return shouldShowMobile ? (
      <CarouselMobileLayoutDirect {...carouselProps} />
    ) : (
      <CarouselDesktopLayoutDirect {...carouselProps} />
    )
  }

  // Use lazy loading with Suspense
  return (
    <Suspense fallback={<CarouselLoadingFallback />}>
      {shouldShowMobile ? (
        <CarouselMobileLayout {...carouselProps} />
      ) : (
        <CarouselDesktopLayout {...carouselProps} />
      )}
    </Suspense>
  )
})

export default CarouselLayoutSelector
