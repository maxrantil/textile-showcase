// ABOUTME: Mock gallery components for Phase 3 integration testing

import React from 'react'
import { TextileDesign } from '@/sanity/types'
import { useGalleryNavigation } from '@/hooks/gallery/useGalleryNavigation'
import { useHorizontalSwipe } from '@/hooks/mobile/useSwipeGesture'

interface GalleryProps {
  designs: TextileDesign[]
  currentIndex: number
  pathname: string
  isFirstMount: boolean
}

export const MobileGallery: React.FC<GalleryProps> = ({
  designs,
  currentIndex,
  pathname,
  isFirstMount,
}) => {
  const { handleImageClick } = useGalleryNavigation({
    designs,
    currentIndex,
    pathname,
    isFirstMount,
  })

  const { swipeHandlers } = useHorizontalSwipe({
    onSwipeLeft: () => {
      const nextIndex = currentIndex + 1
      if (nextIndex < designs.length) {
        handleImageClick(designs[nextIndex])
      }
    },
    onSwipeRight: () => {
      const prevIndex = currentIndex - 1
      if (prevIndex >= 0) {
        handleImageClick(designs[prevIndex])
      }
    },
    enabled: true,
  })

  return (
    <main role="main" data-testid="mobile-gallery" {...swipeHandlers}>
      <div>
        {designs.map((design) => (
          <div
            key={design._id}
            onClick={() => handleImageClick(design)}
            style={{ cursor: 'pointer' }}
          >
            <h2>{design.title}</h2>
            <p>{design.description}</p>
            {design.images && design.images.length > 0 && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`https://cdn.sanity.io/images/test/${design.images[0].asset._ref}`}
                alt={design.images[0].alt || design.title}
                role="img"
              />
            )}
          </div>
        ))}
      </div>
    </main>
  )
}

export const DesktopGallery: React.FC<GalleryProps> = ({
  designs,
  currentIndex,
  pathname,
  isFirstMount,
}) => {
  const { handleImageClick } = useGalleryNavigation({
    designs,
    currentIndex,
    pathname,
    isFirstMount,
  })

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowRight') {
      const nextIndex = currentIndex + 1
      if (nextIndex < designs.length) {
        handleImageClick(designs[nextIndex])
      }
    } else if (event.key === 'ArrowLeft') {
      const prevIndex = currentIndex - 1
      if (prevIndex >= 0) {
        handleImageClick(designs[prevIndex])
      }
    }
  }

  return (
    <main
      role="main"
      data-testid="desktop-gallery"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div>
        {designs.map((design) => (
          <div
            key={design._id}
            onClick={() => handleImageClick(design)}
            style={{ cursor: 'pointer' }}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                handleImageClick(design)
              }
            }}
          >
            <h2>{design.title}</h2>
            <p>{design.description}</p>
            {design.images && design.images.length > 0 && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`https://cdn.sanity.io/images/test/${design.images[0].asset._ref}`}
                alt={design.images[0].alt || design.title}
                role="img"
              />
            )}
          </div>
        ))}
      </div>
    </main>
  )
}
