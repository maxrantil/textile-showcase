'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { urlFor } from '@/lib/sanity'
import ImageCounter from './ImageCounter'

interface GalleryImage {
  _key: string
  asset: any
  caption?: string
}

interface ImageCarouselProps {
  images: GalleryImage[]
  mainImage: any
  projectTitle: string
  projectYear?: number
  projectDescription?: string
  projectMaterials?: string
  projectTechnique?: string
  projectDimensions?: string
}

export default function ImageCarousel({ 
  images, 
  mainImage, 
  projectTitle,
  projectYear,
  projectDescription,
  projectMaterials,
  projectTechnique,
  projectDimensions
}: ImageCarouselProps) {
  const allImages = [
    ...images,
    { _key: 'main-image', asset: mainImage, caption: 'Main view' }
  ]

  const [currentIndex, setCurrentIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const isScrollingRef = useRef(false)
  const targetScrollRef = useRef(0)

  const goToPrevious = () => {
    setCurrentIndex(prev => prev === 0 ? allImages.length - 1 : prev - 1)
  }

  const goToNext = () => {
    setCurrentIndex(prev => prev === allImages.length - 1 ? 0 : prev + 1)
  }

  // Scroll functionality
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let currentScroll = currentIndex
    targetScrollRef.current = currentIndex

    const animate = () => {
      currentScroll += (targetScrollRef.current - currentScroll) * 0.1
      
      if (Math.abs(targetScrollRef.current - currentScroll) < 0.01) {
        currentScroll = targetScrollRef.current
        isScrollingRef.current = false
      }

      const roundedIndex = Math.round(currentScroll)
      if (roundedIndex !== currentIndex && !isScrollingRef.current) {
        setCurrentIndex(roundedIndex)
      }

      if (isScrollingRef.current) {
        requestAnimationFrame(animate)
      }
    }

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      
      if (isScrollingRef.current) return
      
      const delta = e.deltaY
      let newTarget = targetScrollRef.current
      
      if (delta > 0) {
        newTarget = newTarget + 1
      } else {
        newTarget = newTarget - 1
      }
      
      if (newTarget >= allImages.length) newTarget = 0
      if (newTarget < 0) newTarget = allImages.length - 1
      
      targetScrollRef.current = newTarget
      isScrollingRef.current = true
      animate()
    }

    container.addEventListener('wheel', handleWheel, { passive: false })
    return () => container.removeEventListener('wheel', handleWheel)
  }, [allImages.length, currentIndex])

  const currentImage = allImages[currentIndex]

  return (
    <div ref={containerRef} style={{ marginBottom: '40px' }}>
      {/* Image and Arrows Container */}
      <div style={{ 
        display: 'flex',
        alignItems: 'center',
        gap: '30px',
        marginBottom: '20px'
      }}>
        {/* Left Arrow */}
        {allImages.length > 1 && (
          <button
            onClick={goToPrevious}
            style={{
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              border: 'none',
              borderRadius: '50%',
              width: '50px', // Slightly smaller
              height: '50px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.3s ease',
              fontSize: '18px',
              color: '#333',
              flexShrink: 0
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 1)'
              e.currentTarget.style.transform = 'scale(1.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)'
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            ←
          </button>
        )}

        {/* Image Container */}
        <div style={{ position: 'relative', flex: 1 }}>
          <div style={{
            width: '100%',
            height: '65vh', // Reduced height to fit screen better
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)'
          }}>
            <Image
              src={urlFor(currentImage.asset).width(1400).height(1000).url()}
              alt={currentImage.caption || `${projectTitle} view ${currentIndex + 1}`}
              width={1400}
              height={1000}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
          </div>

          {/* Counter in bottom right corner of image */}
          <div style={{
            position: 'absolute',
            bottom: '16px',
            right: '16px',
            background: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '4px',
            fontSize: '12px',
            letterSpacing: '1px'
          }}>
            {String(currentIndex + 1).padStart(2, '0')} / {String(allImages.length).padStart(2, '0')}
          </div>
        </div>

        {/* Right Arrow */}
        {allImages.length > 1 && (
          <button
            onClick={goToNext}
            style={{
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              border: 'none',
              borderRadius: '50%',
              width: '50px',
              height: '50px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.3s ease',
              fontSize: '18px',
              color: '#333',
              flexShrink: 0
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 1)'
              e.currentTarget.style.transform = 'scale(1.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)'
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            →
          </button>
        )}
      </div>

      {/* Project Details Below Image - aligned with image width */}
      <div style={{ 
        marginLeft: '80px', // Account for left arrow + gap
        marginRight: '80px' // Account for right arrow + gap
      }}>
        {/* Title and Year */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ 
            fontSize: '36px', 
            fontWeight: 300, 
            margin: '0 0 8px 0',
            color: '#333',
            letterSpacing: '-0.5px'
          }}>
            {projectTitle}
          </h1>
          {projectYear && (
            <p style={{ 
              fontSize: '18px', 
              color: '#666', 
              margin: 0 
            }}>
              {projectYear}
            </p>
          )}
        </div>

        {/* Description */}
        {projectDescription && (
          <div style={{ marginBottom: '24px' }}>
            <p style={{ 
              fontSize: '16px', 
              color: '#333', 
              lineHeight: '1.6',
              margin: 0
            }}>
              {projectDescription}
            </p>
          </div>
        )}

        {/* Technical Details in a row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '24px'
        }}>
          {projectMaterials && (
            <div>
              <h3 style={{ 
                fontSize: '11px', 
                color: '#999', 
                textTransform: 'uppercase',
                letterSpacing: '2px',
                marginBottom: '8px'
              }}>
                Materials
              </h3>
              <p style={{ 
                fontSize: '14px', 
                margin: 0, 
                color: '#333' 
              }}>
                {projectMaterials}
              </p>
            </div>
          )}

          {projectTechnique && (
            <div>
              <h3 style={{ 
                fontSize: '11px', 
                color: '#999', 
                textTransform: 'uppercase',
                letterSpacing: '2px',
                marginBottom: '8px'
              }}>
                Technique
              </h3>
              <p style={{ 
                fontSize: '14px', 
                margin: 0, 
                color: '#333' 
              }}>
                {projectTechnique}
              </p>
            </div>
          )}
          
          {projectDimensions && (
            <div>
              <h3 style={{ 
                fontSize: '11px', 
                color: '#999', 
                textTransform: 'uppercase',
                letterSpacing: '2px',
                marginBottom: '8px'
              }}>
                Dimensions
              </h3>
              <p style={{ 
                fontSize: '14px', 
                margin: 0, 
                color: '#333' 
              }}>
                {projectDimensions}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
