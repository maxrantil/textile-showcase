'use client'
import { useEffect } from 'react'
import { MobileGalleryItem } from './MobileGalleryItem'
import { TextileDesign } from '@/sanity/types'
import { UmamiEvents } from '@/utils/analytics'

interface MobileGalleryProps {
  designs: TextileDesign[]
}

export function MobileGallery({ designs }: MobileGalleryProps) {
  useEffect(() => {
    UmamiEvents.trackEvent('mobile-gallery-view', {
      totalItems: designs.length,
    })
  }, [designs.length])

  return (
    <div className="mobile-gallery">
      <div className="mobile-gallery-stack">
        {designs.map((design, index) => (
          <MobileGalleryItem
            key={design._id}
            design={design}
            index={index}
            isFirst={index === 0}
          />
        ))}
      </div>
    </div>
  )
}
