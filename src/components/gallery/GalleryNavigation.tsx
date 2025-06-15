// src/components/gallery/GalleryNavigation.tsx - Add more debugging
'use client'

import { useCallback } from 'react'
import { useGalleryNavigation } from '@/hooks/gallery/useGalleryNavigation'
import { useKeyboardNavigation } from '@/hooks/desktop/useKeyboardNavigation'
import { useHorizontalSwipe } from '@/hooks/mobile/useSwipeGesture'
import { scrollManager } from '@/lib/scrollManager'
import { UmamiEvents } from '@/utils/analytics'
import { perf } from '@/utils/performance'
import { TextileDesign } from '@/sanity/types'

interface GalleryNavigationProps {
  designs: TextileDesign[]
  currentIndex: number
  realTimeCurrentIndex: number
  setRealTimeCurrentIndex: (index: number) => void
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
    currentIndex: realTimeCurrentIndex,
    pathname,
    isFirstMount,
  })

  // Enhanced scroll function
  const handleScrollToImage = useCallback(
    (direction: 'left' | 'right') => {
      perf.start('gallery-scroll')

      try {
        const oldIndex = realTimeCurrentIndex
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

  // Enhanced dot click
  const handleDotClick = useCallback(
    (index: number) => {
      perf.start('gallery-dot-navigation')

      try {
        UmamiEvents.galleryNavigation('dot-click', realTimeCurrentIndex, index)
        scrollToIndex(index)
      } finally {
        perf.end('gallery-dot-navigation')
      }
    },
    [scrollToIndex, realTimeCurrentIndex]
  )

  // Enhanced image click with immediate save
  const handleImageClick = useCallback(
    (design: TextileDesign) => {
      perf.start('gallery-navigation')

      try {
        // Save current position immediately before navigating
        scrollManager.saveImmediate(realTimeCurrentIndex, pathname)

        UmamiEvents.viewProject(design.title, design.year)
        scrollManager.triggerNavigationStart()
        navigation.handleImageClick(design)

        if (process.env.NODE_ENV === 'development') {
          console.log(
            `🖱️ Gallery navigation to: ${design.title} from index ${realTimeCurrentIndex}`
          )
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
    [navigation, pathname, realTimeCurrentIndex]
  )

  // Enhanced Enter/Space handler using state
  const handleEnterPress = useCallback(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🎯 handleEnterPress called!')
      console.log('🎯 realTimeCurrentIndex:', realTimeCurrentIndex)
      console.log('🎯 designs.length:', designs.length)
      console.log('🎯 designs:', designs)
    }

    const currentDesign = designs[realTimeCurrentIndex]
    if (currentDesign) {
      if (process.env.NODE_ENV === 'development') {
        console.log(
          `⌨️ SUCCESS: Opening project ${currentDesign.title} at index ${realTimeCurrentIndex}`
        )
      }
      UmamiEvents.galleryNavigation(
        'keyboard-enter',
        realTimeCurrentIndex,
        realTimeCurrentIndex
      )
      handleImageClick(currentDesign)
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          '⚠️ ERROR: No current design found for Enter/Space handler'
        )
        console.log('🎯 Current index:', realTimeCurrentIndex)
        console.log('🎯 Designs length:', designs.length)
        console.log('🎯 Design at index:', designs[realTimeCurrentIndex])
      }
    }
  }, [designs, realTimeCurrentIndex, handleImageClick])

  // Debug: Log when handleEnterPress changes
  if (process.env.NODE_ENV === 'development') {
    console.log('🎯 handleEnterPress function created/updated')
  }

  // SWIPE GESTURE SUPPORT
  const swipeHandlers = useHorizontalSwipe({
    onSwipeLeft: () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('🚀 Gallery swipe left - going to next image')
      }
      UmamiEvents.galleryNavigation(
        'swipe-left',
        realTimeCurrentIndex,
        Math.min(realTimeCurrentIndex + 1, designs.length - 1)
      )
      scrollToImage('right')
    },
    onSwipeRight: () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('🚀 Gallery swipe right - going to previous image')
      }
      UmamiEvents.galleryNavigation(
        'swipe-right',
        realTimeCurrentIndex,
        Math.max(realTimeCurrentIndex - 1, 0)
      )
      scrollToImage('left')
    },
    enabled: isMobile,
    minSwipeDistance: 50,
    maxSwipeTime: 400,
  })

  // Enhanced keyboard navigation with explicit logging
  if (process.env.NODE_ENV === 'development') {
    console.log(
      '🎹 About to call useKeyboardNavigation with onEnter:',
      !!handleEnterPress
    )
  }

  useKeyboardNavigation({
    onPrevious: () => {
      UmamiEvents.galleryNavigation(
        'keyboard-left',
        realTimeCurrentIndex,
        Math.max(realTimeCurrentIndex - 1, 0)
      )
      scrollToImage('left')
    },
    onNext: () => {
      UmamiEvents.galleryNavigation(
        'keyboard-right',
        realTimeCurrentIndex,
        Math.min(realTimeCurrentIndex + 1, designs.length - 1)
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
    // Use the state-based Enter handler
    onEnter: handleEnterPress,
    enabled: true,
  })

  return {
    handleScrollToImage,
    handleDotClick,
    handleImageClick,
    swipeHandlers: isMobile ? swipeHandlers : {},
  }
}
