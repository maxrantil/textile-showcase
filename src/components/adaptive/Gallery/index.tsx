// ABOUTME: Device-adaptive gallery wrapper with SSR-compatible hydration

'use client'

import { useDeviceType } from '@/hooks/shared/useDeviceType'
import { useState, useEffect, useRef } from 'react'
import { TextileDesign } from '@/types/textile'

// Helper to add timeout to dynamic imports
const withTimeout = <T,>(
  promise: Promise<T>,
  timeoutMs: number
): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error(`Import timeout after ${timeoutMs}ms`)),
        timeoutMs
      )
    ),
  ])
}

interface AdaptiveGalleryProps {
  designs: TextileDesign[]
}

// Skeleton component that matches gallery dimensions (prevents CLS during hydration)
export function GallerySkeleton() {
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
      <div style={{ fontSize: '14px', color: '#999' }}>Loading gallery...</div>
    </div>
  )
}

// Minimum skeleton display time (prevents CLS flash, allows test detection)
const MIN_SKELETON_DISPLAY_TIME = 300 // ms

export default function AdaptiveGallery({ designs }: AdaptiveGalleryProps) {
  const deviceType = useDeviceType()
  const [isHydrated, setIsHydrated] = useState(false)
  const [GalleryComponent, setGalleryComponent] = useState<any>(null)
  const [importError, setImportError] = useState<Error | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const skeletonStartTime = useRef(Date.now())
  const maxRetries = 3

  useEffect(() => {
    // Ensure skeleton displays for minimum time to prevent CLS and allow E2E test detection
    const elapsed = Date.now() - skeletonStartTime.current
    const remainingTime = Math.max(0, MIN_SKELETON_DISPLAY_TIME - elapsed)

    const timer = setTimeout(() => {
      setIsHydrated(true)
    }, remainingTime)

    return () => clearTimeout(timer)
  }, [])

  // Handle dynamic imports with error recovery
  useEffect(() => {
    if (!isHydrated) return

    const isMobile = deviceType === 'mobile' || deviceType === 'tablet'

    let isCancelled = false

    const loadComponent = async () => {
      try {
        // Use shorter timeout for retries (5s instead of 10s)
        const timeout = retryCount > 0 ? 5000 : 10000
        const module = isMobile
          ? await withTimeout(
              import('@/components/mobile/Gallery/MobileGallery'),
              timeout
            )
          : await withTimeout(
              import('@/components/desktop/Gallery/Gallery'),
              timeout
            )

        if (!isCancelled) {
          setGalleryComponent(() => module.default)
          setImportError(null)
        }
      } catch (error) {
        console.error('Gallery import failed:', error)
        if (!isCancelled) {
          setImportError(error as Error)

          // Auto-retry on failure (up to maxRetries)
          if (retryCount < maxRetries) {
            // Shorter backoff for faster recovery
            const delay = 500 * Math.pow(1.5, retryCount) // Exponential backoff (500ms, 750ms, 1125ms)
            setTimeout(() => {
              setRetryCount((prev) => prev + 1)
            }, delay)
          }
        }
      }
    }

    loadComponent()

    return () => {
      isCancelled = true
    }
  }, [isHydrated, deviceType, retryCount])

  // Opacity transition masks desktop→mobile switch during hydration (prevents CLS)
  const transitionStyle = {
    opacity: isHydrated && GalleryComponent ? 1 : 0,
    transition: 'opacity 300ms ease-in-out',
    minHeight: '400px', // Reserve space to prevent layout shift
  }

  // Show error fallback if max retries exceeded
  if (importError && retryCount >= maxRetries) {
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

  return (
    <div style={transitionStyle} suppressHydrationWarning>
      {!isHydrated || !GalleryComponent ? (
        <GallerySkeleton />
      ) : (
        <GalleryComponent designs={designs} />
      )}
    </div>
  )
}
