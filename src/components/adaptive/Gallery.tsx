// ABOUTME: Phase 2C adaptive gallery with dynamic imports and progressive hydration
// Critical rendering path optimization for TTI improvement

'use client'

import { useState, useEffect, Suspense } from 'react'
import dynamic from 'next/dynamic'
import { TextileDesign } from '@/types/textile'
import { GalleryLoadingSkeleton } from '@/components/ui/LoadingSpinner'

// PHASE 2C: Dynamic imports with SSR disabled to reduce initial bundle
const DesktopGallery = dynamic(
  () =>
    import('@/components/desktop/Gallery/DesktopGallery').then((mod) => ({
      default: mod.DesktopGallery,
    })),
  {
    ssr: false, // Critical: Avoid SSR for heavy interactive components
    loading: () => <GalleryLoadingSkeleton />,
  }
)

const MobileGallery = dynamic(
  () =>
    import('@/components/mobile/Gallery/MobileGallery').then((mod) => ({
      default: mod.MobileGallery,
    })),
  {
    ssr: false, // Critical: Avoid SSR for heavy interactive components
    loading: () => <GalleryLoadingSkeleton />,
  }
)

interface GalleryProps {
  designs: TextileDesign[]
}

export default function Gallery({ designs }: GalleryProps) {
  const [isMobile, setIsMobile] = useState<boolean | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)

  // PHASE 2C: Progressive hydration - defer component selection until after render
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase()
      const isMobileDevice =
        /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(
          userAgent
        )
      const isSmallScreen = window.innerWidth < 768
      return isMobileDevice || isSmallScreen
    }

    // Use requestIdleCallback for non-critical hydration
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      window.requestIdleCallback(
        () => {
          setIsMobile(checkMobile())
          setIsHydrated(true)
        },
        { timeout: 500 }
      )
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => {
        setIsMobile(checkMobile())
        setIsHydrated(true)
      }, 100)
    }
  }, [])

  // PHASE 2C: Show loading skeleton until progressive hydration completes
  if (!isHydrated || isMobile === null) {
    return <GalleryLoadingSkeleton />
  }

  // PHASE 2C: Render appropriate gallery component based on device
  return (
    <Suspense fallback={<GalleryLoadingSkeleton />}>
      {isMobile ? (
        <MobileGallery designs={designs} />
      ) : (
        <DesktopGallery designs={designs} />
      )}
    </Suspense>
  )
}
