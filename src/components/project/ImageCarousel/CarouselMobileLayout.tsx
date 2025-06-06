// src/components/project/ImageCarousel/CarouselMobileLayout.tsx
'use client'

import { memo } from 'react'
import { ProjectDetails } from './ProjectDetails'
import { MobileImageStack } from './MobileImageStack'
import KeyboardScrollHandler from '../../KeyboardScrollHandler'
import type { SanityImageSource } from '@sanity/image-url/lib/types/types'

interface GalleryImage {
  _key: string
  asset: SanityImageSource
  caption?: string
}

interface CarouselMobileLayoutProps {
  images?: GalleryImage[]
  mainImage: SanityImageSource
  projectTitle: string
  projectYear?: number
  projectDescription?: string
  projectMaterials?: string
  projectTechnique?: string
  projectDimensions?: string
  className?: string
  style?: React.CSSProperties
}

const CarouselMobileLayout = memo(function CarouselMobileLayout({
  images,
  mainImage,
  projectTitle,
  projectYear,
  projectDescription,
  projectMaterials,
  projectTechnique,
  projectDimensions,
  className = '',
  style
}: CarouselMobileLayoutProps) {
  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    background: '#fafafa',
    paddingTop: '80px',
    paddingBottom: '60px',
    ...style
  }

  const contentStyle: React.CSSProperties = {
    maxWidth: '100%',
    margin: '0 auto',
    padding: '0 20px'
  }

  return (
    <>
      <KeyboardScrollHandler />
      
      <div className={className} style={containerStyle}>
        <div style={contentStyle}>
          {/* Project Header */}
          <ProjectDetails 
            projectTitle={projectTitle}
            projectYear={projectYear}
            projectDescription={projectDescription}
            projectMaterials={projectMaterials}
            projectTechnique={projectTechnique}
            projectDimensions={projectDimensions}
            isMobile={true}
          />
          
          {/* Images Stack */}
          <MobileImageStack 
            images={images}
            mainImage={mainImage}
            projectTitle={projectTitle}
          />
        </div>
      </div>
    </>
  )
})

export default CarouselMobileLayout
