'use client'
import { useDeviceType } from '@/hooks/shared/useDeviceType'
import { TextileDesign } from '@/sanity/types'
import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

// Dynamic imports for gallery components to reduce initial bundle size
const MobileGallery = dynamic(
  () =>
    import('@/components/mobile/Gallery').then((mod) => ({
      default: mod.MobileGallery,
    })),
  {
    loading: () => <div className="gallery-loading">Loading gallery...</div>,
    ssr: false,
  }
)

const DesktopGallery = dynamic(
  () =>
    import('@/components/desktop/Gallery').then((mod) => ({
      default: mod.DesktopGallery,
    })),
  {
    loading: () => <div className="gallery-loading">Loading gallery...</div>,
    ssr: false,
  }
)

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

  return deviceType === 'mobile' ? (
    <MobileGallery designs={designs} />
  ) : (
    <DesktopGallery designs={designs} />
  )
}
