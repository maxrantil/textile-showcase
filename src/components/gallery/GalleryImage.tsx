'use client'

import { memo } from 'react'
import { getOptimizedImageUrl } from '@/sanity/lib'
import { getGalleryConfig } from '@/config/responsiveConfig'
import { GALLERY_CONFIG } from '@/config/galleryConfig'

interface GalleryImageProps {
  src: any
  alt: string
  index: number
  onClick: () => void
  breakpoint: 'mobile' | 'tablet' | 'desktop'
}

export const GalleryImage = memo(function GalleryImage({ 
  src, 
  alt, 
  index, 
  onClick,
  breakpoint
}: GalleryImageProps) {
  
  const galleryConfig = getGalleryConfig(breakpoint)
  
  // Responsive image dimensions
  const getImageDimensions = () => {
    switch (breakpoint) {
      case 'mobile':
        return {
          width: 400,
          maxHeight: 'min(65vh, 450px)',
          minHeight: '200px'
        }
      case 'tablet':
        return {
          width: 600,
          maxHeight: 'min(70vh, 600px)',
          minHeight: '300px'
        }
      default:
        return {
          width: 800,
          maxHeight: '700px',
          minHeight: '300px'
        }
    }
  }
  
  const dimensions = getImageDimensions()
  
  return (
    <div style={{
      position: 'relative',
      boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
      display: 'inline-block',
      lineHeight: 0,
      backgroundColor: 'transparent',
      borderRadius: breakpoint === 'mobile' ? '8px' : '4px',
      overflow: 'hidden',
      width: '100%'
    }}>
      <img
        src={getOptimizedImageUrl(src, { 
          width: dimensions.width,
          quality: index < GALLERY_CONFIG.preloadCount ? 90 : 80, 
          format: 'webp'
        })}
        alt={alt}
        style={{
          width: '100%',
          height: breakpoint === 'desktop' ? `${galleryConfig.itemHeight}vh` : 'auto',
          maxHeight: dimensions.maxHeight,
          minHeight: dimensions.minHeight,
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
