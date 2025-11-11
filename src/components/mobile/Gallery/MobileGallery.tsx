// ABOUTME: Mobile gallery component with vertical scrolling layout

'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { TextileDesign } from '@/types/textile'
import MobileGalleryItem from './MobileGalleryItem'

interface MobileGalleryProps {
  designs: TextileDesign[]
}

export default function MobileGallery({ designs }: MobileGalleryProps) {
  const pathname = usePathname()

  // Focus restoration effect for WCAG 2.4.3 compliance
  // Restores keyboard focus to previously selected gallery item after back navigation
  useEffect(() => {
    const savedFocusIndex = sessionStorage.getItem('galleryFocusIndex')
    if (savedFocusIndex !== null && pathname === '/') {
      const focusIndex = parseInt(savedFocusIndex, 10)

      // Mobile-specific timing: 250ms (50ms more than Desktop's 200ms)
      // Allows time for vertical layout reflow and browser scroll restoration
      setTimeout(() => {
        const galleryItem = document.querySelector(
          `[data-testid="gallery-item-${focusIndex}"]`
        ) as HTMLElement

        if (galleryItem) {
          galleryItem.focus()
          sessionStorage.removeItem('galleryFocusIndex')
        }
      }, 250)
    }
  }, [pathname])

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
          isActive={index === 0}
        />
      ))}
    </section>
  )
}
