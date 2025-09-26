'use client'

import { memo } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { TextileDesign } from '@/types/textile'
import { getOptimizedImageUrl } from '@/utils/image-helpers'
import { UmamiEvents } from '@/utils/analytics'

interface DesktopGalleryItemProps {
  design: TextileDesign
  index: number
  isActive: boolean
  onNavigate?: () => void
}

export const DesktopGalleryItem = memo(function DesktopGalleryItem({
  design,
  index,
  isActive,
  onNavigate,
}: DesktopGalleryItemProps) {
  const router = useRouter()

  const handleClick = () => {
    // Save position before navigating
    onNavigate?.()

    UmamiEvents.viewProject(design.title, design.year)
    router.push(`/project/${design.slug?.current || design._id}`)
  }

  const imageSource = design.image || design.images?.[0]?.asset
  const imageUrl = imageSource
    ? getOptimizedImageUrl(imageSource, {
        height: 1200, // 2x of ~600px (60vh on typical screen)
        quality: 95,
        format: 'webp',
        fit: 'crop',
      })
    : ''

  // Fallback for missing images
  const displayImageUrl = imageUrl || '/images/placeholder.jpg'

  return (
    <div
      className={`desktop-gallery-item ${isActive ? 'active' : ''}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      data-testid={`desktop-gallery-item-${index}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleClick()
        }
      }}
    >
      <div className="desktop-gallery-image">
        <Image
          src={displayImageUrl}
          alt={design.title}
          height={600} // Approximate 60vh in pixels
          width={800} // Reasonable fallback width
          style={{
            width: 'auto', // Let CSS control the actual width
            height: '60vh', // Match your desired CSS height
            objectFit: 'contain',
          }}
          priority={index < 3}
          className="desktop-gallery-img"
        />
      </div>

      <div className="desktop-gallery-info">
        <h3>{design.title}</h3>
      </div>
    </div>
  )
})
