'use client'

import { memo, useMemo, useRef, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { TextileDesign } from '@/sanity/types'
import { useHorizontalScroll } from '@/hooks/useHorizontalScroll'
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation'
import { useScrollRestoration } from '@/hooks/gallery/useScrollRestoration'
import { useGalleryNavigation } from '@/hooks/gallery/useGalleryNavigation'
import { scrollManager } from '@/lib/scrollManager'
import NavigationArrows from '../ui/NavigationArrows'
import { GalleryContainer } from './GalleryContainer'
import { GalleryItem } from './GalleryItem'

interface HorizontalGalleryProps {
  designs: TextileDesign[]
}

function HorizontalGallery({ designs }: HorizontalGalleryProps) {
  const pathname = usePathname()
  const realTimeCurrentIndex = useRef(0)
  const isFirstMount = useRef(true)
  
  const memoizedDesigns = useMemo(() => 
    designs.map((design, index) => ({ ...design, index })), 
    [designs]
  )

  // Restoration logic
  const restoration = useScrollRestoration(pathname, designs.length)

  // Scroll management
  const {
    scrollContainerRef,
    canScrollLeft,
    canScrollRight,
    currentIndex,
    setCurrentIndex,
    scrollToImage,
    scrollToIndex,
  } = useHorizontalScroll({ 
    itemCount: designs.length,
    onIndexChange: (index: number) => {
      realTimeCurrentIndex.current = index
      if (scrollContainerRef.current) {
        scrollContainerRef.current.setAttribute('data-current-index', index.toString())
      }
    }
  })

  // Navigation logic
  const navigation = useGalleryNavigation({
    designs,
    currentIndex: realTimeCurrentIndex.current,
    pathname,
    isFirstMount: isFirstMount.current
  })

  // Handle restoration when component mounts
  useEffect(() => {
    if (!scrollContainerRef.current || designs.length === 0) return

    scrollContainerRef.current.setAttribute('data-scroll-container', 'true')
    scrollContainerRef.current.setAttribute('data-current-index', '0')

    const attemptRestore = () => {
      restoration.attemptRestoration(
        (index, instant) => {
          // FIRST: Force update both the hook state and our refs immediately
          setCurrentIndex(index)
          realTimeCurrentIndex.current = index
          scrollContainerRef.current?.setAttribute('data-current-index', index.toString())
          
          // THEN: Use instant scrolling for restoration to make it invisible
          scrollToIndex(index, instant)
        }
      )
    }

    // Start restoration immediately
    attemptRestore()

  }, [pathname, designs.length, scrollToIndex, setCurrentIndex, restoration])

  useEffect(() => {
    realTimeCurrentIndex.current = 0
    isFirstMount.current = true
  }, [])

  // Index saving on scroll changes
  useEffect(() => {
    if (!restoration.restorationAttempted || isFirstMount.current) return

    let isNavigating = false

    const stopSaving = () => { isNavigating = true }
    const resumeSaving = () => { 
      setTimeout(() => { isNavigating = false }, 200) 
    }

    window.addEventListener('gallery-navigation-start', stopSaving)
    window.addEventListener('gallery-navigation-complete', resumeSaving)

    // Save on index changes
    if (!isNavigating) {
      scrollManager.save(realTimeCurrentIndex.current, pathname)
    }

    return () => {
      window.removeEventListener('gallery-navigation-start', stopSaving)
      window.removeEventListener('gallery-navigation-complete', resumeSaving)
      if (!isNavigating) {
        scrollManager.saveImmediate(realTimeCurrentIndex.current, pathname)
      }
    }
  }, [currentIndex, pathname, restoration.restorationAttempted])

  // Keyboard navigation
  useKeyboardNavigation({
    onPrevious: () => scrollToImage('left'),
    onNext: () => scrollToImage('right'),
    onScrollUp: () => window.scrollBy({ top: -150, behavior: 'smooth' }),
    onScrollDown: () => window.scrollBy({ top: 150, behavior: 'smooth' }),
    onAbout: () => navigation.handlePageNavigation('/about'),
    onWork: () => navigation.handlePageNavigation('/'),
    onContact: () => navigation.handlePageNavigation('/contact'),
    onEnter: () => {
      const currentDesign = designs[realTimeCurrentIndex.current]
      if (currentDesign) {
        navigation.handleImageClick(currentDesign)
      }
    },
    enabled: true
  })

  // Mark first mount complete
  useEffect(() => {
    const timer = setTimeout(() => {
      isFirstMount.current = false
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

  if (!designs || designs.length === 0) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#fafafa' 
      }}>
        <p style={{ color: '#666', fontSize: '18px' }}>No designs found</p>
      </div>
    )
  }

  return (
    <>
      <NavigationArrows
        canScrollLeft={canScrollLeft && currentIndex > 0}
        canScrollRight={canScrollRight && currentIndex < designs.length - 1}
        onScrollLeft={() => scrollToImage('left')}
        onScrollRight={() => scrollToImage('right')}
        variant="gallery"
        size="large"
      />
      
      <GalleryContainer 
        ref={scrollContainerRef}
        isRestoring={restoration.isRestoring}
      >
        {memoizedDesigns.map((design) => (
          <GalleryItem
            key={design._id}
            design={design}
            index={design.index}
            isActive={design.index === currentIndex}
            onClick={() => navigation.handleImageClick(design)}
          />
        ))}
      </GalleryContainer>
    </>
  )
}

export default memo(HorizontalGallery)
