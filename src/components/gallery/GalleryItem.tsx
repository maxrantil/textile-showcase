'use client'

import { memo, useState, useEffect } from 'react'
import { TextileDesign } from '@/sanity/types'
import { RESPONSIVE_CONFIG } from '@/config/responsiveConfig'
import { GalleryImage } from './GalleryImage'
import { GalleryItemInfo } from './GalleryItemInfo'

interface GalleryItemProps {
  design: TextileDesign
  index: number
  onClick: () => void
  isActive?: boolean
}

export const GalleryItem = memo(function GalleryItem({ 
  design, 
  index, 
  onClick,
}: GalleryItemProps) {
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
    handleResize()
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  // Responsive item width
  const getItemWidth = () => {
    switch (breakpoint) {
      case 'mobile':
        return 'clamp(280px, 85vw, 400px)'
      case 'tablet':
        return 'clamp(350px, 60vw, 500px)'
      default:
        return 'auto' // Desktop uses height-based sizing
    }
  }
  
  return (
    <div 
      role="button"
      tabIndex={0}
      aria-label={`View ${design.title} project`}
      style={{ 
        flexShrink: 0,
        scrollSnapAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        cursor: 'pointer',
        transition: 'transform 0.3s ease',
        width: getItemWidth(),
        maxWidth: breakpoint === 'mobile' ? '90vw' : 'none'
      }}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.02)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)'
      }}
    >
      <GalleryImage 
        src={design.image}
        alt={design.title}
        index={index}
        onClick={onClick}
        breakpoint={breakpoint}
      />
      
      <GalleryItemInfo 
        title={design.title}
        year={design.year}
      />
    </div>
  )
})
