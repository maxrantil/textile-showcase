'use client'

import { useState, useEffect } from 'react'
import { useHorizontalSwipe } from '@/hooks/mobile/useSwipeGesture'
import { MobileGalleryItem } from './MobileGalleryItem'
import { MobileGalleryIndicators } from './MobileGalleryIndicators'
import { TextileDesign } from '@/sanity/types'
import { UmamiEvents } from '@/utils/analytics'

interface MobileGalleryProps {
  designs: TextileDesign[]
}

export function MobileGallery({ designs }: MobileGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  // Track gallery view
  useEffect(() => {
    UmamiEvents.trackEvent('mobile-gallery-view', {
      totalItems: designs.length,
    })
  }, [designs.length])

  const handleSwipeLeft = () => {
    if (currentIndex < designs.length - 1) {
      const newIndex = currentIndex + 1
      UmamiEvents.galleryNavigation('swipe-left', currentIndex, newIndex)
      setCurrentIndex(newIndex)
    }
  }

  const handleSwipeRight = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1
      UmamiEvents.galleryNavigation('swipe-right', currentIndex, newIndex)
      setCurrentIndex(newIndex)
    }
  }

  const swipeHandlers = useHorizontalSwipe({
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight,
  })

  const handleDotClick = (index: number) => {
    UmamiEvents.galleryNavigation('dot-click', currentIndex, index)
    setCurrentIndex(index)
  }

  return (
    <div className="mobile-gallery" {...swipeHandlers}>
      <div
        className="mobile-gallery-track"
        style={{
          transform: `translateX(-${currentIndex * 100}%)`,
        }}
      >
        {designs.map((design, index) => (
          <MobileGalleryItem
            key={design._id}
            design={design}
            isActive={index === currentIndex}
          />
        ))}
      </div>

      <MobileGalleryIndicators
        total={designs.length}
        current={currentIndex}
        onDotClick={handleDotClick}
      />
    </div>
  )
}
