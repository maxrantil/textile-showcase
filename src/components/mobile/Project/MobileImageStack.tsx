// ABOUTME: Mobile image gallery stack component combining main image and gallery images
'use client'

import { useMemo } from 'react'
import { ImageBlock } from './ImageBlock'
import type { ImageSource } from '@/types/textile'

interface GalleryImage {
  _key: string
  asset: ImageSource
  caption?: string
}

interface ExtendedGalleryImage extends GalleryImage {
  isMainImage: boolean
}

interface MobileImageStackProps {
  images?: GalleryImage[]
  mainImage: ImageSource
  projectTitle: string
  // 'lead' renders only the main image, 'rest' everything after it
  range?: 'all' | 'lead' | 'rest'
}

export function MobileImageStack({
  images = [],
  mainImage,
  projectTitle,
  range = 'all',
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

  // Indices stay those of the full list, so alt text and analytics keep counting from the main image
  const visibleImages = allImages
    .map((image, index) => ({ image, index }))
    .filter(({ index }) =>
      range === 'lead' ? index === 0 : range === 'rest' ? index > 0 : true
    )

  if (range !== 'all' && visibleImages.length === 0) {
    return null
  }

  return (
    <div
      className={
        range === 'lead'
          ? 'mobile-image-stack mobile-image-stack-lead'
          : 'mobile-image-stack'
      }
    >
      {visibleImages.map(({ image, index }) => (
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
