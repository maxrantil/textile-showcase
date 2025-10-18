// ABOUTME: Mobile gallery item with touch navigation and analytics

'use client'

import { TextileDesign } from '@/types/textile'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { getOptimizedImageUrl } from '@/utils/image-helpers'
import { UmamiEvents } from '@/utils/analytics'

interface MobileGalleryItemProps {
  design: TextileDesign
  index?: number
  isPriority?: boolean
  onNavigate?: () => void
}

export default function MobileGalleryItem({
  design,
  index = 0,
  isPriority = false,
  onNavigate,
}: MobileGalleryItemProps) {
  const router = useRouter()

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

  // Image source with fallback chain
  const imageSource = design.image || design.images?.[0]?.asset
  const imageUrl = imageSource
    ? getOptimizedImageUrl(imageSource, {
        width: 800, // Mobile screen optimal
        quality: 80, // Balance quality/size
        format: 'webp', // Modern format with fallback
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
      data-testid={`mobile-gallery-item-${index}`}
    >
      {imageUrl && (
        <div className="mobile-gallery-image-container">
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
          />
        </div>
      )}

      <div className="mobile-gallery-info">
        <h3 className="mobile-gallery-title">{design.title}</h3>
        {design.description && (
          <p className="mobile-gallery-description">{design.description}</p>
        )}
        {design.year && <p className="mobile-gallery-year">{design.year}</p>}
        {design.category && (
          <p className="mobile-gallery-category">{design.category}</p>
        )}
      </div>
    </article>
  )
}
