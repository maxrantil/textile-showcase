'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getOptimizedImageUrl } from '@/sanity/lib'
import NavigationArrows from '../ui/NavigationArrows'
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation'
import KeyboardScrollHandler from '../KeyboardScrollHandler'
import { UmamiEvents } from '@/utils/analytics'
import { perf, logMemoryUsage } from '@/utils/performance'
import React from 'react'

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
  const [isMobile, setIsMobile] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  
  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  // Memory monitoring for development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      logMemoryUsage('ImageCarousel mounted')
      
      const interval = setInterval(() => {
        logMemoryUsage('ImageCarousel active')
      }, 10000) // Log every 10 seconds
      
      return () => {
        clearInterval(interval)
        logMemoryUsage('ImageCarousel unmounted')
      }
    }
  }, [])
  
  // Create array of all images for desktop carousel
  const allImages = useMemo(() => {
    const imageArray = []
    
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

  // Navigation functions for desktop carousel with performance monitoring
  const goToPrevious = useCallback(() => {
    perf.start('carousel-navigation-previous')
    
    try {
      const newIndex = currentIndex === 0 ? allImages.length - 1 : currentIndex - 1
      UmamiEvents.projectImageView(projectTitle, newIndex + 1)
      UmamiEvents.projectNavigation('previous', projectTitle)
      setCurrentIndex(newIndex)
    } finally {
      const duration = perf.end('carousel-navigation-previous')
      
      // Log slow navigations in development
      if (process.env.NODE_ENV === 'development' && duration > 100) {
        console.warn(`⚠️ Slow carousel navigation (previous) detected: ${duration.toFixed(2)}ms`)
      }
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
      const duration = perf.end('carousel-navigation-next')
      
      // Log slow navigations in development
      if (process.env.NODE_ENV === 'development' && duration > 100) {
        console.warn(`⚠️ Slow carousel navigation (next) detected: ${duration.toFixed(2)}ms`)
      }
    }
  }, [allImages.length, currentIndex, projectTitle])

  // Keyboard navigation
  useKeyboardNavigation({
    onPrevious: !isMobile ? goToPrevious : undefined,
    onNext: !isMobile ? goToNext : undefined,
    onEscape: () => {
      console.log('Escape pressed - going back')
      UmamiEvents.backToGallery()
      router.back()
    },
    onScrollUp: () => window.scrollBy({ top: -150, behavior: 'smooth' }),
    onScrollDown: () => window.scrollBy({ top: 150, behavior: 'smooth' }),
    enabled: true
  })

  // Track initial project view
  useEffect(() => {
    UmamiEvents.projectImageView(projectTitle, 1)
  }, [projectTitle])

  // Preload adjacent images for desktop with performance monitoring
  const preloadImages = useMemo(() => {
    if (isMobile) return []
    
    const indices = [
      currentIndex === 0 ? allImages.length - 1 : currentIndex - 1,
      currentIndex === allImages.length - 1 ? 0 : currentIndex + 1
    ]
    return indices.map(i => allImages[i]).filter(Boolean)
  }, [currentIndex, allImages, isMobile])

  // Determine if navigation arrows should be shown (desktop only)
  const canScrollLeft = allImages.length > 1
  const canScrollRight = allImages.length > 1

  if (isMobile) {
    // MOBILE: Vertical scroll layout
    return (
      <>
        <KeyboardScrollHandler />
        
        <div style={{ 
          minHeight: '100vh',
          background: '#fafafa',
          paddingTop: '80px',
          paddingBottom: '60px'
        }}>
          <div style={{
            maxWidth: '100%',
            margin: '0 auto',
            padding: '0 20px'
          }}>
            {/* Project Header - Mobile */}
            <div style={{ 
              textAlign: 'center',
              marginBottom: '40px'
            }}>
              <h1 style={{ 
                fontSize: 'clamp(24px, 6vw, 32px)', 
                fontWeight: 300, 
                margin: '0 0 12px 0',
                color: '#333',
                letterSpacing: '-0.5px'
              }}>
                {projectTitle}
              </h1>
              
              {projectYear && (
                <p style={{ 
                  fontSize: '16px', 
                  color: '#666', 
                  margin: '0 0 20px 0'
                }}>
                  {projectYear}
                </p>
              )}

              {projectDescription && (
                <p style={{ 
                  fontSize: '16px', 
                  color: '#333', 
                  lineHeight: '1.6',
                  margin: '0 0 24px 0'
                }}>
                  {projectDescription}
                </p>
              )}

              {/* Technical Details - Mobile */}
              {(projectMaterials || projectTechnique || projectDimensions) && (
                <div style={{ 
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  marginTop: '24px',
                  padding: '20px',
                  background: '#fff',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
                }}>
                  {projectMaterials && (
                    <div style={{ textAlign: 'center' }}>
                      <h3 style={{ 
                        fontSize: '12px', 
                        color: '#999', 
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        margin: '0 0 6px 0',
                        fontWeight: 500
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
                        margin: '0 0 6px 0',
                        fontWeight: 500
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
                        margin: '0 0 6px 0',
                        fontWeight: 500
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
              )}
            </div>

            {/* Images Stack - Mobile */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '30px',
              alignItems: 'center'
            }}>
              {allImages.map((image, index) => (
                <MobileImageBlock 
                  key={`${image._key}-${index}`}
                  image={image}
                  index={index}
                  isFirst={index === 0}
                  projectTitle={projectTitle}
                />
              ))}
            </div>
          </div>
        </div>
      </>
    )
  }

  // DESKTOP: Original horizontal carousel with arrows
  return (
    <>
      <KeyboardScrollHandler />
      
      {/* Navigation Arrows for desktop */}
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
        {/* Image Container - Desktop */}
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
            {/* Image */}
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

            {/* Image Counter - Desktop */}
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

        {/* Project Details - Desktop */}
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

          {/* Technical Details - Desktop */}
          {(projectMaterials || projectTechnique || projectDimensions) && (
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
          )}
        </div>

        {/* Preload adjacent images (desktop only) */}
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
      </div>
    </>
  )
}

// Mobile Image Block Component with performance monitoring
interface MobileImageBlockProps {
  image: any
  index: number
  isFirst: boolean
  projectTitle: string
}

const MobileImageBlock = React.memo(function MobileImageBlock({ 
  image, 
  index, 
  isFirst,
  projectTitle
}: MobileImageBlockProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  // Track mobile image view when it loads with performance monitoring
  useEffect(() => {
    if (imageLoaded) {
      perf.start(`mobile-image-track-${index}`)
      try {
        UmamiEvents.projectImageView(projectTitle, index + 1)
      } finally {
        perf.end(`mobile-image-track-${index}`)
      }
    }
  }, [imageLoaded, projectTitle, index])

  // Don't render if no asset
  if (!image?.asset) {
    return null
  }

  const imageUrl = getOptimizedImageUrl(image.asset, {
    width: 400,
    height: 600,
    quality: 80,
    format: 'webp'
  })

  return (
    <div style={{
      width: '100%',
      position: 'relative'
    }}>
      <div style={{
        position: 'relative',
        background: '#fff',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
      }}>
        <img
          src={imageUrl}
          alt={image.caption || `Project image ${index + 1}`}
          style={{
            width: '100%',
            height: 'auto',
            display: 'block',
            objectFit: 'contain',
            maxHeight: '70vh',
            minHeight: '200px',
            opacity: imageLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease'
          }}
          loading={isFirst ? 'eager' : 'lazy'}
          onLoad={() => {
            console.log(`✅ Image ${index + 1} loaded successfully`)
            setImageLoaded(true)
          }}
          onError={(e) => {
            console.error(`❌ Image ${index + 1} failed to load:`, e)
            setImageError(true)
          }}
        />

        {/* Loading overlay */}
        {!imageLoaded && !imageError && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: '#f5f5f5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#999',
            fontSize: '14px',
            minHeight: '200px'
          }}>
            Loading image {index + 1}...
          </div>
        )}

        {/* Error overlay */}
        {imageError && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: '#f5f5f5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#999',
            fontSize: '14px',
            flexDirection: 'column',
            gap: '8px',
            minHeight: '200px'
          }}>
            <div>❌ Failed to load image {index + 1}</div>
            <div style={{ fontSize: '12px' }}>
              Key: {image._key}
            </div>
            <div style={{ fontSize: '10px', wordBreak: 'break-all', maxWidth: '80%' }}>
              URL: {imageUrl.substring(0, 50)}...
            </div>
          </div>
        )}
      </div>

      {/* Image caption */}
      {image.caption && !image.isMainImage && (
        <p style={{
          textAlign: 'center',
          fontSize: '14px',
          color: '#666',
          margin: '12px 0 0 0',
          fontStyle: 'italic'
        }}>
          {image.caption}
        </p>
      )}
    </div>
  )
})
