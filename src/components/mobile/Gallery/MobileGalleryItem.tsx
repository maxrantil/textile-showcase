'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { TextileDesign } from '@/types/textile'
import { getOptimizedImageUrl } from '@/utils/image-helpers'
import { LockdownImage } from '@/components/ui/LockdownImage'
import { scrollManager } from '@/lib/scrollManager'
import { UmamiEvents } from '@/utils/analytics'

interface MobileGalleryItemProps {
  design: TextileDesign
  index: number
  isFirst: boolean
  onClick?: () => void
}

// Simple lockdown mode detection
const isLockdownMode = () => {
  if (typeof window === 'undefined') return false

  try {
    const isIOS = /iPad|iPhone|iPod/.test(window.navigator.userAgent)
    const hasIntersectionObserver = 'IntersectionObserver' in window
    const hasWebGL = !!window.WebGLRenderingContext

    return isIOS && (!hasIntersectionObserver || !hasWebGL)
  } catch {
    return false
  }
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
  const [useLockdownMode, setUseLockdownMode] = useState(false)

  // Check for lockdown mode on mount
  useEffect(() => {
    setUseLockdownMode(isLockdownMode())
  }, [])

  const handleClick = () => {
    onClick?.()

    UmamiEvents.trackEvent('mobile-gallery-item-click', {
      title: design.title,
      index: index,
    })

    UmamiEvents.trackEvent('project-view', {
      project: design.slug?.current,
      index,
      source: 'mobile-gallery',
    })

    scrollManager.triggerNavigationStart()
    router.push(`/project/${design.slug?.current || design._id}`)
  }

  // Get image dimensions for proper aspect ratio
  // Use default aspect ratio for performance optimization
  const aspectRatio = 4 / 3

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

    // Fallback to lockdown mode if normal loading fails
    if (!useLockdownMode) {
      console.log('🔒 Switching to lockdown mode due to image error')
      setUseLockdownMode(true)
      setImageError(false)
    }
  }

  return (
    <div
      className="mobile-gallery-item"
      data-testid={`mobile-gallery-item-${index}`}
      onClick={handleClick}
      data-index={index}
    >
      <div className="mobile-gallery-image-container" style={{ aspectRatio }}>
        {useLockdownMode ? (
          // Lockdown mode - use simple img tag
          <LockdownImage
            src={design.image || design.images?.[0]?.asset}
            alt={design.title}
            className="mobile-gallery-image loaded"
          />
        ) : (
          // Normal mode - use Next.js Image
          <>
            {(() => {
              const imageSource = design.image || design.images?.[0]?.asset
              return (
                imageSource && (
                  <Image
                    src={getOptimizedImageUrl(imageSource, {
                      width: 450,
                      quality: 80,
                      format: 'auto',
                    })}
                    alt={design.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 450px"
                    className={`mobile-gallery-image ${imageLoaded ? 'loaded' : ''}`}
                    loading={isFirst ? 'eager' : 'lazy'}
                    priority={isFirst}
                    fetchPriority={isFirst ? 'high' : 'auto'}
                    onLoad={handleImageLoad}
                    onError={handleImageError}
                  />
                )
              )
            })()}

            {!imageLoaded && !imageError && (
              <div className="mobile-gallery-loading">
                <div className="loading-spinner" />
                <span>Loading...</span>
              </div>
            )}

            {imageError && (
              <div className="mobile-gallery-error">
                <span>Failed to load image</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setImageError(false)
                    setImageLoaded(false)
                    setUseLockdownMode(true) // Try lockdown mode
                  }}
                  className="retry-button"
                >
                  Retry
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <div className="mobile-gallery-info">
        <h3 className="mobile-gallery-title">{design.title}</h3>
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
          LOCKDOWN
        </div>
      )}
    </div>
  )
})
