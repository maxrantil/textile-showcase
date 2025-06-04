'use client'

import { forwardRef, useState, useEffect } from 'react'
import { RESPONSIVE_CONFIG, getGalleryConfig } from '@/config/responsiveConfig'

interface GalleryContainerProps {
  children: React.ReactNode
  isRestoring: boolean
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
    
    const [breakpoint, setBreakpoint] = useState<'mobile' | 'tablet' | 'desktop'>('desktop')
    
    // Detect current breakpoint
    useEffect(() => {
      const getBreakpoint = () => {
        const width = window.innerWidth
        if (width < RESPONSIVE_CONFIG.breakpoints.md) return 'mobile'
        if (width < RESPONSIVE_CONFIG.breakpoints.lg) return 'tablet'
        return 'desktop'
      }
      
      const handleResize = () => setBreakpoint(getBreakpoint())
      handleResize() // Set initial value
      
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }, [])
    
    const galleryConfig = getGalleryConfig(breakpoint)
    const headerHeight = RESPONSIVE_CONFIG.header[breakpoint].height
    
    return (
      <div style={{ 
        height: '100vh',
        overflow: 'hidden',
        background: '#fafafa',
        position: 'relative',
        marginTop: `${headerHeight}px`
      }}>
        <div 
          ref={ref}
          data-scroll-container="true"
          data-current-index="0"
          style={{
            display: 'flex',
            height: `calc(100vh - ${headerHeight + 40}px)`,
            paddingTop: breakpoint === 'mobile' ? '60px' : '100px',
            paddingBottom: breakpoint === 'mobile' ? '120px' : '60px', // More space for mobile indicators
            gap: `${galleryConfig.gap}px`,
            paddingLeft: galleryConfig.padding,
            paddingRight: galleryConfig.padding,
            overflowX: 'auto',
            overflowY: 'hidden',
            scrollBehavior: 'smooth',
            scrollSnapType: 'x mandatory',
            opacity: isRestoring ? 0 : 1,
            transition: isRestoring ? 'none' : 'opacity 0.3s ease',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          data-swipe-enabled={!!(onTouchStart && onTouchMove && onTouchEnd)}
        >
          {children}
        </div>

        <style jsx>{`
          div::-webkit-scrollbar {
            display: none;
          }
        `}</style>
      </div>
    )
  }
)
