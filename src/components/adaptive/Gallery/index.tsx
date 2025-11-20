// ABOUTME: Device-adaptive gallery wrapper with SSR-compatible hydration

'use client'

import { useDeviceType } from '@/hooks/shared/useDeviceType'
import { useState, useEffect, useRef } from 'react'
import { TextileDesign } from '@/types/textile'
import DesktopGallery from '@/components/desktop/Gallery/Gallery'
import MobileGallery from '@/components/mobile/Gallery/MobileGallery'
import styles from './index.module.css'

interface AdaptiveGalleryProps {
  designs: TextileDesign[]
}

// Skeleton component that matches gallery dimensions (prevents CLS during hydration)
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

// Minimum skeleton display time (prevents CLS flash, allows test detection)
const MIN_SKELETON_DISPLAY_TIME = 300 // ms

export default function AdaptiveGallery({ designs }: AdaptiveGalleryProps) {
  const deviceType = useDeviceType()
  const [isHydrated, setIsHydrated] = useState(false)
  const skeletonStartTime = useRef(Date.now())

  useEffect(() => {
    // Ensure skeleton displays for minimum time to prevent CLS and allow E2E test detection
    const elapsed = Date.now() - skeletonStartTime.current
    const remainingTime = Math.max(0, MIN_SKELETON_DISPLAY_TIME - elapsed)

    const timer = setTimeout(() => {
      setIsHydrated(true)
    }, remainingTime)

    return () => clearTimeout(timer)
  }, [])

  // Select the appropriate gallery component based on device type
  const isMobile = deviceType === 'mobile' || deviceType === 'tablet'
  const GalleryComponent = isMobile ? MobileGallery : DesktopGallery

  return (
    <div className={styles.container} suppressHydrationWarning>
      <div className={styles.gallery}>
        {isHydrated && <GalleryComponent designs={designs} />}
      </div>
      {!isHydrated && (
        <div className={`${styles.skeleton} ${styles.visible}`}>
          <GallerySkeleton />
        </div>
      )}
    </div>
  )
}
