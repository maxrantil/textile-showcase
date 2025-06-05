'use client'

import React, { useState, useEffect } from 'react'
import { getOptimizedImageUrl } from '@/sanity/lib'
import { UmamiEvents } from '@/utils/analytics'
import { perf } from '@/utils/performance'
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
  projectTitle
}: ImageBlockProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  // Track mobile image view when it loads
  useEffect(() => {
    if (imageLoaded) {
      perf.start(`mobile-image-track-${index}`)
      try {
        UmamiEvents.projectImageView(projectTitle, index + 1)
      } finally {
        perf.end(`mobile-image-track-${index}`)
      }
    }
  }, [imageLoaded, projectTitle, index])

  // Don't render if no asset
  if (!image?.asset) {
    return null
  }

  const imageUrl = getOptimizedImageUrl(image.asset, {
    width: 400,
    height: 600,
    quality: 80,
    format: 'webp'
  })

  return (
    <div style={{
      width: '100%',
      position: 'relative'
    }}>
      <div style={{
        position: 'relative',
        background: '#fff',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
      }}>
        <img
          src={imageUrl}
          alt={image.caption || `Project image ${index + 1}`}
          style={{
            width: '100%',
            height: 'auto',
            display: 'block',
            objectFit: 'contain',
            maxHeight: '70vh',
            minHeight: '200px',
            opacity: imageLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease'
          }}
          loading={isFirst ? 'eager' : 'lazy'}
          onLoad={() => {
            if (process.env.NODE_ENV === 'development') {
              console.log(`✅ Image ${index + 1} loaded successfully`)
            }
            setImageLoaded(true)
          }}
          onError={(e) => {
            if (process.env.NODE_ENV === 'development') {
              console.error(`❌ Image ${index + 1} failed to load:`, e)
            }
            setImageError(true)
          }}
        />

        {/* Loading overlay */}
        {!imageLoaded && !imageError && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: '#f5f5f5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#999',
            fontSize: '14px',
            minHeight: '200px'
          }}>
            Loading image {index + 1}...
          </div>
        )}

        {/* Error overlay */}
        {imageError && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: '#f5f5f5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#999',
            fontSize: '14px',
            flexDirection: 'column',
            gap: '8px',
            minHeight: '200px'
          }}>
            <div>❌ Failed to load image {index + 1}</div>
            <div style={{ fontSize: '12px' }}>
              Key: {image._key}
            </div>
          </div>
        )}
      </div>

      {/* Image caption */}
      {image.caption && !image.isMainImage && (
        <p style={{
          textAlign: 'center',
          fontSize: '14px',
          color: '#666',
          margin: '12px 0 0 0',
          fontStyle: 'italic'
        }}>
          {image.caption}
        </p>
      )}
    </div>
  )
})
