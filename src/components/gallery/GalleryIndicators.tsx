// src/components/gallery/GalleryIndicators.tsx
'use client'

import { memo } from 'react'

interface GalleryIndicatorsProps {
  currentIndex: number
  totalItems: number
  onDotClick: (index: number) => void
  maxDots?: number
}

export const GalleryIndicators = memo(function GalleryIndicators({
  currentIndex,
  totalItems,
  onDotClick,
  maxDots = 8,
}: GalleryIndicatorsProps) {
  const showDots = Math.min(totalItems, maxDots)
  const showCounter = totalItems > maxDots

  return (
    <div className="gallery-indicators-mobile">
      {/* Dots */}
      {Array.from({ length: showDots }, (_, index) => (
        <button
          key={index}
          onClick={() => onDotClick(index)}
          className="touch-target touch-feedback"
          style={{
            border: 'none',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            borderRadius: '50%',
            transition: 'background-color 0.2s ease',
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)')
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = 'transparent')
          }
          aria-label={`Go to image ${index + 1}`}
        >
          <span
            className="gallery-dot"
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: index === currentIndex ? '#333' : '#ccc',
              transition: 'all 0.3s ease',
              transform: index === currentIndex ? 'scale(1.2)' : 'scale(1)',
              display: 'block',
            }}
          />
        </button>
      ))}

      {/* Counter for many items */}
      {showCounter && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            paddingLeft: '8px',
            borderLeft: '1px solid #e5e5e5',
            marginLeft: '8px',
          }}
        >
          <span
            className="text-caption-mobile"
            style={{
              color: '#666',
              fontWeight: 500,
              letterSpacing: '0.5px',
            }}
          >
            {currentIndex + 1}/{totalItems}
          </span>
        </div>
      )}
    </div>
  )
})
