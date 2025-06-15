// src/components/desktop/Project/DesktopImageCarousel.tsx
'use client'

import { OptimizedImage } from '@/components/ui/OptimizedImage'
import { useKeyboardNavigation } from '@/hooks/desktop/useKeyboardNavigation'
import type { SanityImageSource } from '@sanity/image-url/lib/types/types'

interface DesktopImageCarouselProps {
  images: SanityImageSource[]
  currentIndex: number
  onIndexChange: (index: number) => void
  projectTitle: string
}

export function DesktopImageCarousel({
  images,
  currentIndex,
  onIndexChange,
  projectTitle,
}: DesktopImageCarouselProps) {
  useKeyboardNavigation({
    onPrevious: () => onIndexChange(Math.max(0, currentIndex - 1)),
    onNext: () => onIndexChange(Math.min(images.length - 1, currentIndex + 1)),
    enabled: true,
  })

  return (
    <div className="desktop-image-carousel">
      <div className="desktop-carousel-main">
        <OptimizedImage
          src={images[currentIndex]}
          alt={`${projectTitle} - Image ${currentIndex + 1}`}
          width={1200}
          height={800}
          priority
        />
      </div>

      {images.length > 1 && (
        <div className="desktop-carousel-counter">
          {String(currentIndex + 1).padStart(2, '0')} /{' '}
          {String(images.length).padStart(2, '0')}
        </div>
      )}
    </div>
  )
}
