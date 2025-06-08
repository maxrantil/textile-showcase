// src/components/gallery/GalleryPreloader.tsx
'use client'

import { useEffect } from 'react'
import { getOptimizedImageUrl } from '@/sanity/imageHelpers'
import { preloadImages } from '@/utils/performance'
import { TextileDesign } from '@/sanity/types'

interface GalleryPreloaderProps {
  designs: TextileDesign[]
  currentIndex: number
  isMobile: boolean
}

export function useGalleryPreloader({
  designs,
  currentIndex,
  isMobile,
}: GalleryPreloaderProps) {
  // Preload adjacent images for better performance
  useEffect(() => {
    if (!isMobile && designs.length > 1) {
      const prevIndex =
        currentIndex === 0 ? designs.length - 1 : currentIndex - 1
      const nextIndex =
        currentIndex === designs.length - 1 ? 0 : currentIndex + 1

      const adjacentUrls = [
        designs[prevIndex]?.image
          ? getOptimizedImageUrl(designs[prevIndex].image, {
              width: 800,
              quality: 80,
              format: 'webp',
            })
          : null,
        designs[nextIndex]?.image
          ? getOptimizedImageUrl(designs[nextIndex].image, {
              width: 800,
              quality: 80,
              format: 'webp',
            })
          : null,
      ].filter(Boolean) as string[]

      if (adjacentUrls.length > 0) {
        if (process.env.NODE_ENV === 'development') {
          console.log('🔄 Preloading adjacent images:', adjacentUrls.length)
        }
        preloadImages(adjacentUrls).catch((error) => {
          console.warn('⚠️ Failed to preload some images:', error)
        })
      }
    }
  }, [currentIndex, designs, isMobile])
}
