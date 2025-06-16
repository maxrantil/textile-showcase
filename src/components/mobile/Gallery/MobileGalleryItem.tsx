'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { TextileDesign } from '@/sanity/types'
import {
  getOptimizedImageUrl,
  getImageDimensionsFromSource,
} from '@/sanity/imageHelpers'
import { UmamiEvents } from '@/utils/analytics'

interface MobileGalleryItemProps {
  design: TextileDesign
  index: number
  isFirst: boolean
}

export const MobileGalleryItem = React.memo(function MobileGalleryItem({
  design,
  index,
  isFirst,
}: MobileGalleryItemProps) {
  const router = useRouter()
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  const handleClick = () => {
    UmamiEvents.trackEvent('mobile-gallery-item-click', {
      title: design.title,
      index: index,
    })
    router.push(`/project/${design.slug?.current || design._id}`)
  }

  // Get optimized image URL
  const imageUrl = getOptimizedImageUrl(design.image, {
    width: 800,
    quality: 85,
    format: 'webp',
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

  return (
    <div className="mobile-gallery-item" onClick={handleClick}>
      <div className="mobile-gallery-image-container" style={{ aspectRatio }}>
        <Image
          src={imageUrl}
          alt={design.title}
          fill
          sizes="(max-width: 768px) 100vw, 800px"
          className={`mobile-gallery-image ${imageLoaded ? 'loaded' : ''}`}
          loading={isFirst ? 'eager' : 'lazy'}
          onLoad={handleImageLoad}
          onError={() => setImageError(true)}
        />

        {!imageLoaded && !imageError && (
          <div className="mobile-gallery-loading">Loading...</div>
        )}

        {imageError && (
          <div className="mobile-gallery-error">Failed to load image</div>
        )}
      </div>

      <div className="mobile-gallery-info">
        <h3 className="mobile-gallery-title">{design.title}</h3>
      </div>
    </div>
  )
})
