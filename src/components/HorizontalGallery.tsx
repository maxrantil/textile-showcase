'use client'

import { memo, useMemo, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { TextileDesign } from '@/types/sanity'
import { useHorizontalScroll } from '@/hooks/useHorizontalScroll'
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation'
import { scrollManager } from '@/lib/scrollManager'
import { getImageDimensions, getOptimizedImageUrl } from '@/lib/sanity'
import NavigationArrows from './NavigationArrows'

interface HorizontalGalleryProps {
  designs: TextileDesign[]
}

// Memoized individual gallery item component
const GalleryItem = memo(({ 
  design, 
  index, 
  onClick,
  isActive = false // Keep for centering logic but no visual effects
}: { 
  design: TextileDesign
  index: number
  onClick: () => void
  isActive?: boolean
}) => {
  // Calculate dimensions based on image aspect ratio
  const imageDimensions = getImageDimensions(design.image)
  const fixedHeight = 70 // vh
  const aspectRatio = imageDimensions?.aspectRatio || 4/3
  
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
      {/* Image container that adapts to image size - minimal styling */}
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
  
  // Real-time index ref for avoiding stale closures in keyboard navigation
  const realTimeCurrentIndex = useRef(0)
  
  // Memoize designs
  const memoizedDesigns = useMemo(() => 
    designs.map((design, index) => ({ ...design, index })), 
    [designs]
  )

  // Your existing scroll hook
  const {
    scrollContainerRef,
    canScrollLeft,
    canScrollRight,
    currentIndex,
    scrollToImage,
    scrollToIndex,
    centerCurrentItem, // NEW: Get centering function
  } = useHorizontalScroll({ 
    itemCount: designs.length,
    onIndexChange: useCallback((index: number) => {
      // Update real-time index immediately
      realTimeCurrentIndex.current = index
      
      // Optional: preload next/previous images
      const preloadIndices = [index - 1, index + 1].filter(i => i >= 0 && i < designs.length)
      // Could implement preloading logic here
    }, [designs.length])
  })

  // Sync real-time index with current index
  useEffect(() => {
    realTimeCurrentIndex.current = currentIndex
  }, [currentIndex])

  // Restore scroll position IMMEDIATELY on mount
  useEffect(() => {
    const container = scrollContainerRef.current
    if (container && designs.length > 0) {
      // Restore immediately on the same frame
      const restored = scrollManager.restore(container)
      
      if (!restored) {
        // If that didn't work, try on next frame
        requestAnimationFrame(() => {
          if (scrollContainerRef.current) {
            scrollManager.restore(scrollContainerRef.current)
          }
        })
      }
    }
  }, []) // Run only once on mount, not when designs change

  // DISABLED: Center the first item on initial load (causing conflicts)
  // useEffect(() => {
  //   if (scrollContainerRef.current && designs.length > 0) {
  //     setTimeout(() => {
  //       if (centerCurrentItem) {
  //         centerCurrentItem()
  //       }
  //     }, 300)
  //   }
  // }, [designs.length, centerCurrentItem])

  // Initialize real-time index when component mounts
  useEffect(() => {
    realTimeCurrentIndex.current = 0
  }, [])

  // Save scroll position periodically
  useEffect(() => {
    let scrollSaveTimeout: NodeJS.Timeout
    let isNavigating = false

    const handleScroll = () => {
      // Don't save scroll position if we're in the middle of navigation
      if (isNavigating) return
      
      clearTimeout(scrollSaveTimeout)
      scrollSaveTimeout = setTimeout(() => {
        if (scrollContainerRef.current && !isNavigating) {
          scrollManager.save(scrollContainerRef.current.scrollLeft)
        }
      }, 300) // Debounce saves
    }

    const container = scrollContainerRef.current
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true })
    }

    // Save on page unload
    const handleBeforeUnload = () => {
      if (scrollContainerRef.current) {
        scrollManager.saveImmediate(scrollContainerRef.current.scrollLeft)
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)

    // Listen for navigation start to stop saving scroll position
    const stopSaving = () => {
      isNavigating = true
      clearTimeout(scrollSaveTimeout)
    }

    // Create a custom event listener for when navigation starts
    window.addEventListener('gallery-navigation-start', stopSaving)

    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll)
      }
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('gallery-navigation-start', stopSaving)
      clearTimeout(scrollSaveTimeout)
      // Final save only if not navigating
      if (scrollContainerRef.current && !isNavigating) {
        scrollManager.save(scrollContainerRef.current.scrollLeft)
      }
    }
  }, [])

  // Click handler - save position before navigating
  const handleImageClick = useCallback((design: TextileDesign) => {
    // Signal that navigation is starting to stop background scroll saving
    window.dispatchEvent(new Event('gallery-navigation-start'))
    
    // Save scroll position immediately before leaving
    if (scrollContainerRef.current) {
      scrollManager.saveImmediate(scrollContainerRef.current.scrollLeft)
    }
    
    router.push(`/project/${design.slug?.current || design._id}`)
  }, [router])

  // Keyboard navigation
  useKeyboardNavigation({
    onPrevious: () => handleScrollTo('left'),
    onNext: () => handleScrollTo('right'),
    onScrollUp: () => window.scrollBy({ top: -150, behavior: 'smooth' }),
    onScrollDown: () => window.scrollBy({ top: 150, behavior: 'smooth' }),
    onAbout: () => {
      // Signal navigation start and save position before navigating
      window.dispatchEvent(new Event('gallery-navigation-start'))
      if (scrollContainerRef.current) {
        scrollManager.saveImmediate(scrollContainerRef.current.scrollLeft)
      }
      router.push('/about')
    },
    onWork: () => router.push('/'),
    onContact: () => {
      // Signal navigation start and save position before navigating
      window.dispatchEvent(new Event('gallery-navigation-start'))
      if (scrollContainerRef.current) {
        scrollManager.saveImmediate(scrollContainerRef.current.scrollLeft)
      }
      router.push('/contact')
    },
    onEnter: () => {
      // Use the real-time current index instead of the potentially stale one
      const activeIndex = realTimeCurrentIndex.current
      const currentDesign = designs[activeIndex]
      
      console.log('Enter pressed - using real-time index:', activeIndex, 'design:', currentDesign?.title)
      
      if (currentDesign) {
        // Signal that navigation is starting to stop background scroll saving
        window.dispatchEvent(new Event('gallery-navigation-start'))
        
        // Save current scroll position immediately before navigating to project
        if (scrollContainerRef.current) {
          scrollManager.saveImmediate(scrollContainerRef.current.scrollLeft)
        }
        
        router.push(`/project/${currentDesign.slug?.current || currentDesign._id}`)
      }
    },
    enabled: true
  })

  // Handle scroll to specific item
  const handleScrollTo = useCallback((direction: 'left' | 'right') => {
    // Calculate what the new index will be
    const newIndex = direction === 'left' 
      ? Math.max(0, realTimeCurrentIndex.current - 1)
      : Math.min(designs.length - 1, realTimeCurrentIndex.current + 1)
    
    // Update real-time index immediately before scrolling
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

  return (
    <div style={{ 
      height: '100vh', 
      overflow: 'hidden', 
      background: '#fafafa', 
      position: 'relative',
      marginTop: '60px'
    }}>
      <NavigationArrows
        canScrollLeft={canScrollLeft}
        canScrollRight={canScrollRight}
        onScrollLeft={() => handleScrollTo('left')}
        onScrollRight={() => handleScrollTo('right')}
      />
      
      <div 
        ref={scrollContainerRef}
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
          paddingLeft: '45vw', // INCREASED: More padding so edge items can be centered
          paddingRight: '45vw', // INCREASED: More padding so edge items can be centered
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
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
            isActive={design.index === currentIndex} // NEW: Pass active state
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
