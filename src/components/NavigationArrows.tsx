'use client'

import { buttonStyles } from '@/styles/components'

interface NavigationArrowsProps {
  canScrollLeft: boolean
  canScrollRight: boolean
  onScrollLeft: () => void
  onScrollRight: () => void
  position?: 'fixed' | 'absolute'
}

export default function NavigationArrows({ 
  canScrollLeft, 
  canScrollRight, 
  onScrollLeft, 
  onScrollRight,
  position = 'fixed'
}: NavigationArrowsProps) {
  const arrowStyle = {
    ...buttonStyles.navigation.base,
    position,
    top: '50%',
    transform: 'translateY(-50%)', // Keep only the centering transform
    zIndex: position === 'fixed' ? 10 : 5,
  }

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Only change background, no scale transform
    e.currentTarget.style.background = 'rgba(255, 255, 255, 1)'
  }

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)'
  }

  return (
    <>
      {canScrollLeft && (
        <button
          onClick={onScrollLeft}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{ ...arrowStyle, left: '20px' }}
          aria-label="Previous image"
        >
          ←
        </button>
      )}

      {canScrollRight && (
        <button
          onClick={onScrollRight}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{ ...arrowStyle, right: '20px' }}
          aria-label="Next image"
        >
          →
        </button>
      )}
    </>
  )
}
