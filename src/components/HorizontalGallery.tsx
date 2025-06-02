'use client'

import { memo, useMemo, useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { TextileDesign } from '@/types/sanity'
import { useHorizontalScroll } from '@/hooks/useHorizontalScroll'
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation'
import { scrollManager } from '@/lib/scrollManager'
import { getImageDimensions, getOptimizedImageUrl } from '@/lib/sanity'
import NavigationArrows from './NavigationArrows'

interface HorizontalGalleryProps {
  designs: TextileDesign[]
}

const GalleryItem = memo(({ 
  design, 
  index, 
  onClick,
  isActive = false
}: { 
  design: TextileDesign
  index: number
  onClick: () => void
  isActive?: boolean
}) => {
  const imageDimensions = getImageDimensions(design.image)
  const fixedHeight = 70 // vh
  
  return (
    <div 
      style={{ 
        flexShrink: 0,
        scrollSnapAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        cursor: 'pointer',
        transition: 'transform 0.3s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.02)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)'
      }}
    >
      <div style={{
        position: 'relative',
        boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
        display: 'inline-block',
        lineHeight: 0,
        backgroundColor: 'transparent'
      }}>
        <img
          src={getOptimizedImageUrl(design.image, { 
            height: 800,
            quality: index < 3 ? 90 : 80, 
            format: 'webp'
          })}
          alt={design.title}
          style={{
            height: `${fixedHeight}vh`,
            width: 'auto',
            maxHeight: '700px',
            minHeight: '300px',
            display: 'block',
            objectFit: 'contain',
            cursor: 'pointer'
          }}
          loading={index < 3 ? 'eager' : 'lazy'}
          onClick={onClick}
        />
      </div>

      <h3 style={{
        fontSize: '24px',
        fontWeight: 300,
        margin: '24px 0 0 0',
        textAlign: 'left',
        color: '#333',
        letterSpacing: '0.5px',
        width: '100%'
      }}>
        {design.title}
      </h3>
      
      {design.year && (
        <p style={{
          fontSize: '16px',
          color: '#666',
          margin: '4px 0 0 0',
          width: '100%',
          textAlign: 'left'
        }}>
          {design.year}
        </p>
      )}
    </div>
  )
})

GalleryItem.displayName = 'GalleryItem'

function HorizontalGallery({ designs }: HorizontalGalleryProps) {
  const router = useRouter()
  const pathname = usePathname()
  
  const realTimeCurrentIndex = useRef(0)
  const restorationAttempted = useRef(false)
  const isFirstMount = useRef(true)
  const [isRestoring, setIsRestoring] = useState(true)
  
  const memoizedDesigns = useMemo(() => 
    designs.map((design, index) => ({ ...design, index })), 
    [designs]
  )

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
    onIndexChange: useCallback((index: number) => {
      realTimeCurrentIndex.current = index
      
      // Update the current index in the DOM for the scroll manager
      if (scrollContainerRef.current) {
        scrollContainerRef.current.setAttribute('data-current-index', index.toString())
      }
      
      console.log('📍 Current index changed to:', index)
    }, [designs.length])
  })

  useEffect(() => {
    realTimeCurrentIndex.current = currentIndex
  }, [currentIndex])

  // Index-based restoration that works across screen sizes
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container || designs.length === 0) return

    container.setAttribute('data-scroll-container', 'true')
    container.setAttribute('data-current-index', '0')
    restorationAttempted.current = false

    const attemptRestore = (attempt: number = 1) => {
      if (restorationAttempted.current) return
      
      console.log(`🔄 Index restoration attempt ${attempt} for path: ${pathname}`)
      
      if (attempt === 1) {
        scrollManager.debug()
      }
      
      // Get the saved index
      const savedIndex = scrollManager.getSavedIndex(pathname)
      
      if (savedIndex !== null && savedIndex >= 0 && savedIndex < designs.length) {
        console.log('✅ Restoring to index:', savedIndex)
        
        // FIRST: Force update both the hook state and our refs immediately
        setCurrentIndex(savedIndex)
        realTimeCurrentIndex.current = savedIndex
        container.setAttribute('data-current-index', savedIndex.toString())
        
        // THEN: Use instant scrolling for restoration to make it invisible
        scrollToIndex(savedIndex, true) // true = instant
        restorationAttempted.current = true
        
        // Show gallery after a brief delay to ensure scroll is complete
        setTimeout(() => {
          setIsRestoring(false)
        }, 50)
        
      } else if (attempt < 3) {
        // Try again with delay
        const delay = 50 * attempt // Reduced delay for faster attempts
        setTimeout(() => attemptRestore(attempt + 1), delay)
      } else {
        console.log('✅ Starting from beginning (index 0)')
        
        // FIRST: Force update both the hook state and our refs immediately
        setCurrentIndex(0)
        realTimeCurrentIndex.current = 0
        container.setAttribute('data-current-index', '0')
        
        // THEN: Use instant scrolling
        scrollToIndex(0, true) // true = instant
        restorationAttempted.current = true
        
        // Show gallery after a brief delay
        setTimeout(() => {
          setIsRestoring(false)
        }, 50)
      }
    }

    // Start restoration attempts immediately - no delay for instant restoration
    attemptRestore()

  }, [pathname, designs.length, scrollToIndex])

  useEffect(() => {
    realTimeCurrentIndex.current = 0
    isFirstMount.current = true
  }, [])

  // Save current index instead of scroll position
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    let isNavigating = false

    const handleIndexChange = () => {
      // Only save if restoration has been attempted and we're not navigating
      if (!isNavigating && restorationAttempted.current && !isFirstMount.current) {
        scrollManager.save(realTimeCurrentIndex.current, pathname)
      }
      
      // Mark first mount as complete after first index change
      if (isFirstMount.current) {
        setTimeout(() => {
          isFirstMount.current = false
        }, 1000)
      }
    }

    const stopSaving = () => {
      isNavigating = true
      // Save immediately when navigation starts
      if (restorationAttempted.current && !isFirstMount.current) {
        scrollManager.saveImmediate(realTimeCurrentIndex.current, pathname)
      }
    }

    const resumeSaving = () => {
      setTimeout(() => {
        isNavigating = false
      }, 200)
    }

    // Listen to index changes instead of scroll events
    const indexChangeHandler = () => {
      handleIndexChange()
    }

    window.addEventListener('gallery-navigation-start', stopSaving)
    window.addEventListener('gallery-navigation-complete', resumeSaving)
    
    // Listen for manual scroll events but use index instead
    container.addEventListener('scroll', indexChangeHandler, { passive: true })

    const handleBeforeUnload = () => {
      if (!isNavigating && !isFirstMount.current) {
        scrollManager.saveImmediate(realTimeCurrentIndex.current, pathname)
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      container.removeEventListener('scroll', indexChangeHandler)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('gallery-navigation-start', stopSaving)
      window.removeEventListener('gallery-navigation-complete', resumeSaving)
      
      // Final save on cleanup
      if (!isNavigating && restorationAttempted.current && !isFirstMount.current) {
        scrollManager.saveImmediate(realTimeCurrentIndex.current, pathname)
      }
    }
  }, [pathname])

  // Click handler with index saving
  const handleImageClick = useCallback((design: TextileDesign) => {
    console.log('🖱️ Image clicked, saving index before navigation')
    
    // Save current index before navigation
    if (!isFirstMount.current) {
      scrollManager.saveImmediate(realTimeCurrentIndex.current, pathname)
      console.log(`💾 Saved index ${realTimeCurrentIndex.current} for path ${pathname}`)
    }
    
    scrollManager.triggerNavigationStart()
    router.push(`/project/${design.slug?.current || design._id}`)
  }, [router, pathname])

  // Enhanced keyboard navigation
  useKeyboardNavigation({
    onPrevious: () => handleScrollTo('left'),
    onNext: () => handleScrollTo('right'),
    onScrollUp: () => window.scrollBy({ top: -150, behavior: 'smooth' }),
    onScrollDown: () => window.scrollBy({ top: 150, behavior: 'smooth' }),
    onAbout: () => {
      scrollManager.triggerNavigationStart()
      if (!isFirstMount.current) {
        scrollManager.saveImmediate(realTimeCurrentIndex.current, pathname)
      }
      router.push('/about')
    },
    onWork: () => router.push('/'),
    onContact: () => {
      scrollManager.triggerNavigationStart()
      if (!isFirstMount.current) {
        scrollManager.saveImmediate(realTimeCurrentIndex.current, pathname)
      }
      router.push('/contact')
    },
    onEnter: () => {
      const activeIndex = realTimeCurrentIndex.current
      const currentDesign = designs[activeIndex]
      
      console.log('Enter pressed - using real-time index:', activeIndex, 'design:', currentDesign?.title)
      
      if (currentDesign) {
        handleImageClick(currentDesign)
      }
    },
    enabled: true
  })

  const handleScrollTo = useCallback((direction: 'left' | 'right') => {
    const newIndex = direction === 'left' 
      ? Math.max(0, realTimeCurrentIndex.current - 1)
      : Math.min(designs.length - 1, realTimeCurrentIndex.current + 1)
    
    realTimeCurrentIndex.current = newIndex
    console.log('Scroll navigation - new real-time index:', newIndex)
    
    scrollToImage(direction)
  }, [scrollToImage, designs.length])

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

  const showLeftArrow = canScrollLeft && currentIndex > 0
  const showRightArrow = canScrollRight && currentIndex < designs.length - 1

  return (
    <div style={{ 
      height: '100vh', 
      overflow: 'hidden', 
      background: '#fafafa', 
      position: 'relative',
      marginTop: '60px'
    }}>
      <NavigationArrows
        canScrollLeft={showLeftArrow}
        canScrollRight={showRightArrow}
        onScrollLeft={() => handleScrollTo('left')}
        onScrollRight={() => handleScrollTo('right')}
        variant="gallery"
        size="large"
      />
      
      <div 
        ref={scrollContainerRef}
        data-scroll-container="true"
        data-current-index="0"
        style={{
          display: 'flex',
          height: 'calc(100vh - 100px)',
          paddingTop: '100px',
          paddingBottom: '60px',
          overflowX: 'auto',
          overflowY: 'hidden',
          scrollBehavior: 'smooth',
          scrollSnapType: 'x mandatory',
          gap: '80px',
          paddingLeft: '45vw',
          paddingRight: '45vw',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
          opacity: isRestoring ? 0 : 1, // Hide during restoration
          transition: isRestoring ? 'none' : 'opacity 0.3s ease', // Smooth fade in after restoration
        }}
        onTouchStart={(e) => {
          const touch = e.touches[0]
          e.currentTarget.dataset.startX = touch.clientX.toString()
        }}
        onTouchMove={(e) => {
          e.preventDefault()
        }}
      >
        {memoizedDesigns.map((design) => (
          <GalleryItem
            key={design._id}
            design={design}
            index={design.index}
            isActive={design.index === currentIndex}
            onClick={() => handleImageClick(design)}
          />
        ))}
      </div>

      <style jsx>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  )
}

export default memo(HorizontalGallery)
