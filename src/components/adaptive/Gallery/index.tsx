// src/components/adaptive/Gallery/index.tsx
'use client'

import { useDeviceTypeAdvanced } from '@/hooks/shared/useDeviceType'
import { MobileGallery } from '@/components/mobile/Gallery/MobileGallery'
import { DesktopGallery } from '@/components/desktop/Gallery/DesktopGallery'
import { TextileDesign } from '@/sanity/types'

interface GalleryProps {
  designs: TextileDesign[]
}

export default function Gallery({ designs }: GalleryProps) {
  const deviceType = useDeviceTypeAdvanced()

  return deviceType === 'mobile' ? (
    <MobileGallery designs={designs} />
  ) : (
    <DesktopGallery designs={designs} />
  )
}
