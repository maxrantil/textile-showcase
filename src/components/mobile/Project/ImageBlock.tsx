// ABOUTME: Project image component with lazy loading and iOS lockdown mode detection
'use client'
import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { getOptimizedImageUrl } from '@/utils/image-helpers'
import { LockdownImage } from '@/components/ui/LockdownImage'
import { UmamiEvents } from '@/utils/analytics'
import type { ImageSource } from '@/types/textile'

interface ImageBlockProps {
  image: {
    _key: string
    asset: ImageSource
    caption?: string
    isMainImage: boolean
  }
  index: number
  isFirst: boolean
  projectTitle: string
}

// Simple lockdown mode detection
const isLockdownMode = () => {
  if (typeof window === 'undefined') return false

  try {
    const isIOS = /iPad|iPhone|iPod/.test(window.navigator.userAgent)
    const hasIntersectionObserver =
      typeof window.IntersectionObserver !== 'undefined'
    const hasWebGL = !!window.WebGLRenderingContext

    return isIOS && (!hasIntersectionObserver || !hasWebGL)
  } catch {
    return false
  }
}

export const ImageBlock = React.memo(function ImageBlock({
  image,
  index,
  isFirst,
  projectTitle,
}: ImageBlockProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [useLockdownMode, setUseLockdownMode] = useState(false)

  // Check for lockdown mode on mount
  useEffect(() => {
    setUseLockdownMode(isLockdownMode())
  }, [])

  // Don't render if no asset
  if (!image?.asset) {
    return null
  }

  // Use default aspect ratio for performance optimization
  const aspectRatio = 4 / 3

  const handleImageLoad = () => {
    setImageLoaded(true)
    // Track image view
    UmamiEvents.projectImageView(projectTitle, index + 1)
  }

  const handleImageError = () => {
    setImageError(true)

    // If error occurs and not already in lockdown mode, try switching
    if (!useLockdownMode && isLockdownMode()) {
      console.log(
        '🔒 Image failed, switching to lockdown mode for project image'
      )
      setUseLockdownMode(true)
      setImageError(false)
    }
  }

  return (
    <div className="mobile-image-block">
      <div className="mobile-image-container" style={{ aspectRatio }}>
        {useLockdownMode ? (
          // Lockdown mode - use simple image
          <LockdownImage
            src={image.asset}
            alt={image.caption || `${projectTitle} - Image ${index + 1}`}
            className="mobile-image loaded"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : (
          // Normal mode - use Next.js Image
          <>
            <Image
              src={getOptimizedImageUrl(image.asset, {
                width: 800,
                quality: 80,
                format: 'auto', // Use auto format for lockdown detection
              })}
              alt={image.caption || `${projectTitle} - Image ${index + 1}`}
              fill
              sizes="(max-width: 768px) 100vw, 800px"
              className={`mobile-image ${imageLoaded ? 'loaded' : ''}`}
              loading={isFirst ? 'eager' : 'lazy'}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />

            {!imageLoaded && !imageError && (
              <div className="mobile-image-loading">
                Loading image {index + 1}...
              </div>
            )}

            {imageError && (
              <div className="mobile-image-error">
                <span>Failed to load image {index + 1}</span>
                <button
                  onClick={() => {
                    setImageError(false)
                    setImageLoaded(false)
                    setUseLockdownMode(true) // Try lockdown mode
                  }}
                  style={{
                    marginTop: '8px',
                    padding: '4px 8px',
                    fontSize: '12px',
                    background: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  Retry
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {image.caption && !image.isMainImage && (
        <p className="mobile-image-caption">{image.caption}</p>
      )}

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
          LOCKDOWN
        </div>
      )}
    </div>
  )
})
