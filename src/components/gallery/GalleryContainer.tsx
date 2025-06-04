// src/components/gallery/GalleryContainer.tsx - Updated with swipe support
'use client'

import { forwardRef } from 'react'
import { GALLERY_STYLES, GALLERY_CONFIG } from '@/config/galleryConfig'

interface GalleryContainerProps {
  children: React.ReactNode
  isRestoring: boolean
  // Add swipe event handlers
  onTouchStart?: (e: React.TouchEvent) => void
  onTouchMove?: (e: React.TouchEvent) => void
  onTouchEnd?: (e: React.TouchEvent) => void
}

export const GalleryContainer = forwardRef<HTMLDivElement, GalleryContainerProps>(
  function GalleryContainer({ 
    children, 
    isRestoring, 
    onTouchStart, 
    onTouchMove, 
    onTouchEnd 
  }, ref) {
    
    return (
      <div style={{ 
        ...GALLERY_STYLES.container,
        marginTop: `${GALLERY_CONFIG.headerOffset}px`
      }}>
        <div 
          ref={ref}
          data-scroll-container="true"
          data-current-index="0"
          style={{
            ...GALLERY_STYLES.scroller,
            height: `calc(100vh - ${GALLERY_CONFIG.headerOffset + 40}px)`,
            paddingTop: '100px',
            paddingBottom: '60px',
            overflowX: 'auto',
            overflowY: 'hidden',
            scrollBehavior: GALLERY_CONFIG.scrollBehavior,
            scrollSnapType: 'x mandatory',
            opacity: isRestoring ? 0 : 1,
            transition: isRestoring ? 'none' : 'opacity 0.3s ease',
            // Mobile-specific optimizations
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
          // Add touch event handlers
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          // Add some debugging attributes
          data-swipe-enabled={!!(onTouchStart && onTouchMove && onTouchEnd)}
        >
          {children}
        </div>

        {/* Hide scrollbar */}
        <style jsx>{`
          div::-webkit-scrollbar {
            display: none;
          }
          
          /* Add some mobile-specific styles */
          @media (max-width: 767px) {
            [data-scroll-container] {
              padding-top: 60px !important;
              padding-bottom: 80px !important; /* Make room for indicators */
            }
          }
        `}</style>
      </div>
    )
  }
)
