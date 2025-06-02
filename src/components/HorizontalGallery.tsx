'use client'

import { memo, useMemo, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { TextileDesign } from '@/types/sanity'
import { useHorizontalScroll } from '@/hooks/useHorizontalScroll'
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation'
import { scrollManager } from '@/lib/scrollManager'
import { getImageDimensions, getOptimizedImageUrl } from '@/lib/sanity'
import NavigationArrows from './NavigationArrows' // Your enhanced component

interface HorizontalGalleryProps {
  designs: TextileDesign[]
}

// Memoized individual gallery item component
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
  // Calculate dimensions based on image aspect ratio
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
    centerCurrentItem,
  } = useHorizontalScroll({ 
    itemCount: designs.length,
    onIndexChange: useCallback((index: number) => {
      // Update real-time index immediately
      realTimeCurrentIndex.current = index
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
      const restored = scrollManager.restore(container)
      
      if (!restored) {
        requestAnimationFrame(() => {
          if (scrollContainerRef.current) {
            scrollManager.restore(scrollContainerRef.current)
          }
        })
      }
    }
  }, [])

  // Initialize real-time index when component mounts
  useEffect(() => {
    realTimeCurrentIndex.current = 0
  }, [])

  // Save scroll position periodically
  useEffect(() => {
    let scrollSaveTimeout: NodeJS.Timeout
    let isNavigating = false

    const handleScroll = () => {
      if (isNavigating) return
      
      clearTimeout(scrollSaveTimeout)
      scrollSaveTimeout = setTimeout(() => {
        if (scrollContainerRef.current && !isNavigating) {
          scrollManager.save(scrollContainerRef.current.scrollLeft)
        }
      }, 300)
    }

    const container = scrollContainerRef.current
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true })
    }

    const handleBeforeUnload = () => {
      if (scrollContainerRef.current) {
        scrollManager.saveImmediate(scrollContainerRef.current.scrollLeft)
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)

    const stopSaving = () => {
      isNavigating = true
      clearTimeout(scrollSaveTimeout)
    }

    window.addEventListener('gallery-navigation-start', stopSaving)

    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll)
      }
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('gallery-navigation-start', stopSaving)
      clearTimeout(scrollSaveTimeout)
      if (scrollContainerRef.current && !isNavigating) {
        scrollManager.save(scrollContainerRef.current.scrollLeft)
      }
    }
  }, [])

  // Click handler - save position before navigating
  const handleImageClick = useCallback((design: TextileDesign) => {
    window.dispatchEvent(new Event('gallery-navigation-start'))
    
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
      window.dispatchEvent(new Event('gallery-navigation-start'))
      if (scrollContainerRef.current) {
        scrollManager.saveImmediate(scrollContainerRef.current.scrollLeft)
      }
      router.push('/about')
    },
    onWork: () => router.push('/'),
    onContact: () => {
      window.dispatchEvent(new Event('gallery-navigation-start'))
      if (scrollContainerRef.current) {
        scrollManager.saveImmediate(scrollContainerRef.current.scrollLeft)
      }
      router.push('/contact')
    },
    onEnter: () => {
      const activeIndex = realTimeCurrentIndex.current
      const currentDesign = designs[activeIndex]
      
      if (currentDesign) {
        window.dispatchEvent(new Event('gallery-navigation-start'))
        
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
    const newIndex = direction === 'left' 
      ? Math.max(0, realTimeCurrentIndex.current - 1)
      : Math.min(designs.length - 1, realTimeCurrentIndex.current + 1)
    
    realTimeCurrentIndex.current = newIndex
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

  // Determine if navigation arrows should be shown - based on current position in gallery
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
      {/* Navigation Arrows - show based on current position in gallery */}
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
