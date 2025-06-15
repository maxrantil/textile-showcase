// src/components/gallery/HorizontalGallery.tsx - Updated to use state
'use client'

import { memo, useMemo, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { TextileDesign } from '@/sanity/types'
import { useGalleryState } from './GalleryState'
import { useGalleryNavigationLogic } from './GalleryNavigation'
import { useGalleryPreloader } from './GalleryPreloader'
import { useGalleryLifecycle } from './GalleryLifecycle'
import { GalleryIndicators } from './GalleryIndicators'
import { GalleryContainer } from './GalleryContainer'
import { GalleryItem } from './GalleryItem'
import { NavigationArrows } from '../ui/NavigationArrows'

interface HorizontalGalleryProps {
  designs: TextileDesign[]
}

function HorizontalGallery({ designs }: HorizontalGalleryProps) {
  const pathname = usePathname()

  const memoizedDesigns = useMemo(
    () => designs.map((design, index) => ({ ...design, index })),
    [designs]
  )

  // State management
  const galleryState = useGalleryState({ designs, pathname })

  // Detect mobile breakpoint
  useEffect(() => {
    const checkMobile = () => {
      galleryState.updateMobileState(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [galleryState])

  // Navigation logic with state instead of ref
  const navigation = useGalleryNavigationLogic({
    designs,
    currentIndex: galleryState.currentIndex,
    realTimeCurrentIndex: galleryState.realTimeCurrentIndex, // Now a number
    setRealTimeCurrentIndex: galleryState.setRealTimeCurrentIndex, // Add setter
    pathname,
    isFirstMount: galleryState.isFirstMount.current,
    isMobile: galleryState.isMobile,
    scrollToImage: galleryState.scrollToImage,
    scrollToIndex: galleryState.scrollToIndex,
  })

  // Image preloading
  useGalleryPreloader({
    designs: memoizedDesigns,
    currentIndex: galleryState.currentIndex,
    isMobile: galleryState.isMobile,
  })

  // Lifecycle management (you might need to update this too)
  useGalleryLifecycle({
    pathname,
    designs,
    restoration: galleryState.restoration,
    scrollContainerRef: galleryState.scrollContainerRef,
    scrollToIndex: galleryState.scrollToIndex,
    setCurrentIndex: galleryState.setCurrentIndex,
    realTimeCurrentIndex: { current: galleryState.realTimeCurrentIndex }, // Convert back to ref-like object
    markFirstMountComplete: galleryState.markFirstMountComplete,
  })

  if (!designs || designs.length === 0) {
    return (
      <div
        className="full-height-mobile"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#fafafa',
        }}
      >
        <p className="text-body-mobile" style={{ color: '#666' }}>
          No designs found
        </p>
      </div>
    )
  }

  return (
    <>
      {/* Debug info in development */}
      {process.env.NODE_ENV === 'development' && (
        <div
          style={{
            position: 'fixed',
            top: '100px',
            left: '20px',
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '10px',
            borderRadius: '5px',
            fontSize: '12px',
            fontFamily: 'monospace',
            zIndex: 100,
          }}
        >
          <div>Current Index: {galleryState.currentIndex}</div>
          <div>RealTime Index: {galleryState.realTimeCurrentIndex}</div>
          <div>Total Designs: {designs.length}</div>
          <div>
            Current Design:{' '}
            {designs[galleryState.realTimeCurrentIndex]?.title || 'None'}
          </div>
          <div>Is Mobile: {galleryState.isMobile ? 'Yes' : 'No'}</div>
          <div>Keyboard Shortcuts:</div>
          <div>← → : Navigate</div>
          <div>Enter/Space : Open project</div>
        </div>
      )}

      {/* Navigation Arrows */}
      <NavigationArrows
        canScrollLeft={
          galleryState.canScrollLeft && galleryState.currentIndex > 0
        }
        canScrollRight={
          galleryState.canScrollRight &&
          galleryState.currentIndex < designs.length - 1
        }
        onScrollLeft={() => navigation.handleScrollToImage('left')}
        onScrollRight={() => navigation.handleScrollToImage('right')}
        variant="gallery"
        size="large"
        position="fixed"
        showOnMobile={false}
      />

      <GalleryContainer
        ref={galleryState.scrollContainerRef}
        isRestoring={galleryState.restoration.isRestoring}
        {...navigation.swipeHandlers}
      >
        {memoizedDesigns.map((design) => (
          <GalleryItem
            key={design._id}
            design={design}
            index={design.index}
            isActive={design.index === galleryState.currentIndex}
            onClick={() => navigation.handleImageClick(design)}
          />
        ))}
      </GalleryContainer>

      {/* Mobile indicators */}
      {galleryState.isMobile && designs.length > 1 && (
        <GalleryIndicators
          currentIndex={galleryState.currentIndex}
          totalItems={designs.length}
          onDotClick={navigation.handleDotClick}
        />
      )}
    </>
  )
}

export default memo(HorizontalGallery)
