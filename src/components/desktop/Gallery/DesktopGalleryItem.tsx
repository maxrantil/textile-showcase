'use client'

import { memo } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { TextileDesign } from '@/sanity/types'
import { getOptimizedImageUrl } from '@/sanity/imageHelpers'
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

  const imageUrl = getOptimizedImageUrl(design.image, {
    height: 800,
    quality: 90,
    format: 'webp',
  })

  return (
    <div
      className={`desktop-gallery-item ${isActive ? 'active' : ''}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleClick()
        }
      }}
    >
      <div className="desktop-gallery-image">
        <Image
          src={imageUrl}
          alt={design.title}
          width={600}
          height={800}
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
