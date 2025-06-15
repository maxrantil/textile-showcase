'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useKeyboardNavigation } from '@/hooks/desktop/useKeyboardNavigation'
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

  // Navigation functions with performance monitoring
  const goToPrevious = useCallback(() => {
    perf.start('carousel-navigation-previous')

    try {
      const newIndex =
        currentIndex === 0 ? allImages.length - 1 : currentIndex - 1
      UmamiEvents.projectImageView(projectTitle, newIndex + 1)
      UmamiEvents.projectNavigation('previous', projectTitle)
      setCurrentIndex(newIndex)
    } finally {
      perf.end('carousel-navigation-previous')
    }
  }, [allImages.length, currentIndex, projectTitle, setCurrentIndex])

  const goToNext = useCallback(() => {
    perf.start('carousel-navigation-next')

    try {
      const newIndex =
        currentIndex === allImages.length - 1 ? 0 : currentIndex + 1
      UmamiEvents.projectImageView(projectTitle, newIndex + 1)
      UmamiEvents.projectNavigation('next', projectTitle)
      setCurrentIndex(newIndex)
    } finally {
      perf.end('carousel-navigation-next')
    }
  }, [allImages.length, currentIndex, projectTitle, setCurrentIndex])

  // Handle going back to gallery
  const goBackToGallery = useCallback(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('⌨️ Escape pressed: Going back to gallery')
    }
    UmamiEvents.backToGallery()
    scrollManager.triggerNavigationStart()
    router.back()
  }, [router])

  // Enhanced keyboard navigation with Escape
  useKeyboardNavigation({
    onPrevious: goToPrevious,
    onNext: goToNext,
    onEscape: goBackToGallery,
    enabled: true,
  })

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
      {/* Main Image Container with Navigation */}
      <div className="desktop-carousel-container">
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

          {/* Image Counter */}
          {allImages.length > 1 && (
            <div className="desktop-carousel-counter">
              {String(currentIndex + 1).padStart(2, '0')} /{' '}
              {String(allImages.length).padStart(2, '0')}
            </div>
          )}
        </div>
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
