// ABOUTME: Mobile gallery item with touch navigation and analytics

'use client'

import { TextileDesign } from '@/types/textile'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { getOptimizedImageUrl } from '@/utils/image-helpers'
import { UmamiEvents } from '@/utils/analytics'
import { LockdownImage } from '@/components/ui/LockdownImage'
import { useState, useEffect } from 'react'

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
  const router = useRouter()
  const [useLockdownMode, setUseLockdownMode] = useState(false)

  // Check for lockdown mode on mount
  useEffect(() => {
    setUseLockdownMode(isLockdownMode())
  }, [])

  const handleClick = () => {
    // Call optional navigation callback first
    if (onNavigate) {
      onNavigate()
    }

    // Track project view
    UmamiEvents.viewProject(design.title, design.year)

    router.push(`/project/${design.slug?.current || design._id}`)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick()
    }
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

  const alt = design.image?.alt || design.title

  return (
    <article
      className="mobile-gallery-item"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`View ${design.title} project${design.year ? ` from ${design.year}` : ''}`}
      data-testid={`gallery-item-${index}`}
      data-active={isActive}
    >
      {imageSource && (
        <div className="mobile-gallery-image-container">
          {useLockdownMode ? (
            // Lockdown mode - use simple image for maximum compatibility
            <LockdownImage
              src={imageSource}
              alt={alt}
              className="mobile-gallery-image"
              style={{ width: '100%', height: 'auto' }}
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
              style={{ width: '100%', height: 'auto' }}
              className="mobile-gallery-image"
              onError={handleImageError}
            />
          )}
        </div>
      )}

      <div className="mobile-gallery-info">
        <h3 className="mobile-gallery-title">{design.title}</h3>
        {design.description && (
          <p className="mobile-gallery-description">{design.description}</p>
        )}
        {/* Year removed per Doctor Hubert's request - keep only title on homepage gallery */}
        {design.category && (
          <p className="mobile-gallery-category">{design.category}</p>
        )}
      </div>
    </article>
  )
}
