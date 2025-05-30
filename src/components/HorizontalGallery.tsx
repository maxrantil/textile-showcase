'use client'

import { memo, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { TextileDesign } from '@/types/sanity'
import { useHorizontalScroll } from '@/hooks/useHorizontalScroll'
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation'
import OptimizedImage from './OptimizedImage'
import NavigationArrows from './NavigationArrows'

interface HorizontalGalleryProps {
  designs: TextileDesign[]
}

// Memoized individual gallery item component
const GalleryItem = memo(({ 
  design, 
  index, 
  onClick 
}: { 
  design: TextileDesign
  index: number
  onClick: () => void 
}) => {
  return (
    <div 
      style={{ 
        minWidth: '70vw',
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
        width: '100%',
        height: '70vh',
        position: 'relative',
        boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
        backgroundColor: '#f5f5f5',
        overflow: 'hidden',
      }}>
        <OptimizedImage
          src={design.image}
          alt={design.title}
          width={1200}
          height={800}
          priority={index < 3} // Prioritize first 3 images
          onClick={onClick}
          sizes="70vw"
          quality={index < 3 ? 90 : 80} // Higher quality for hero images
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
  
  // Memoize designs to prevent unnecessary re-renders
  const memoizedDesigns = useMemo(() => 
    designs.map((design, index) => ({ ...design, index })), 
    [designs]
  )

  // Custom scroll hook
  const {
    scrollContainerRef,
    canScrollLeft,
    canScrollRight,
    currentIndex,
    scrollToImage,
    scrollToIndex,
  } = useHorizontalScroll({ 
    itemCount: designs.length,
    onIndexChange: useCallback((index: number) => {
      // Optional: preload next/previous images
      const preloadIndices = [index - 1, index + 1].filter(i => i >= 0 && i < designs.length)
      // Could implement preloading logic here
    }, [designs.length])
  })

  // Memoized click handler
  const handleImageClick = useCallback((design: TextileDesign) => {
    // Add loading state or transition effect here if needed
    router.push(`/project/${design.slug?.current || design._id}`)
  }, [router])

  // Keyboard navigation
  useKeyboardNavigation({
    onPrevious: () => scrollToImage('left'),
    onNext: () => scrollToImage('right'),
    onScrollUp: () => window.scrollBy({ top: -150, behavior: 'smooth' }),
    onScrollDown: () => window.scrollBy({ top: 150, behavior: 'smooth' }),
    onEnter: () => {
      // Open the currently focused/visible project
      const currentDesign = designs[currentIndex]
      if (currentDesign) {
        handleImageClick(currentDesign)
      }
    },
    enabled: true
  })

  // Handle scroll to specific item
  const handleScrollTo = useCallback((direction: 'left' | 'right') => {
    scrollToImage(direction)
  }, [scrollToImage])

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
          gap: '40px',
          paddingLeft: '15vw',
          paddingRight: '15vw',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch', // Better mobile scrolling
        }}
        // Add touch support for mobile
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

// Export memoized component to prevent unnecessary re-renders
export default memo(HorizontalGallery)
