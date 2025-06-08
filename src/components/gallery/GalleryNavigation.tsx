// src/components/gallery/GalleryNavigation.tsx
'use client'

import { useCallback } from 'react'
import { useGalleryNavigation } from '@/hooks/gallery/useGalleryNavigation'
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation'
import { useHorizontalSwipe } from '@/hooks/useSwipeGesture'
import { UmamiEvents } from '@/utils/analytics'
import { perf } from '@/utils/performance'
import { TextileDesign } from '@/sanity/types'

interface GalleryNavigationProps {
  designs: TextileDesign[]
  currentIndex: number
  realTimeCurrentIndex: React.MutableRefObject<number>
  pathname: string
  isFirstMount: boolean
  isMobile: boolean
  scrollToImage: (direction: 'left' | 'right') => void
  scrollToIndex: (index: number) => void
}

export function useGalleryNavigationLogic({
  designs,
  realTimeCurrentIndex,
  pathname,
  isFirstMount,
  isMobile,
  scrollToImage,
  scrollToIndex,
}: GalleryNavigationProps) {
  // Navigation logic
  const navigation = useGalleryNavigation({
    designs,
    currentIndex: realTimeCurrentIndex.current,
    pathname,
    isFirstMount,
  })

  // Enhanced scroll function with analytics
  const handleScrollToImage = useCallback(
    (direction: 'left' | 'right') => {
      perf.start('gallery-scroll')

      try {
        const oldIndex = realTimeCurrentIndex.current
        const newIndex =
          direction === 'left'
            ? Math.max(0, oldIndex - 1)
            : Math.min(designs.length - 1, oldIndex + 1)

        UmamiEvents.galleryNavigation(`arrow-${direction}`, oldIndex, newIndex)
        scrollToImage(direction)
      } finally {
        perf.end('gallery-scroll')
      }
    },
    [designs.length, scrollToImage, realTimeCurrentIndex]
  )

  // Enhanced dot click with performance monitoring
  const handleDotClick = useCallback(
    (index: number) => {
      perf.start('gallery-dot-navigation')

      try {
        UmamiEvents.galleryNavigation(
          'dot-click',
          realTimeCurrentIndex.current,
          index
        )
        scrollToIndex(index)
      } finally {
        perf.end('gallery-dot-navigation')
      }
    },
    [scrollToIndex, realTimeCurrentIndex]
  )

  // SWIPE GESTURE SUPPORT
  const swipeHandlers = useHorizontalSwipe({
    onSwipeLeft: () => {
      console.log('🚀 Gallery swipe left - going to next image')
      UmamiEvents.galleryNavigation(
        'swipe-left',
        realTimeCurrentIndex.current,
        Math.min(realTimeCurrentIndex.current + 1, designs.length - 1)
      )
      scrollToImage('right')
    },
    onSwipeRight: () => {
      console.log('🚀 Gallery swipe right - going to previous image')
      UmamiEvents.galleryNavigation(
        'swipe-right',
        realTimeCurrentIndex.current,
        Math.max(realTimeCurrentIndex.current - 1, 0)
      )
      scrollToImage('left')
    },
    enabled: isMobile,
    minSwipeDistance: 50,
    maxSwipeTime: 400,
  })

  // Enhanced image click handler with analytics
  const handleImageClick = useCallback(
    (design: TextileDesign) => {
      perf.start('gallery-navigation')

      try {
        UmamiEvents.viewProject(design.title, design.year)
        navigation.handleImageClick(design)

        if (process.env.NODE_ENV === 'development') {
          console.log(`🖱️ Gallery navigation completed for: ${design.title}`)
        }
      } catch (error) {
        console.error('❌ Error in gallery navigation:', error)
      } finally {
        const duration = perf.end('gallery-navigation')

        if (process.env.NODE_ENV === 'development' && duration > 100) {
          console.warn(
            `⚠️ Slow gallery navigation detected: ${duration.toFixed(2)}ms`
          )
        }
      }
    },
    [navigation]
  )

  // Keyboard navigation
  useKeyboardNavigation({
    onPrevious: () => {
      UmamiEvents.galleryNavigation(
        'keyboard-left',
        realTimeCurrentIndex.current,
        Math.max(realTimeCurrentIndex.current - 1, 0)
      )
      scrollToImage('left')
    },
    onNext: () => {
      UmamiEvents.galleryNavigation(
        'keyboard-right',
        realTimeCurrentIndex.current,
        Math.min(realTimeCurrentIndex.current + 1, designs.length - 1)
      )
      scrollToImage('right')
    },
    onScrollUp: () => window.scrollBy({ top: -150, behavior: 'smooth' }),
    onScrollDown: () => window.scrollBy({ top: 150, behavior: 'smooth' }),
    onAbout: () => {
      UmamiEvents.navigateToAbout()
      navigation.handlePageNavigation('/about')
    },
    onWork: () => {
      UmamiEvents.navigateHome()
      navigation.handlePageNavigation('/')
    },
    onContact: () => {
      UmamiEvents.navigateToContact()
      navigation.handlePageNavigation('/contact')
    },
    onEnter: () => {
      const currentDesign = designs[realTimeCurrentIndex.current]
      if (currentDesign) {
        UmamiEvents.viewProject(currentDesign.title, currentDesign.year)
        navigation.handleImageClick(currentDesign)
      }
    },
    enabled: true,
  })

  return {
    handleScrollToImage,
    handleDotClick,
    handleImageClick,
    swipeHandlers: isMobile ? swipeHandlers : {},
  }
}
