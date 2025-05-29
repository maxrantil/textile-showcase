'use client'

import { useState } from 'react'
import Image from 'next/image'
import { urlFor } from '@/lib/sanity'

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
  // Create all images array with main image first
  const allImages = [
    { _key: 'main-image', asset: mainImage, caption: 'Main view' },
    ...(images || [])
  ]

  const [currentIndex, setCurrentIndex] = useState(0)
  const currentImage = allImages[currentIndex]

  return (
    <div style={{ 
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '0 40px'
    }}>
      {/* Image Container - centered and sized for laptop screens */}
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
            onClick={() => setCurrentIndex(prev => prev === 0 ? allImages.length - 1 : prev - 1)}
            style={{
              background: 'white',
              border: '1px solid #ddd',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              color: '#333',
              flexShrink: 0
            }}
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
          {/* Image - smaller size for laptop screens */}
          <div style={{
            width: '100%',
            height: '50vh', // Reduced from 70vh to fit laptop screens
            position: 'relative',
            backgroundColor: '#f5f5f5',
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)'
          }}>
            {currentImage?.asset && (
              <Image
                src={urlFor(currentImage.asset).width(800).height(600).url()}
                alt={currentImage.caption || projectTitle}
                fill
                style={{ objectFit: 'cover' }}
                priority
              />
            )}
          </div>
          
          {/* Counter moved below image, same style as text */}
          {allImages.length > 1 && (
            <div style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'flex-end',
              marginTop: '10px'
            }}>
              <div style={{
                fontSize: '12px',
                color: '#999', // Same gray color as other text labels
                letterSpacing: '1px',
                textTransform: 'uppercase'
              }}>
                {currentIndex + 1} / {allImages.length}
              </div>
            </div>
          )}
        </div>

        {/* Right Arrow - only show if more than 1 image */}
        {allImages.length > 1 && (
          <button
            onClick={() => setCurrentIndex(prev => prev === allImages.length - 1 ? 0 : prev + 1)}
            style={{
              background: 'white',
              border: '1px solid #ddd',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              color: '#333',
              flexShrink: 0
            }}
          >
            →
          </button>
        )}
      </div>

      {/* Project Details - moved up to be visible on laptop screens */}
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
          textAlign: 'center'
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
            margin: '0 0 20px 0',
            textAlign: 'center'
          }}>
            {projectDescription}
          </p>
        )}

        {/* Technical Details - centered layout */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center',
          gap: '40px', 
          flexWrap: 'wrap'
        }}>
          {projectMaterials && (
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ 
                fontSize: '12px', 
                color: '#999', 
                textTransform: 'uppercase',
                letterSpacing: '1px',
                margin: '0 0 5px 0'
              }}>
                Materials
              </h3>
              <p style={{ fontSize: '14px', margin: 0, color: '#333' }}>
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
                margin: '0 0 5px 0'
              }}>
                Technique
              </h3>
              <p style={{ fontSize: '14px', margin: 0, color: '#333' }}>
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
                margin: '0 0 5px 0'
              }}>
                Dimensions
              </h3>
              <p style={{ fontSize: '14px', margin: 0, color: '#333' }}>
                {projectDimensions}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
