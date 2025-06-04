// src/components/gallery/HorizontalGallery.tsx - Fixed version with proper arrow control and mobile utilities
'use client'

import { memo, useMemo, useRef, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { TextileDesign } from '@/sanity/types'
import { useHorizontalScroll } from '@/hooks/useHorizontalScroll'
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation'
import { useScrollRestoration } from '@/hooks/gallery/useScrollRestoration'
import { useGalleryNavigation } from '@/hooks/gallery/useGalleryNavigation'
import { useHorizontalSwipe } from '@/hooks/useSwipeGesture'
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
  
  // Add state to detect mobile
  const [isMobile, setIsMobile] = useState(false)
  
  // Detect if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
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

  // SWIPE GESTURE SUPPORT
  const swipeHandlers = useHorizontalSwipe({
    onSwipeLeft: () => {
      console.log('🚀 Gallery swipe left - going to next image')
      scrollToImage('right') // Swipe left = go to next image
    },
    onSwipeRight: () => {
      console.log('🚀 Gallery swipe right - going to previous image')
      scrollToImage('left') // Swipe right = go to previous image
    },
    enabled: isMobile, // Only enable on mobile
    minSwipeDistance: 50,
    maxSwipeTime: 400
  })

  // Handle restoration when component mounts
  useEffect(() => {
    if (!scrollContainerRef.current || designs.length === 0) return

    scrollContainerRef.current.setAttribute('data-scroll-container', 'true')
    scrollContainerRef.current.setAttribute('data-current-index', '0')

    const attemptRestore = () => {
      restoration.attemptRestoration(
        (index, instant) => {
          setCurrentIndex(index)
          realTimeCurrentIndex.current = index
          scrollContainerRef.current?.setAttribute('data-current-index', index.toString())
          scrollToIndex(index, instant)
        }
      )
    }

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
      <div className="full-height-mobile" style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#fafafa' 
      }}>
        <p className="text-body-mobile" style={{ color: '#666' }}>No designs found</p>
      </div>
    )
  }

  return (
    <>
      {/* FIXED: Navigation Arrows - always show but with mobile control via showOnMobile prop */}
      <NavigationArrows
        canScrollLeft={canScrollLeft && currentIndex > 0}
        canScrollRight={canScrollRight && currentIndex < designs.length - 1}
        onScrollLeft={() => scrollToImage('left')}
        onScrollRight={() => scrollToImage('right')}
        variant="gallery"
        size="large"
        position="fixed" // Keep fixed positioning for gallery
        showOnMobile={false} // Hide on mobile for gallery (we have swipe instead)
      />
      
      <GalleryContainer 
        ref={scrollContainerRef}
        isRestoring={restoration.isRestoring}
        // Add swipe handlers only on mobile
        {...(isMobile ? swipeHandlers : {})}
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

      {/* Mobile indicators */}
      {isMobile && designs.length > 1 && (
        <MobileGalleryIndicators
          currentIndex={currentIndex}
          totalItems={designs.length}
          onDotClick={(index) => scrollToIndex(index)}
        />
      )}
    </>
  )
}

// Mobile Gallery Indicators Component with mobile utilities
interface MobileGalleryIndicatorsProps {
  currentIndex: number
  totalItems: number
  onDotClick: (index: number) => void
}

const MobileGalleryIndicators = memo(function MobileGalleryIndicators({
  currentIndex,
  totalItems,
  onDotClick
}: MobileGalleryIndicatorsProps) {
  return (
    <div className="gallery-indicators-mobile">
      {Array.from({ length: Math.min(totalItems, 8) }, (_, index) => (
        <button
          key={index}
          onClick={() => onDotClick(index)}
          className="touch-target touch-feedback"
          style={{
            border: 'none',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            borderRadius: '50%',
            transition: 'background-color 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          aria-label={`Go to image ${index + 1}`}
        >
          <span className="gallery-dot" style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: index === currentIndex ? '#333' : '#ccc',
            transition: 'all 0.3s ease',
            transform: index === currentIndex ? 'scale(1.2)' : 'scale(1)',
            display: 'block'
          }} />
        </button>
      ))}
      
      {/* Show counter for many items */}
      {totalItems > 8 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          paddingLeft: '8px',
          borderLeft: '1px solid #e5e5e5',
          marginLeft: '8px'
        }}>
          <span className="text-caption-mobile" style={{
            color: '#666',
            fontWeight: 500,
            letterSpacing: '0.5px'
          }}>
            {currentIndex + 1}/{totalItems}
          </span>
        </div>
      )}
    </div>
  )
})

export default memo(HorizontalGallery)
