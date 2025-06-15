'use client'
import { useDeviceType } from '@/hooks/shared/useDeviceType'
import { MobileGallery } from '@/components/mobile/Gallery'
import { DesktopGallery } from '@/components/desktop/Gallery'
import { TextileDesign } from '@/sanity/types'
import { useState, useEffect } from 'react'

interface GalleryProps {
  designs: TextileDesign[]
}

export default function Gallery({ designs }: GalleryProps) {
  const deviceType = useDeviceType()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Don't render anything until we're on the client and device type is stable
  if (!isClient) {
    return <div className="gallery-loading">Loading...</div>
  }

  console.log('Device type gallery (final):', deviceType)

  return deviceType === 'mobile' ? (
    <MobileGallery designs={designs} />
  ) : (
    <DesktopGallery designs={designs} />
  )
}
