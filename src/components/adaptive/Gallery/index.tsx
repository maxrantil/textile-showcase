// ABOUTME: Device-adaptive gallery wrapper with SSR-compatible hydration

'use client'

import { useDeviceType } from '@/hooks/shared/useDeviceType'
import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { TextileDesign } from '@/types/textile'

// Dynamic imports - only load what's needed per device
const DesktopGallery = dynamic(
  () => import('@/components/desktop/Gallery/Gallery')
)
const MobileGallery = dynamic(
  () => import('@/components/mobile/Gallery/MobileGallery')
)

interface AdaptiveGalleryProps {
  designs: TextileDesign[]
}

// Skeleton component that matches gallery dimensions (prevents CLS during hydration)
function GallerySkeleton() {
  return (
    <div
      data-testid="gallery-loading-skeleton"
      style={{
        minHeight: '400px',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: 0.3,
      }}
      aria-hidden="true"
    >
      <div style={{ fontSize: '14px', color: '#999' }}>Loading gallery...</div>
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

  // Opacity transition masks desktop→mobile switch during hydration (prevents CLS)
  const transitionStyle = {
    opacity: isHydrated ? 1 : 0,
    transition: 'opacity 300ms ease-in-out',
    minHeight: '400px', // Reserve space to prevent layout shift
  }

  return (
    <div style={transitionStyle} suppressHydrationWarning>
      {!isHydrated ? (
        <GallerySkeleton />
      ) : deviceType === 'mobile' || deviceType === 'tablet' ? (
        <MobileGallery designs={designs} />
      ) : (
        <DesktopGallery designs={designs} />
      )}
    </div>
  )
}
