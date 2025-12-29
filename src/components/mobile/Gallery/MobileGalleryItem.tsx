// ABOUTME: Mobile gallery item with touch navigation and analytics

'use client'

import { TextileDesign } from '@/types/textile'
import Image from 'next/image'
import Link from 'next/link'
import { getOptimizedImageUrl } from '@/utils/image-helpers'
import { UmamiEvents } from '@/utils/analytics'
import { LockdownImage } from '@/components/ui/LockdownImage'
import { useState, useEffect } from 'react'
import styles from './MobileGalleryItem.module.css'

interface MobileGalleryItemProps {
  design: TextileDesign
  index?: number
  isPriority?: boolean
  isActive?: boolean
  onNavigate?: () => void
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

export default function MobileGalleryItem({
  design,
  index = 0,
  isPriority = false,
  isActive = false,
  onNavigate,
}: MobileGalleryItemProps) {
  const [useLockdownMode, setUseLockdownMode] = useState(false)

  // Check for lockdown mode on mount
  useEffect(() => {
    setUseLockdownMode(isLockdownMode())
  }, [])

  const handleClick = () => {
    // Save focus index BEFORE navigation for restoration (WCAG 2.4.3)
    if (typeof window !== 'undefined' && index !== undefined) {
      sessionStorage.setItem('galleryFocusIndex', index.toString())
    }

    // Call optional navigation callback first
    if (onNavigate) {
      onNavigate()
    }

    // Track project view
    UmamiEvents.viewProject(design.title, design.year)
  }

  const handleImageError = () => {
    // If error occurs and not already in lockdown mode, try switching
    if (!useLockdownMode && isLockdownMode()) {
      console.log('🔒 Image failed, switching to lockdown mode for gallery')
      setUseLockdownMode(true)
    }
  }

  // Image source with fallback chain
  const imageSource = design.image || design.images?.[0]?.asset
  const imageUrl = imageSource
    ? getOptimizedImageUrl(imageSource, {
        width: 800, // Mobile screen optimal
        quality: 80, // Balance quality/size
        format: 'auto', // Use auto format for lockdown detection
      })
    : '/images/placeholder.jpg' // Fallback

  const alt = design.image?.alt || `Textile design artwork: ${design.title}${design.year ? ` (${design.year})` : ''}`

  const projectUrl = `/project/${design.slug?.current || design._id}`

  return (
    <Link
      href={projectUrl}
      className="mobile-gallery-item"
      onClick={handleClick}
      aria-label={`View ${design.title} project${design.year ? ` from ${design.year}` : ''}`}
      data-testid={`gallery-item-${index}`}
      data-active={isActive}
    >
      <article>
        {imageSource && (
          <div className="mobile-gallery-image-container">
            {useLockdownMode ? (
              // Lockdown mode - use simple image for maximum compatibility
              <LockdownImage
                src={imageSource}
                alt={alt}
                className={`mobile-gallery-image ${styles.fullWidthImage}`}
              />
            ) : (
              // Normal mode - use Next.js Image
              <Image
                src={imageUrl}
                alt={alt}
                width={800}
                height={600}
                sizes="100vw"
                priority={isPriority}
                loading={isPriority ? 'eager' : 'lazy'}
                className={`mobile-gallery-image ${styles.fullWidthImage}`}
                onError={handleImageError}
              />
            )}
          </div>
        )}

        <div className="mobile-gallery-info">
          <h2 className="mobile-gallery-title">{design.title}</h2>
          {design.description && (
            <p className="mobile-gallery-description">{design.description}</p>
          )}
          {/* Year removed per Doctor Hubert's request - keep only title on homepage gallery */}
          {design.category && (
            <p className="mobile-gallery-category">{design.category}</p>
          )}
        </div>
      </article>
    </Link>
  )
}
