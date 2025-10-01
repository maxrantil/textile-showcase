// ABOUTME: Phase 2C adaptive gallery with dynamic imports and progressive hydration
// Critical rendering path optimization for TTI improvement

'use client'

import { useState, useEffect, Suspense } from 'react'
import dynamic from 'next/dynamic'
import { TextileDesign } from '@/types/textile'
import { GalleryLoadingSkeleton } from '@/components/ui/LoadingSpinner'

// PHASE 2D: Enable SSR for above-the-fold content to improve LCP
const DesktopGallery = dynamic(
  () =>
    import('@/components/desktop/Gallery/DesktopGallery').then((mod) => ({
      default: mod.DesktopGallery,
    })),
  {
    ssr: true, // Phase 2D: Enable SSR for LCP optimization
    loading: () => <GalleryLoadingSkeleton />,
  }
)

const MobileGallery = dynamic(
  () =>
    import('@/components/mobile/Gallery/MobileGallery').then((mod) => ({
      default: mod.MobileGallery,
    })),
  {
    ssr: true, // Phase 2D: Enable SSR for LCP optimization
    loading: () => <GalleryLoadingSkeleton />,
  }
)

interface GalleryProps {
  designs: TextileDesign[]
}

export default function Gallery({ designs }: GalleryProps) {
  const [isMobile, setIsMobile] = useState<boolean | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)

  // PHASE 2D: Immediate device detection for LCP optimization
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

    // Phase 2D: Immediate detection to reduce LCP delay
    setIsMobile(checkMobile())
    setIsHydrated(true)
  }, [])

  // PHASE 2D: Render immediately with server-side content for better LCP
  if (!isHydrated) {
    // Default to desktop on server-side for SSR consistency
    return (
      <Suspense fallback={<GalleryLoadingSkeleton />}>
        <DesktopGallery designs={designs} />
      </Suspense>
    )
  }

  // PHASE 2D: Client-side rendering with detected device type
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
