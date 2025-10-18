// ABOUTME: Mobile gallery component with vertical scrolling layout

'use client'

import { TextileDesign } from '@/types/textile'
import MobileGalleryItem from './MobileGalleryItem'

interface MobileGalleryProps {
  designs: TextileDesign[]
}

export default function MobileGallery({ designs }: MobileGalleryProps) {
  if (!designs || designs.length === 0) {
    return (
      <section
        className="mobile-gallery"
        aria-label="Mobile textile gallery"
        data-testid="mobile-gallery"
      />
    )
  }

  return (
    <section
      className="mobile-gallery"
      aria-label="Mobile textile gallery"
      data-testid="mobile-gallery"
    >
      {designs.map((design, index) => (
        <MobileGalleryItem
          key={design._id}
          design={design}
          index={index}
          isPriority={index < 2}
        />
      ))}
    </section>
  )
}
