/* eslint-disable @next/next/no-img-element */
'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation'
import { getOptimizedImageUrl, SANITY_CDN_CONFIG } from '@/sanity/imageHelpers'
import NavigationArrows from '../../ui/NavigationArrows'
import { UmamiEvents } from '@/utils/analytics'
import { perf } from '@/utils/performance'
import type { SanityImageSource } from '@sanity/image-url/lib/types/types'

interface GalleryImage {
  _key: string
  asset: SanityImageSource
  caption?: string
}

interface ExtendedGalleryImage extends GalleryImage {
  isMainImage: boolean
}

interface DesktopCarouselProps {
  images?: GalleryImage[]
  mainImage: SanityImageSource
  projectTitle: string
}

export function DesktopCarousel({ 
  images = [], 
  mainImage, 
  projectTitle 
}: DesktopCarouselProps) {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)
  
  // Create array of all images for carousel
  const allImages = useMemo((): ExtendedGalleryImage[] => {
    const imageArray: ExtendedGalleryImage[] = []
    
    // Add main image first
    if (mainImage) {
      imageArray.push({
        _key: 'main-image',
        asset: mainImage,
        caption: projectTitle,
        isMainImage: true
      })
    }
    
    // Add gallery images
    if (images && images.length > 0) {
      imageArray.push(...images.map(img => ({
        ...img,
        isMainImage: false
      })))
    }
    
    return imageArray
  }, [images, mainImage, projectTitle])

  const currentImage = allImages[currentIndex]

  // Navigation functions with performance monitoring
  const goToPrevious = useCallback(() => {
    perf.start('carousel-navigation-previous')
    
    try {
      const newIndex = currentIndex === 0 ? allImages.length - 1 : currentIndex - 1
      UmamiEvents.projectImageView(projectTitle, newIndex + 1)
      UmamiEvents.projectNavigation('previous', projectTitle)
      setCurrentIndex(newIndex)
    } finally {
      perf.end('carousel-navigation-previous')
    }
  }, [allImages.length, currentIndex, projectTitle])

  const goToNext = useCallback(() => {
    perf.start('carousel-navigation-next')
    
    try {
      const newIndex = currentIndex === allImages.length - 1 ? 0 : currentIndex + 1
      UmamiEvents.projectImageView(projectTitle, newIndex + 1)
      UmamiEvents.projectNavigation('next', projectTitle)
      setCurrentIndex(newIndex)
    } finally {
      perf.end('carousel-navigation-next')
    }
  }, [allImages.length, currentIndex, projectTitle])

  // Keyboard navigation
  useKeyboardNavigation({
    onPrevious: goToPrevious,
    onNext: goToNext,
    onEscape: () => {
      UmamiEvents.backToGallery()
      router.back()
    },
    enabled: true
  })

  // Track initial project view
  useEffect(() => {
    UmamiEvents.projectImageView(projectTitle, 1)
  }, [projectTitle])

  // Preload adjacent images
  const preloadImages = useMemo(() => {
    const indices = [
      currentIndex === 0 ? allImages.length - 1 : currentIndex - 1,
      currentIndex === allImages.length - 1 ? 0 : currentIndex + 1
    ]
    return indices.map(i => allImages[i]).filter(Boolean)
  }, [currentIndex, allImages])

  const canScrollLeft = allImages.length > 1
  const canScrollRight = allImages.length > 1

  return (
    <>
      {/* Navigation Arrows */}
      {allImages.length > 1 && (
        <NavigationArrows
          canScrollLeft={canScrollLeft}
          canScrollRight={canScrollRight}
          onScrollLeft={goToPrevious}
          onScrollRight={goToNext}
          position="fixed"
          size="large"
          variant="project"
          showOnMobile={false}
        />
      )}
      
      {/* Image Container */}
      <div style={{ 
        display: 'flex',
        alignItems: 'center',
        gap: '60px',
        marginBottom: '20px',
        width: '100%',
        justifyContent: 'center'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          {/* Main Image */}
          <div style={{
            position: 'relative',
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
            display: 'inline-block',
            lineHeight: 0,
            backgroundColor: 'transparent'
          }}>
            {(currentImage?.asset || mainImage) && (
              <img
                src={getOptimizedImageUrl(currentImage?.asset || mainImage, { 
                  height: 800,
                  quality: 90, 
                  format: 'webp'
                })}
                alt={currentImage?.caption || projectTitle}
                referrerPolicy={SANITY_CDN_CONFIG.referrerPolicy}
                style={{
                  height: '70vh',
                  width: 'auto',
                  maxHeight: '700px',
                  minHeight: '300px',
                  display: 'block',
                  objectFit: 'contain'
                }}
                loading={currentIndex === 0 ? 'eager' : 'lazy'}
              />
            )}
          </div>

          {/* Image Counter */}
          {allImages.length > 1 && (
            <div style={{
              textAlign: 'right',
              fontSize: '14px',
              color: '#333',
              letterSpacing: '1px',
              marginTop: '8px',
              fontWeight: 400,
              width: '100%'
            }}>
              {String(currentIndex + 1).padStart(2, '0')} / {String(allImages.length).padStart(2, '0')}
            </div>
          )}
        </div>
      </div>

      {/* Preload adjacent images */}
      <div style={{ display: 'none' }} aria-hidden="true">
        {preloadImages.map((image, index) => (
          <img
            key={`preload-${index}`}
            src={getOptimizedImageUrl(image.asset, { 
              height: 600,
              quality: 80, 
              format: 'webp'
            })}
            alt=""
            loading="lazy"
          />
        ))}
      </div>
    </>
  )
}
