'use client'

import { useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import OptimizedImage from './OptimizedImage'
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation'
import KeyboardScrollHandler from './KeyboardScrollHandler'

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
  
  // Create all images array with main image last
  const allImages = useMemo(() => [
    ...(images || []),
    { _key: 'main-image', asset: mainImage, caption: 'Main view' }
  ], [mainImage, images])

  const [currentIndex, setCurrentIndex] = useState(0)
  const currentImage = allImages[currentIndex]

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

  // Image navigation ONLY (arrows and h/l)
  useKeyboardNavigation({
    onPrevious: goToPrevious,
    onNext: goToNext,
    onEscape: () => router.back(),
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

  return (
    <>
      {/* Separate component for page scrolling */}
      <KeyboardScrollHandler />
      
      <div style={{ 
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 40px',
        marginTop: '80px'
      }}>
        {/* Image Container */}
        <div style={{ 
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          marginBottom: '20px',
          width: '100%',
          maxWidth: '900px'
        }}>
          {/* Left Arrow - only show if more than 1 image */}
          {allImages.length > 1 && (
            <button
              onClick={goToPrevious}
              style={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(0,0,0,0.1)',
                borderRadius: '50%',
                width: '48px',
                height: '48px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                color: '#333',
                flexShrink: 0,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 1)'
                e.currentTarget.style.transform = 'scale(1.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)'
                e.currentTarget.style.transform = 'scale(1)'
              }}
              aria-label="Previous image"
            >
              ←
            </button>
          )}

          {/* Main Image Container */}
          <div style={{ 
            flex: 1,
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Image */}
            <div style={{
              width: '100%',
              height: '50vh',
              position: 'relative',
              backgroundColor: '#f5f5f5',
              boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
              overflow: 'hidden'
            }}>
              {currentImage?.asset && (
                <OptimizedImage
                  src={currentImage.asset}
                  alt={currentImage.caption || projectTitle}
                  width={800}
                  height={600}
                  priority={true}
                  sizes="(max-width: 900px) 100vw, 900px"
                  quality={90}
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
                fontWeight: 400
              }}>
                {String(currentIndex + 1).padStart(2, '0')} / {String(allImages.length).padStart(2, '0')}
              </div>
            )}
          </div>

          {/* Right Arrow - only show if more than 1 image */}
          {allImages.length > 1 && (
            <button
              onClick={goToNext}
              style={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(0,0,0,0.1)',
                borderRadius: '50%',
                width: '48px',
                height: '48px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                color: '#333',
                flexShrink: 0,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 1)'
                e.currentTarget.style.transform = 'scale(1.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)'
                e.currentTarget.style.transform = 'scale(1)'
              }}
              aria-label="Next image"
            >
              →
            </button>
          )}
        </div>

        {/* Project Details */}
        <div style={{ 
          width: '100%',
          maxWidth: '800px',
          marginTop: '20px'
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
            <OptimizedImage
              key={`preload-${index}`}
              src={image.asset}
              alt=""
              width={800}
              height={600}
            />
          ))}
        </div>

        {/* Keyboard navigation hint */}
        {allImages.length > 1 && (
          <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            fontSize: '12px',
            color: '#999',
            backgroundColor: 'rgba(255,255,255,0.9)',
            padding: '8px 12px',
            borderRadius: '4px',
            backdropFilter: 'blur(8px)'
          }}>
            Use ← → keys to navigate images, ↑ ↓ j k to scroll page
          </div>
        )}
      </div>
    </>
  )
}
