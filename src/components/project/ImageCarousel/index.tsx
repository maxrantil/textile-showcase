// src/components/project/ImageCarousel/index.tsx (Updated with error boundary)
'use client'

import { memo } from 'react'
import CarouselLayoutSelector from './CarouselLayoutSelector'
import { CarouselErrorBoundary } from './CarouselErrorBoundary'
import { ImageCarouselProps } from './CarouselLayoutProps'

const ImageCarousel = memo(function ImageCarousel(props: ImageCarouselProps) {
  const {
    images,
    mainImage,
    projectTitle,
    projectYear,
    projectDescription,
    projectMaterials,
    projectTechnique,
    projectDimensions,
    fallbackToMobile = false,
    customBreakpoint = 768,
  } = props

  // Validate required props
  if (!mainImage || !projectTitle) {
    console.warn('ImageCarousel: mainImage and projectTitle are required props')
    return (
      <div
        style={{
          minHeight: '50vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#fafafa',
          color: '#666',
          textAlign: 'center',
        }}
      >
        <div>
          <h2>Unable to load project</h2>
          <p>Missing required project information</p>
        </div>
      </div>
    )
  }

  return (
    <CarouselErrorBoundary
      onError={(error, errorInfo) => {
        // Log to analytics or error tracking service
        if (process.env.NODE_ENV === 'development') {
          console.error('Carousel Error:', { error, errorInfo, props })
        }
      }}
    >
      <CarouselLayoutSelector
        images={images}
        mainImage={mainImage}
        projectTitle={projectTitle}
        projectYear={projectYear}
        projectDescription={projectDescription}
        projectMaterials={projectMaterials}
        projectTechnique={projectTechnique}
        projectDimensions={projectDimensions}
        customBreakpoint={customBreakpoint}
        fallbackToMobile={fallbackToMobile}
        enableLazyLoading={true}
      />
    </CarouselErrorBoundary>
  )
})

export default ImageCarousel

// Re-export everything for easy access
export * from './CarouselLayoutProps'
export { default as CarouselMobileLayout } from './CarouselMobileLayout'
export { default as CarouselDesktopLayout } from './CarouselDesktopLayout'
export { default as CarouselLayoutSelector } from './CarouselLayoutSelector'
export {
  useCarouselLayoutDetector,
  useCarouselBreakpoint,
} from './CarouselLayoutDetector'
export { CarouselErrorBoundary } from './CarouselErrorBoundary'
