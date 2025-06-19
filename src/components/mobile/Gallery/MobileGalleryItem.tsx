'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { TextileDesign } from '@/sanity/types'
import {
  getOptimizedImageUrl,
  getImageDimensionsFromSource,
} from '@/sanity/imageHelpers'
import { scrollManager } from '@/lib/scrollManager'
import { UmamiEvents } from '@/utils/analytics'

interface MobileGalleryItemProps {
  design: TextileDesign
  index: number
  isFirst: boolean
  onClick?: () => void // New prop for scroll manager integration
}

export const MobileGalleryItem = React.memo(function MobileGalleryItem({
  design,
  index,
  isFirst,
  onClick,
}: MobileGalleryItemProps) {
  const router = useRouter()
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  const handleClick = () => {
    // Save scroll position first (via parent's onClick)
    onClick?.()

    // Track analytics
    UmamiEvents.trackEvent('mobile-gallery-item-click', {
      title: design.title,
      index: index,
    })

    // Additional project view tracking
    UmamiEvents.trackEvent('project-view', {
      project: design.slug?.current,
      index,
      source: 'mobile-gallery',
    })

    // Trigger navigation start for scroll manager
    scrollManager.triggerNavigationStart()

    // Navigate to project
    router.push(`/project/${design.slug?.current || design._id}`)
  }

  // Get optimized image URL
  const imageUrl = getOptimizedImageUrl(design.image, {
    width: 800,
    quality: 85,
    format: 'auto',
  })

  // Get image dimensions for proper aspect ratio
  const dimensions = getImageDimensionsFromSource(design.image)
  const aspectRatio = dimensions ? dimensions.aspectRatio : 4 / 3

  const handleImageLoad = () => {
    setImageLoaded(true)
    UmamiEvents.trackEvent('mobile-gallery-image-loaded', {
      title: design.title,
      index: index,
    })
  }

  const handleImageError = () => {
    setImageError(true)
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Failed to load image for ${design.title} at index ${index}`)
    }
  }

  return (
    <div
      className="mobile-gallery-item"
      onClick={handleClick}
      data-index={index} // Helpful for debugging and scroll calculations
    >
      <div className="mobile-gallery-image-container" style={{ aspectRatio }}>
        <Image
          src={imageUrl}
          alt={design.title}
          fill
          sizes="(max-width: 768px) 100vw, 800px"
          className={`mobile-gallery-image ${imageLoaded ? 'loaded' : ''}`}
          loading={isFirst ? 'eager' : 'lazy'}
          priority={isFirst} // Add priority for first image
          onLoad={handleImageLoad}
          onError={handleImageError}
        />

        {!imageLoaded && !imageError && (
          <div className="mobile-gallery-loading">
            <div className="loading-spinner" /> {/* You can style this */}
            <span>Loading...</span>
          </div>
        )}

        {imageError && (
          <div className="mobile-gallery-error">
            <span>Failed to load image</span>
            <button
              onClick={(e) => {
                e.stopPropagation() // Prevent navigation on retry
                setImageError(false)
                setImageLoaded(false)
              }}
              className="retry-button"
            >
              Retry
            </button>
          </div>
        )}
      </div>

      <div className="mobile-gallery-info">
        <h3 className="mobile-gallery-title">{design.title}</h3>
      </div>
    </div>
  )
})
