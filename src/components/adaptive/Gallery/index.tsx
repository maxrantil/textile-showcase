// ABOUTME: Device-adaptive gallery using CSS media queries for SSR-compatible LCP optimisation
// Server component: renders both galleries in SSR HTML; CSS shows the correct one per viewport
// Issue #348: Eliminates isHydrated barrier — LCP image now in initial HTML, Render Delay → ~0

import { TextileDesign } from '@/types/textile'
import DesktopGallery from '@/components/desktop/Gallery/Gallery'
import MobileGallery from '@/components/mobile/Gallery/MobileGallery'
import styles from './index.module.css'

interface AdaptiveGalleryProps {
  designs: TextileDesign[]
}

// Kept for backward compatibility with external references
export function GallerySkeleton() {
  return (
    <div
      data-testid="gallery-loading-skeleton"
      className={styles.skeletonContent}
      aria-hidden="true"
    >
      <div className={styles.skeletonText}>Loading gallery...</div>
    </div>
  )
}

export default function AdaptiveGallery({ designs }: AdaptiveGalleryProps) {
  return (
    <div className={styles.container}>
      {/* Mobile gallery: visible on mobile/tablet via CSS, hidden on desktop */}
      <div className={styles.mobileOnly}>
        <MobileGallery designs={designs} />
      </div>
      {/* Desktop gallery: visible on desktop via CSS, hidden on mobile/tablet */}
      <div className={styles.desktopOnly}>
        <DesktopGallery designs={designs} />
      </div>
    </div>
  )
}
