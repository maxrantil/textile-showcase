// src/components/project/ImageCarousel/CarouselLayoutProps.tsx
import type { SanityImageSource } from '@sanity/image-url/lib/types/types'

export interface GalleryImage {
  _key: string
  asset: SanityImageSource
  caption?: string
}

export interface BaseCarouselProps {
  images?: GalleryImage[]
  mainImage: SanityImageSource
  projectTitle: string
  projectYear?: number
  projectDescription?: string
  projectMaterials?: string
  projectTechnique?: string
  projectDimensions?: string
}

export interface CarouselLayoutProps extends BaseCarouselProps {
  className?: string
  style?: React.CSSProperties
}

export interface CarouselDesktopLayoutProps extends CarouselLayoutProps {
  maxWidth?: string
  padding?: string
}

export interface CarouselMobileLayoutProps extends CarouselLayoutProps {
    // Mobile-specific props
    swipeThreshold?: number
    showDots?: boolean
    autoplay?: boolean
    autoplayInterval?: number
  }

export interface ImageCarouselProps extends BaseCarouselProps {
  // Main component props
  fallbackToMobile?: boolean
  customBreakpoint?: number
}
