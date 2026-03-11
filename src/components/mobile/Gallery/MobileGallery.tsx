// ABOUTME: Mobile gallery component with vertical scrolling layout — server component

import { TextileDesign } from '@/types/textile'
import MobileGalleryItem from './MobileGalleryItem'
import { MobileGalleryContainer } from './MobileGalleryContainer'

// Issue #236: Removed DOM polling for FirstImage hiding - now handled by CSS animation
// This eliminates 2-20s JavaScript overhead on Safari

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
    <MobileGalleryContainer>
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
    </MobileGalleryContainer>
  )
}
