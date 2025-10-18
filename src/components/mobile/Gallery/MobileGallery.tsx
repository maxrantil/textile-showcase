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
      >
        <div className="mobile-gallery-empty" role="status" aria-live="polite">
          No designs available to display
        </div>
      </section>
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
