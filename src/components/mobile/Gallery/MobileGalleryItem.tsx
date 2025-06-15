// src/components/mobile/Gallery/MobileGalleryItem.tsx
'use client'

import { useRouter } from 'next/navigation'
import { TextileDesign } from '@/sanity/types'
import { OptimizedImage } from '@/components/ui/OptimizedImage'

interface MobileGalleryItemProps {
  design: TextileDesign
  isActive: boolean
}

export function MobileGalleryItem({
  design,
  isActive,
}: MobileGalleryItemProps) {
  const router = useRouter()

  const handleClick = () => {
    router.push(`/project/${design.slug?.current || design._id}`)
  }

  return (
    <div
      className={`mobile-gallery-item ${isActive ? 'active' : ''}`}
      onClick={handleClick}
    >
      <OptimizedImage
        src={design.image}
        alt={design.title}
        width={400}
        height={600}
        priority={isActive}
      />

      <div className="mobile-gallery-info">
        <h3>{design.title}</h3>
        {design.year && <p>{design.year}</p>}
      </div>
    </div>
  )
}
