// ABOUTME: Device-adaptive gallery wrapper with SSR-compatible hydration

'use client'

import { useDeviceType } from '@/hooks/shared/useDeviceType'
import { useState, useEffect } from 'react'
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

export default function AdaptiveGallery({ designs }: AdaptiveGalleryProps) {
  const deviceType = useDeviceType()
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Show loading state during hydration to prevent flash
  if (!isHydrated) {
    return <div>Loading...</div>
  }

  // Render appropriate gallery based on device type
  // Mobile and tablet use the mobile gallery (vertical scroll)
  // Desktop uses the carousel gallery (horizontal scroll)
  if (deviceType === 'mobile' || deviceType === 'tablet') {
    return <MobileGallery designs={designs} />
  }

  return <DesktopGallery designs={designs} />
}
