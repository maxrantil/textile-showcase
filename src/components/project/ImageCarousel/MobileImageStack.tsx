'use client'

import { useMemo } from 'react'
import { ImageBlock } from './ImageBlock'
import type { SanityImageSource } from '@sanity/image-url/lib/types/types'

interface GalleryImage {
  _key: string
  asset: SanityImageSource
  caption?: string
}

interface ExtendedGalleryImage extends GalleryImage {
  isMainImage: boolean
}

interface MobileImageStackProps {
  images?: GalleryImage[]
  mainImage: SanityImageSource
  projectTitle: string
}

export function MobileImageStack({
  images = [],
  mainImage,
  projectTitle,
}: MobileImageStackProps) {
  // Create array of all images for mobile stack
  const allImages = useMemo((): ExtendedGalleryImage[] => {
    const imageArray: ExtendedGalleryImage[] = []

    // Add main image first
    if (mainImage) {
      imageArray.push({
        _key: 'main-image',
        asset: mainImage,
        caption: projectTitle,
        isMainImage: true,
      })
    }

    // Add gallery images
    if (images && images.length > 0) {
      imageArray.push(
        ...images.map((img) => ({
          ...img,
          isMainImage: false,
        }))
      )
    }

    return imageArray
  }, [images, mainImage, projectTitle])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '30px',
        alignItems: 'center',
      }}
    >
      {allImages.map((image, index) => (
        <ImageBlock
          key={`${image._key}-${index}`}
          image={image}
          index={index}
          isFirst={index === 0}
          projectTitle={projectTitle}
        />
      ))}
    </div>
  )
}
