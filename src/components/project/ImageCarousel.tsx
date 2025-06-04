'use client'

import { useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { getImageDimensions, getOptimizedImageUrl } from '@/sanity/lib'
import NavigationArrows from '../ui/NavigationArrows'
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation'
import KeyboardScrollHandler from '../KeyboardScrollHandler'

interface GalleryImage {
  _key: string
  asset: any
  caption?: string
}

interface ImageCarouselProps {
  images?: GalleryImage[]
  mainImage: any
  projectTitle: string
  projectYear?: number
  projectDescription?: string
  projectMaterials?: string
  projectTechnique?: string
  projectDimensions?: string
}

export default function ImageCarousel({ 
  images = [],
  mainImage, 
  projectTitle,
  projectYear,
  projectDescription,
  projectMaterials,
  projectTechnique,
  projectDimensions
}: ImageCarouselProps) {
  const router = useRouter()
  
  // FIXED: Only use gallery images, don't add main image at all
  const allImages = useMemo(() => {
    // Just return the gallery images as they are, no main image
    return images || []
  }, [images])

  const [currentIndex, setCurrentIndex] = useState(0)
  const currentImage = allImages[currentIndex]

  // Calculate dimensions for current image
  const imageDimensions = getImageDimensions(currentImage)
  const aspectRatio = imageDimensions?.aspectRatio || 4/3
  
  // CONSISTENT HEIGHT for all images
  const fixedHeight = 70 // vh - same height for ALL images

  // Navigation functions
  const goToPrevious = useCallback(() => {
    setCurrentIndex(prev => prev === 0 ? allImages.length - 1 : prev - 1)
  }, [allImages.length])

  const goToNext = useCallback(() => {
    setCurrentIndex(prev => prev === allImages.length - 1 ? 0 : prev + 1)
  }, [allImages.length])

  const goToIndex = useCallback((index: number) => {
    if (index >= 0 && index < allImages.length) {
      setCurrentIndex(index)
    }
  }, [allImages.length])

  // Image navigation with proper escape key handling
  useKeyboardNavigation({
    onPrevious: goToPrevious,
    onNext: goToNext,
    onEscape: () => {
      console.log('Escape pressed - going back')
      router.back()
    },
    onEnter: () => {
      // Optional: do something when enter is pressed on project page
      console.log('Enter pressed on project page')
    },
    enabled: true
  })

  // Preload adjacent images for better performance
  const preloadImages = useMemo(() => {
    const indices = [
      currentIndex === 0 ? allImages.length - 1 : currentIndex - 1,
      currentIndex === allImages.length - 1 ? 0 : currentIndex + 1
    ]
    return indices.map(i => allImages[i]).filter(Boolean)
  }, [currentIndex, allImages])

  // Determine if navigation arrows should be shown
  const canScrollLeft = allImages.length > 1
  const canScrollRight = allImages.length > 1

  return (
    <>
      {/* Separate component for page scrolling */}
      <KeyboardScrollHandler />
      
      <div style={{ 
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '0 40px',
        marginTop: '80px',
        position: 'relative'
      }}>
        {/* Image Container with Navigation Arrows */}
        <div style={{ 
          display: 'flex',
          alignItems: 'center',
          gap: '60px',
          marginBottom: '20px',
          width: '100%',
          justifyContent: 'center'
        }}>
          {/* Navigation Arrows - only show if more than 1 gallery image */}
          {allImages.length > 1 && (
            <div style={{ flexShrink: 0 }}>
              <NavigationArrows
                canScrollLeft={canScrollLeft}
                canScrollRight={false} // Only show left arrow here
                onScrollLeft={goToPrevious}
                onScrollRight={goToNext}
                position="static"
                size="large"
                variant="project"
              />
            </div>
          )}

          {/* Image - display current gallery image or fallback to main image */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            {/* Container that wraps tightly around the image */}
            <div style={{
              position: 'relative',
              boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
              display: 'inline-block',
              lineHeight: 0,
              backgroundColor: 'transparent'
            }}>
              {/* Show current gallery image if available, otherwise show main image */}
              {(currentImage?.asset || mainImage) && (
                <img
                  src={getOptimizedImageUrl(currentImage?.asset || mainImage, { 
                    height: 800, // Only height constraint - width will adjust to preserve aspect ratio
                    quality: 90, 
                    format: 'webp'
                  })}
                  alt={currentImage?.caption || projectTitle}
                  style={{
                    height: `${fixedHeight}vh`,
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

            {/* Image Counter - Only show if there are gallery images */}
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

          {/* Right Navigation Arrow - only show if more than 1 gallery image */}
          {allImages.length > 1 && (
            <div style={{ flexShrink: 0 }}>
              <NavigationArrows
                canScrollLeft={false} // Only show right arrow here
                canScrollRight={canScrollRight}
                onScrollLeft={goToPrevious}
                onScrollRight={goToNext}
                position="static"
                size="large"
                variant="project"
              />
            </div>
          )}
        </div>

        {/* Project Details */}
        <div style={{ 
          width: '100%',
          maxWidth: '800px',
          marginTop: '40px'
        }}>
          <h1 style={{ 
            fontSize: '32px', 
            fontWeight: 300, 
            margin: '0 0 8px 0',
            color: '#333',
            textAlign: 'center',
            letterSpacing: '-0.5px'
          }}>
            {projectTitle}
          </h1>
          
          {projectYear && (
            <p style={{ 
              fontSize: '16px', 
              color: '#666', 
              margin: '0 0 20px 0',
              textAlign: 'center'
            }}>
              {projectYear}
            </p>
          )}

          {projectDescription && (
            <p style={{ 
              fontSize: '16px', 
              color: '#333', 
              lineHeight: '1.6',
              margin: '0 0 24px 0',
              textAlign: 'center'
            }}>
              {projectDescription}
            </p>
          )}

          {/* Technical Details - responsive grid */}
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '24px',
            marginTop: '24px'
          }}>
            {projectMaterials && (
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ 
                  fontSize: '12px', 
                  color: '#999', 
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  margin: '0 0 8px 0',
                  fontWeight: 400
                }}>
                  Materials
                </h3>
                <p style={{ 
                  fontSize: '14px', 
                  margin: 0, 
                  color: '#333',
                  lineHeight: '1.4'
                }}>
                  {projectMaterials}
                </p>
              </div>
            )}

            {projectTechnique && (
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ 
                  fontSize: '12px', 
                  color: '#999', 
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  margin: '0 0 8px 0',
                  fontWeight: 400
                }}>
                  Technique
                </h3>
                <p style={{ 
                  fontSize: '14px', 
                  margin: 0, 
                  color: '#333',
                  lineHeight: '1.4'
                }}>
                  {projectTechnique}
                </p>
              </div>
            )}
            
            {projectDimensions && (
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ 
                  fontSize: '12px', 
                  color: '#999', 
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  margin: '0 0 8px 0',
                  fontWeight: 400
                }}>
                  Dimensions
                </h3>
                <p style={{ 
                  fontSize: '14px', 
                  margin: 0, 
                  color: '#333',
                  lineHeight: '1.4'
                }}>
                  {projectDimensions}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Preload adjacent images (hidden) */}
        <div style={{ display: 'none' }} aria-hidden="true">
          {preloadImages.map((image, index) => (
            <img
              key={`preload-${index}`}
              src={getOptimizedImageUrl(image.asset, { 
                height: 600, // Only height constraint
                quality: 80, 
                format: 'webp'
              })}
              alt=""
              loading="lazy"
            />
          ))}
        </div>
      </div>
    </>
  )
}
