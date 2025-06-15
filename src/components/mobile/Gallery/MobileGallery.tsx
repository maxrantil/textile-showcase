'use client'
import { useState, useEffect, useCallback } from 'react'
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

  useEffect(() => {
    UmamiEvents.trackEvent('mobile-gallery-view', {
      totalItems: designs.length,
    })
    console.log('📱 MobileGallery mounted:', { designsCount: designs.length })
  }, [designs.length])

  const handleSwipeLeft = useCallback(() => {
    console.log(
      '🔥 handleSwipeLeft called, currentIndex:',
      currentIndex,
      'max:',
      designs.length - 1
    )
    if (currentIndex < designs.length - 1) {
      const newIndex = currentIndex + 1
      console.log('✅ Moving to index:', newIndex)
      UmamiEvents.galleryNavigation('swipe-left', currentIndex, newIndex)
      setCurrentIndex(newIndex)
    } else {
      console.log('❌ Already at last item')
    }
  }, [currentIndex, designs.length])

  const handleSwipeRight = useCallback(() => {
    console.log('🔥 handleSwipeRight called, currentIndex:', currentIndex)
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1
      console.log('✅ Moving to index:', newIndex)
      UmamiEvents.galleryNavigation('swipe-right', currentIndex, newIndex)
      setCurrentIndex(newIndex)
    } else {
      console.log('❌ Already at first item')
    }
  }, [currentIndex])

  const { swipeHandlers } = useHorizontalSwipe({
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight,
    enabled: true,
    minSwipeDistance: 50, // Lower for easier swiping
    maxSwipeTime: 600,
  })

  const handleDotClick = (index: number) => {
    UmamiEvents.galleryNavigation('dot-click', currentIndex, index)
    setCurrentIndex(index)
  }

  console.log('🎪 MobileGallery render:', {
    currentIndex,
    totalDesigns: designs.length,
  })

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
