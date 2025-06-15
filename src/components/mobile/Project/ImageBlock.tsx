// src/components/mobile/Project/ImageBlock.tsx
'use client'
import React, { useState } from 'react'
import Image from 'next/image'
import {
  getOptimizedImageUrl,
  getImageDimensionsFromSource,
} from '@/sanity/imageHelpers'
import { UmamiEvents } from '@/utils/analytics'
import type { SanityImageSource } from '@sanity/image-url/lib/types/types'

interface ImageBlockProps {
  image: {
    _key: string
    asset: SanityImageSource
    caption?: string
    isMainImage: boolean
  }
  index: number
  isFirst: boolean
  projectTitle: string
}

export const ImageBlock = React.memo(function ImageBlock({
  image,
  index,
  isFirst,
  projectTitle,
}: ImageBlockProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  // Don't render if no asset
  if (!image?.asset) {
    return null
  }

  const imageUrl = getOptimizedImageUrl(image.asset, {
    width: 800,
    quality: 80,
    format: 'webp',
  })

  // Get image dimensions for proper aspect ratio
  const dimensions = getImageDimensionsFromSource(image.asset)
  const aspectRatio = dimensions ? dimensions.aspectRatio : 4 / 3

  const handleImageLoad = () => {
    setImageLoaded(true)
    // Track image view
    UmamiEvents.projectImageView(projectTitle, index + 1)
  }

  return (
    <div className="mobile-image-block">
      <div className="mobile-image-container" style={{ aspectRatio }}>
        <Image
          src={imageUrl}
          alt={image.caption || `${projectTitle} - Image ${index + 1}`}
          fill
          sizes="(max-width: 768px) 100vw, 800px"
          className={`mobile-image ${imageLoaded ? 'loaded' : ''}`}
          loading={isFirst ? 'eager' : 'lazy'}
          onLoad={handleImageLoad}
          onError={() => setImageError(true)}
          style={{ objectFit: 'contain' }}
        />
        {!imageLoaded && !imageError && (
          <div className="mobile-image-loading">
            Loading image {index + 1}...
          </div>
        )}
        {imageError && (
          <div className="mobile-image-error">
            Failed to load image {index + 1}
          </div>
        )}
      </div>
      {image.caption && !image.isMainImage && (
        <p className="mobile-image-caption">{image.caption}</p>
      )}
    </div>
  )
})
