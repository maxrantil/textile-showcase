// ABOUTME: Device-adaptive gallery wrapper with SSR-compatible hydration

'use client'

import { useDeviceType } from '@/hooks/shared/useDeviceType'
import { useState, useEffect, useRef } from 'react'
import { TextileDesign } from '@/types/textile'
import styles from './index.module.css'

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
      className={styles.skeletonContent}
      aria-hidden="true"
    >
      <div className={styles.skeletonText}>Loading gallery...</div>
    </div>
  )
}

// Minimum skeleton display time (prevents CLS flash, allows test detection)
const MIN_SKELETON_DISPLAY_TIME = 300 // ms

export default function AdaptiveGallery({ designs }: AdaptiveGalleryProps) {
  const deviceType = useDeviceType()
  const [isHydrated, setIsHydrated] = useState(false)
  const [GalleryComponent, setGalleryComponent] = useState<React.ComponentType<{ designs: TextileDesign[] }> | null>(null)
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
        // Increased timeouts for Safari/WebKit stability (Issue #209)
        // Safari in CI has slower chunk loading for dynamic imports
        const timeout = retryCount > 0 ? 15000 : 30000 // 30s initial, 15s retries
        const importedModule = isMobile
          ? await withTimeout(
              import('@/components/mobile/Gallery/MobileGallery'),
              timeout
            )
          : await withTimeout(
              import('@/components/desktop/Gallery/Gallery'),
              timeout
            )

        if (!isCancelled) {
          setGalleryComponent(() => importedModule.default)
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

  // Phase 3: Remove opacity hiding - images must be visible while loading on slow 3G
  // Skeleton now overlays via z-index instead of hiding content with opacity
  const skeletonVisible = !isHydrated || !GalleryComponent

  // Show error fallback if max retries exceeded
  if (importError && retryCount >= maxRetries) {
    return (
      <div
        data-testid="import-error-fallback"
        className={styles.errorFallback}
      >
        <p className={styles.errorMessage}>
          Unable to load gallery. Please check your connection.
        </p>
        <button
          onClick={() => window.location.reload()}
          className={styles.errorButton}
        >
          Reload Page
        </button>
      </div>
    )
  }

  return (
    <div className={styles.container} suppressHydrationWarning>
      <div className={styles.gallery}>
        {GalleryComponent && <GalleryComponent designs={designs} />}
      </div>
      {(!isHydrated || !GalleryComponent) && (
        <div className={`${styles.skeleton} ${skeletonVisible ? styles.visible : styles.hidden}`}>
          <GallerySkeleton />
        </div>
      )}
    </div>
  )
}
