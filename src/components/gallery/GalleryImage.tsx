'use client'

import { memo } from 'react'
import { getOptimizedImageUrl } from '@/sanity/lib'
import { GALLERY_CONFIG } from '@/config/galleryConfig'

interface GalleryImageProps {
  src: any
  alt: string
  index: number
  onClick: () => void
}

export const GalleryImage = memo(function GalleryImage({ 
  src, 
  alt, 
  index, 
  onClick 
}: GalleryImageProps) {
  return (
    <div style={{
      position: 'relative',
      boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
      display: 'inline-block',
      lineHeight: 0,
      backgroundColor: 'transparent'
    }}>
      <img
        src={getOptimizedImageUrl(src, { 
          height: 800,
          quality: index < GALLERY_CONFIG.preloadCount ? 90 : 80, 
          format: 'webp'
        })}
        alt={alt}
        style={{
          height: `${GALLERY_CONFIG.itemHeight}vh`,
          width: 'auto',
          maxHeight: '700px',
          minHeight: '300px',
          display: 'block',
          objectFit: 'contain',
          cursor: 'pointer'
        }}
        loading={index < GALLERY_CONFIG.preloadCount ? 'eager' : 'lazy'}
        onClick={onClick}
      />
    </div>
  )
})
