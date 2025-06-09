// src/components/project/ImageCarousel/CarouselDesktopLayout.tsx
'use client'

import { memo } from 'react'
import { DesktopCarousel } from './DesktopCarousel'
import { ProjectDetails } from './ProjectDetails'
import KeyboardScrollHandler from '../../KeyboardScrollHandler'
import type { SanityImageSource } from '@sanity/image-url/lib/types/types'

interface GalleryImage {
  _key: string
  asset: SanityImageSource
  caption?: string
}

interface CarouselDesktopLayoutProps {
  images?: GalleryImage[]
  mainImage: SanityImageSource
  projectTitle: string
  projectYear?: number
  projectDescription?: string
  projectMaterials?: string
  projectTechnique?: string
  projectDimensions?: string
  projectCredits?: string
  projectExhibitions?: string[]
  projectAvailableForPurchase?: string
  projectProcessNotes?: string
  projectCareInstructions?: string
  className?: string
  style?: React.CSSProperties
  maxWidth?: string
  padding?: string
}

const CarouselDesktopLayout = memo(function CarouselDesktopLayout({
  images,
  mainImage,
  projectTitle,
  projectYear,
  projectDescription,
  projectMaterials,
  projectTechnique,
  projectDimensions,
  projectCredits,
  projectExhibitions,
  projectAvailableForPurchase,
  projectProcessNotes,
  projectCareInstructions,
  className = '',
  style,
  maxWidth = '1400px',
  padding = '0 40px',
}: CarouselDesktopLayoutProps) {
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    maxWidth,
    margin: '0 auto',
    padding,
    marginTop: '80px',
    position: 'relative',
    ...style,
  }

  return (
    <>
      <KeyboardScrollHandler />

      <div className={className} style={containerStyle}>
        {/* Desktop Carousel */}
        <DesktopCarousel
          images={images}
          mainImage={mainImage}
          projectTitle={projectTitle}
        />

        {/* Project Details */}
        <ProjectDetails
          projectTitle={projectTitle}
          projectYear={projectYear}
          projectDescription={projectDescription}
          projectMaterials={projectMaterials}
          projectTechnique={projectTechnique}
          projectDimensions={projectDimensions}
          projectCredits={projectCredits}
          projectExhibitions={projectExhibitions}
          projectAvailableForPurchase={projectAvailableForPurchase}
          projectProcessNotes={projectProcessNotes}
          projectCareInstructions={projectCareInstructions}
          isMobile={false}
        />
      </div>
    </>
  )
})

export default CarouselDesktopLayout
