'use client'

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useKeyboardNavigation } from '@/hooks/desktop/useKeyboardNavigation'
import { getOptimizedImageUrl } from '@/sanity/imageHelpers'
import { LockdownImage } from '@/components/ui/LockdownImage'
import { UmamiEvents } from '@/utils/analytics'
import { perf } from '@/utils/performance'
import { scrollManager } from '@/lib/scrollManager'
import type { SanityImageSource } from '@sanity/image-url/lib/types/types'

interface GalleryImage {
  _key: string
  asset: SanityImageSource
  caption?: string
}

interface ExtendedGalleryImage extends GalleryImage {
  isMainImage: boolean
}

interface DesktopImageCarouselProps {
  images?: GalleryImage[]
  mainImage: SanityImageSource
  projectTitle: string
  currentIndex?: number
  onIndexChange?: (index: number) => void
}

// Lightweight lockdown mode detection - only for iOS devices
const isIOSLockdownMode = () => {
  if (typeof window === 'undefined') return false

  try {
    // Only check on iOS devices (iPhone/iPad)
    const isIOS = /iPad|iPhone|iPod/.test(window.navigator.userAgent)
    if (!isIOS) return false // Not iOS, no lockdown mode

    // Check for missing APIs that indicate lockdown mode
    const hasIntersectionObserver = 'IntersectionObserver' in window
    const hasWebGL = !!window.WebGLRenderingContext

    return !hasIntersectionObserver || !hasWebGL
  } catch {
    return false
  }
}

export function DesktopImageCarousel({
  images = [],
  projectTitle,
  currentIndex: externalCurrentIndex,
  onIndexChange,
}: DesktopImageCarouselProps) {
  const router = useRouter()
  const [internalCurrentIndex, setInternalCurrentIndex] = useState(0)
  const [useLockdownMode, setUseLockdownMode] = useState(false)
  const carouselRef = useRef<HTMLDivElement>(null)
  const lastScrollTime = useRef(0)
  const lastNavigationTime = useRef(0)
  const scrollAccumulator = useRef(0)
  const isNavigating = useRef(false)
  const lastKeyboardDirection = useRef<'next' | 'previous' | null>(null)

  // Check for iOS lockdown mode on mount (only for iPads)
  useEffect(() => {
    const lockdownMode = isIOSLockdownMode()
    if (lockdownMode) {
      console.log('🔒 iOS Lockdown Mode detected on tablet/iPad')
    }
    setUseLockdownMode(lockdownMode)
  }, [])

  // Use external index if provided, otherwise use internal
  const currentIndex = externalCurrentIndex ?? internalCurrentIndex
  const setCurrentIndex = onIndexChange ?? setInternalCurrentIndex

  // Create array of gallery images only (exclude main image)
  const allImages = useMemo((): ExtendedGalleryImage[] => {
    const imageArray: ExtendedGalleryImage[] = []

    // Only add gallery images (skip main image completely)
    if (images && images.length > 0) {
      imageArray.push(
        ...images.map((img) => ({
          ...img,
          isMainImage: false,
        }))
      )
    }

    return imageArray
  }, [images])

  const currentImage = allImages[currentIndex] || (images && images[0])

  // Format counter based on total count
  const formatCounter = useMemo(() => {
    const current = currentIndex + 1
    const total = allImages.length

    if (total <= 10) {
      return `${current}/${total}`
    } else {
      return `${String(current).padStart(2, '0')}/${String(total).padStart(2, '0')}`
    }
  }, [currentIndex, allImages.length])

  // Navigation functions with source-based cooldown
  const navigateWithCooldown = useCallback(
    (
      direction: 'next' | 'previous',
      source: 'button' | 'scroll' | 'keyboard' = 'button'
    ) => {
      const now = Date.now()

      // Different cooldown logic for different sources
      let cooldownPeriod = 200 // Default for buttons

      if (source === 'scroll') {
        cooldownPeriod = 500
      } else if (source === 'keyboard') {
        // For keyboard, only apply cooldown if same direction
        if (lastKeyboardDirection.current === direction) {
          cooldownPeriod = 300
        } else {
          cooldownPeriod = 0 // No cooldown when changing direction
          lastKeyboardDirection.current = direction
        }
      }

      // Check if we're still in cooldown period
      if (now - lastNavigationTime.current < cooldownPeriod) {
        return false // Navigation blocked
      }

      // Set navigation flag
      isNavigating.current = true
      lastNavigationTime.current = now

      perf.start(`carousel-navigation-${direction}`)

      try {
        let newIndex
        if (direction === 'next') {
          newIndex =
            currentIndex === allImages.length - 1 ? 0 : currentIndex + 1
        } else {
          newIndex =
            currentIndex === 0 ? allImages.length - 1 : currentIndex - 1
        }

        UmamiEvents.projectImageView(projectTitle, newIndex + 1)
        UmamiEvents.projectNavigation(direction, projectTitle)
        setCurrentIndex(newIndex)

        // Reset navigation flag after a short delay
        setTimeout(() => {
          isNavigating.current = false
          // Clear scroll accumulator when using buttons
          if (source === 'button') {
            scrollAccumulator.current = 0
          }
        }, 100)

        return true // Navigation successful
      } finally {
        perf.end(`carousel-navigation-${direction}`)
      }
    },
    [allImages.length, currentIndex, projectTitle, setCurrentIndex]
  )

  const goToPrevious = useCallback(() => {
    navigateWithCooldown('previous', 'button')
  }, [navigateWithCooldown])

  const goToNext = useCallback(() => {
    navigateWithCooldown('next', 'button')
  }, [navigateWithCooldown])

  // Handle going back to gallery
  const goBackToGallery = useCallback(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('⌨️ Escape pressed: Going back to gallery')
    }
    UmamiEvents.backToGallery()
    scrollManager.triggerNavigationStart()
    router.back()
  }, [router])

  // Keyboard navigation handlers for the hook
  const handleKeyboardPrevious = useCallback(() => {
    navigateWithCooldown('previous', 'keyboard')
  }, [navigateWithCooldown])

  const handleKeyboardNext = useCallback(() => {
    navigateWithCooldown('next', 'keyboard')
  }, [navigateWithCooldown])

  // Use the existing keyboard navigation hook (disable in lockdown mode)
  useKeyboardNavigation({
    onPrevious: handleKeyboardPrevious,
    onNext: handleKeyboardNext,
    onEscape: goBackToGallery,
    onScrollUp: () => {
      window.scrollBy({ top: -100, behavior: 'smooth' })
    },
    onScrollDown: () => {
      window.scrollBy({ top: 100, behavior: 'smooth' })
    },
    enabled: !useLockdownMode, // Disable keyboard nav in lockdown mode
  })

  // Enhanced horizontal scroll support
  const handleWheel = useCallback(
    (event: WheelEvent) => {
      // Skip wheel events in lockdown mode for simplicity
      if (useLockdownMode) return

      const carouselElement = carouselRef.current
      if (!carouselElement?.contains(event.target as Node)) return

      const now = Date.now()
      const deltaX = Math.abs(event.deltaX)
      const deltaY = Math.abs(event.deltaY)

      // Only handle horizontal scrolling (left/right)
      if (deltaY > deltaX * 1.2) {
        return // Let the page scroll vertically
      }

      // Only prevent default for horizontal scrolling
      if (deltaX > deltaY * 0.3) {
        event.preventDefault()
      } else {
        return // Let vertical scrolling work normally
      }

      // Block scroll navigation if we're in cooldown
      const cooldownPeriod = 500
      if (now - lastNavigationTime.current < cooldownPeriod) {
        return // Still in cooldown, ignore scroll
      }

      // Reset accumulator if too much time has passed or if we just navigated
      if (now - lastScrollTime.current > 300 || isNavigating.current) {
        scrollAccumulator.current = 0
      }

      // Accumulate horizontal scroll delta
      scrollAccumulator.current += event.deltaX
      lastScrollTime.current = now

      // Adjusted threshold for better responsiveness
      const threshold = 150

      // Check if we've accumulated enough scroll to change image
      if (Math.abs(scrollAccumulator.current) >= threshold) {
        let navigationSuccess = false

        if (scrollAccumulator.current > 0) {
          navigationSuccess = navigateWithCooldown('next', 'scroll')
        } else {
          navigationSuccess = navigateWithCooldown('previous', 'scroll')
        }

        // Only reset accumulator if navigation was successful
        if (navigationSuccess) {
          scrollAccumulator.current = 0
        }
      }
    },
    [navigateWithCooldown, useLockdownMode]
  )

  // Set up wheel event listener with proper cleanup (skip in lockdown mode)
  useEffect(() => {
    const carouselElement = carouselRef.current
    if (!carouselElement || useLockdownMode) return

    const handleWheelWrapper = (event: WheelEvent) => handleWheel(event)

    carouselElement.addEventListener('wheel', handleWheelWrapper, {
      passive: false,
    })

    return () => {
      carouselElement.removeEventListener('wheel', handleWheelWrapper)
    }
  }, [handleWheel, useLockdownMode])

  // Track initial project view
  useEffect(() => {
    UmamiEvents.projectImageView(projectTitle, 1)
  }, [projectTitle])

  // Get current image URL
  const currentImageUrl = getOptimizedImageUrl(
    currentImage?.asset || (images && images[0]?.asset),
    {
      height: 800,
      quality: 90,
      format: 'auto', // Use auto format for lockdown detection
    }
  )

  // Don't render if no gallery images
  if (!images || images.length === 0) {
    return (
      <div className="desktop-carousel-container">
        <div className="desktop-carousel-main">
          <div className="desktop-carousel-image">
            <p>No gallery images available</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Main Image Container */}
      <div className="desktop-carousel-container" ref={carouselRef}>
        {/* Thumbnail Strip - Gallery Images Only */}
        {allImages.length > 1 && !useLockdownMode && (
          <div className="desktop-carousel-thumbnails">
            {allImages.map((image, index) => (
              <div
                key={image._key}
                className={`desktop-thumbnail ${index === currentIndex ? 'active' : ''}`}
                onClick={() => {
                  setCurrentIndex(index)
                  UmamiEvents.projectImageView(projectTitle, index + 1)
                }}
              >
                <Image
                  src={getOptimizedImageUrl(image.asset, {
                    width: 120,
                    height: 120,
                    quality: 75,
                    format: 'auto',
                    fit: 'crop',
                  })}
                  alt={`Gallery image ${index + 1}`}
                  width={60}
                  height={60}
                  className="desktop-thumbnail-img"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        )}

        {/* Image Display */}
        <div className="desktop-carousel-main">
          <div className="desktop-carousel-image">
            {useLockdownMode ? (
              // Lockdown mode - use simple image for iPads
              <LockdownImage
                src={currentImage?.asset || (images && images[0]?.asset)}
                alt={
                  currentImage?.caption || `Gallery image ${currentIndex + 1}`
                }
                className="desktop-project-img"
                style={{
                  height: '60vh',
                  maxHeight: '600px',
                  minHeight: '300px',
                  width: 'auto',
                  objectFit: 'contain',
                }}
              />
            ) : (
              // Normal mode - use Next.js Image
              currentImageUrl && (
                <Image
                  src={currentImageUrl}
                  alt={
                    currentImage?.caption || `Gallery image ${currentIndex + 1}`
                  }
                  width={800}
                  height={600}
                  className="desktop-project-img"
                  loading={currentIndex === 0 ? 'eager' : 'lazy'}
                  priority={currentIndex === 0}
                  sizes="(max-width: 768px) 100vw, 800px"
                  onError={() => {
                    // If image fails and we're on iOS, try lockdown mode
                    if (/iPad|iPhone|iPod/.test(window.navigator.userAgent)) {
                      console.log(
                        '🔒 Image failed on iOS device, switching to lockdown mode'
                      )
                      setUseLockdownMode(true)
                    }
                  }}
                />
              )
            )}
          </div>

          {/* Elegant Arrow Navigation */}
          {allImages.length > 1 && !useLockdownMode && (
            <div className="elegant-navigation">
              <button
                className="paginate left"
                data-state={currentIndex === 0 ? 'disabled' : ''}
                onClick={goToPrevious}
                disabled={currentIndex === 0}
              >
                <i></i>
                <i></i>
              </button>
              <div className="elegant-counter">{formatCounter}</div>
              <button
                className="paginate right"
                data-state={
                  currentIndex === allImages.length - 1 ? 'disabled' : ''
                }
                onClick={goToNext}
                disabled={currentIndex === allImages.length - 1}
              >
                <i></i>
                <i></i>
              </button>
            </div>
          )}
        </div>

        {/* Simple navigation for lockdown mode */}
        {useLockdownMode && allImages.length > 1 && (
          <div
            style={{
              position: 'absolute',
              bottom: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: '10px',
              background: 'rgba(0,0,0,0.7)',
              padding: '8px 12px',
              borderRadius: '20px',
            }}
          >
            <button
              onClick={goToPrevious}
              disabled={currentIndex === 0}
              style={{
                background: 'white',
                border: 'none',
                padding: '8px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              ←
            </button>
            <span style={{ color: 'white', padding: '8px', fontSize: '12px' }}>
              {formatCounter}
            </span>
            <button
              onClick={goToNext}
              disabled={currentIndex === allImages.length - 1}
              style={{
                background: 'white',
                border: 'none',
                padding: '8px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              →
            </button>
          </div>
        )}
      </div>

      {/* Debug indicator */}
      {process.env.NODE_ENV === 'development' && useLockdownMode && (
        <div
          style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            background: 'red',
            color: 'white',
            fontSize: '10px',
            padding: '2px 4px',
            borderRadius: '2px',
            zIndex: 10,
          }}
        >
          LOCKDOWN (iPad)
        </div>
      )}
    </>
  )
}
