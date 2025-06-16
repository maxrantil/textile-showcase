'use client'

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useKeyboardNavigation } from '@/hooks/desktop/useKeyboardNavigation'
import { NavigationArrows } from '@/components/ui/NavigationArrows'
import { getOptimizedImageUrl } from '@/sanity/imageHelpers'
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

export function DesktopImageCarousel({
  images = [],
  mainImage,
  projectTitle,
  currentIndex: externalCurrentIndex,
  onIndexChange,
}: DesktopImageCarouselProps) {
  const router = useRouter()
  const [internalCurrentIndex, setInternalCurrentIndex] = useState(0)
  const carouselRef = useRef<HTMLDivElement>(null)
  const lastScrollTime = useRef(0)
  const lastNavigationTime = useRef(0)
  const scrollAccumulator = useRef(0)
  const isNavigating = useRef(false)
  const lastKeyboardDirection = useRef<'next' | 'previous' | null>(null)

  // Use external index if provided, otherwise use internal
  const currentIndex = externalCurrentIndex ?? internalCurrentIndex
  const setCurrentIndex = onIndexChange ?? setInternalCurrentIndex

  // Create array of all images for carousel
  const allImages = useMemo((): ExtendedGalleryImage[] => {
    const imageArray: ExtendedGalleryImage[] = []

    // Add main image first
    if (mainImage) {
      imageArray.push({
        _key: 'main-image',
        asset: mainImage,
        caption: projectTitle,
        isMainImage: true,
      })
    }

    // Add gallery images
    if (images && images.length > 0) {
      imageArray.push(
        ...images.map((img) => ({
          ...img,
          isMainImage: false,
        }))
      )
    }

    return imageArray
  }, [images, mainImage, projectTitle])

  const currentImage = allImages[currentIndex]

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

  // Use the existing keyboard navigation hook
  useKeyboardNavigation({
    onPrevious: handleKeyboardPrevious,
    onNext: handleKeyboardNext,
    onEscape: goBackToGallery,
    onScrollUp: () => {
      // Handle 'k' key - scroll page up
      window.scrollBy({ top: -100, behavior: 'smooth' })
    },
    onScrollDown: () => {
      // Handle 'j' key - scroll page down
      window.scrollBy({ top: 100, behavior: 'smooth' })
    },
    enabled: true,
  })

  // Enhanced horizontal scroll support
  const handleWheel = useCallback(
    (event: WheelEvent) => {
      const carouselElement = carouselRef.current
      if (!carouselElement?.contains(event.target as Node)) return

      const now = Date.now()
      const deltaX = Math.abs(event.deltaX)
      const deltaY = Math.abs(event.deltaY)

      // Only handle horizontal scrolling (left/right)
      // If vertical scroll is dominant, let the page scroll normally
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
    [navigateWithCooldown]
  )

  // Set up wheel event listener with proper cleanup
  useEffect(() => {
    const carouselElement = carouselRef.current
    if (!carouselElement) return

    const handleWheelWrapper = (event: WheelEvent) => handleWheel(event)

    // Use passive: false only when we might prevent default
    carouselElement.addEventListener('wheel', handleWheelWrapper, {
      passive: false,
    })

    return () => {
      carouselElement.removeEventListener('wheel', handleWheelWrapper)
    }
  }, [handleWheel])

  // Track initial project view
  useEffect(() => {
    UmamiEvents.projectImageView(projectTitle, 1)
  }, [projectTitle])

  // Get optimized image URLs for preloading
  const preloadUrls = useMemo(() => {
    const indices = [
      currentIndex === 0 ? allImages.length - 1 : currentIndex - 1,
      currentIndex === allImages.length - 1 ? 0 : currentIndex + 1,
    ]
    return indices
      .map((i) => allImages[i])
      .filter(Boolean)
      .map((image) =>
        getOptimizedImageUrl(image.asset, {
          height: 600,
          quality: 80,
          format: 'webp',
        })
      )
  }, [currentIndex, allImages])

  // Get current image URL
  const currentImageUrl = getOptimizedImageUrl(
    currentImage?.asset || mainImage,
    {
      height: 800,
      quality: 90,
      format: 'webp',
    }
  )

  return (
    <>
      {/* Main Image Container with relative positioning for arrows */}
      <div className="desktop-carousel-container" ref={carouselRef}>
        {/* Navigation Arrows - Positioned relative to image container */}
        {allImages.length > 1 && (
          <NavigationArrows
            canScrollLeft={currentIndex > 0}
            canScrollRight={currentIndex < allImages.length - 1}
            onScrollLeft={goToPrevious}
            onScrollRight={goToNext}
            showOnMobile={false}
            position="absolute"
          />
        )}

        {/* Image Display */}
        <div className="desktop-carousel-main">
          {/* Main Image */}
          <div className="desktop-carousel-image">
            {currentImageUrl && (
              <Image
                src={currentImageUrl}
                alt={currentImage?.caption || projectTitle}
                width={800}
                height={600}
                className="desktop-project-img"
                loading={currentIndex === 0 ? 'eager' : 'lazy'}
                priority={currentIndex === 0}
                sizes="(max-width: 768px) 100vw, 800px"
              />
            )}
          </div>
        </div>

        {/* Image Counter - Fixed position outside image area */}
        {allImages.length > 1 && (
          <div className="desktop-carousel-counter-fixed">{formatCounter}</div>
        )}
      </div>

      {/* Preload adjacent images */}
      <div className="desktop-carousel-preload">
        {preloadUrls.map((url, index) => (
          <Image
            key={`preload-${index}`}
            src={url}
            alt=""
            width={600}
            height={400}
            loading="lazy"
            className="sr-only"
          />
        ))}
      </div>
    </>
  )
}
