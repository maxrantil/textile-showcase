'use client'

import { useDeviceType } from '@/hooks/shared/useDeviceType'
import { MobileGallery } from '@/components/mobile/Gallery'
import { DesktopGallery } from '@/components/desktop/Gallery'
import { TextileDesign } from '@/sanity/types'

interface GalleryProps {
  designs: TextileDesign[]
}

export default function Gallery({ designs }: GalleryProps) {
  const deviceType = useDeviceType()

  return deviceType === 'mobile' ? (
    <MobileGallery designs={designs} />
  ) : (
    <DesktopGallery designs={designs} />
  )
}
