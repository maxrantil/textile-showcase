'use client'

import { forwardRef } from 'react'
import { GALLERY_STYLES, GALLERY_CONFIG } from '@/config/galleryConfig'

interface GalleryContainerProps {
  children: React.ReactNode
  isRestoring: boolean
  onTouchStart?: (e: React.TouchEvent) => void
  onTouchMove?: (e: React.TouchEvent) => void
}

export const GalleryContainer = forwardRef<HTMLDivElement, GalleryContainerProps>(
  function GalleryContainer({ children, isRestoring, onTouchStart, onTouchMove }, ref) {
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
          }}
          onTouchStart={(e) => {
            const touch = e.touches[0]
            const target = e.currentTarget as HTMLElement // TypeScript fix
            target.dataset.startX = touch.clientX.toString()
            onTouchStart?.(e)
          }}
          onTouchMove={(e) => {
            e.preventDefault()
            onTouchMove?.(e)
          }}
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
