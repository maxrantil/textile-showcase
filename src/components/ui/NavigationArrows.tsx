// src/components/ui/NavigationArrows.tsx - Fixed version for both gallery and project pages
'use client'

import { memo } from 'react'

interface NavigationArrowsProps {
  canScrollLeft: boolean
  canScrollRight: boolean
  onScrollLeft: () => void
  onScrollRight: () => void
  variant?: 'gallery' | 'project'
  size?: 'small' | 'medium' | 'large'
  position?: 'static' | 'fixed'
  showOnMobile?: boolean // Add this prop to control mobile visibility
}

const NavigationArrows = memo(function NavigationArrows({
  canScrollLeft,
  canScrollRight,
  onScrollLeft,
  onScrollRight,
  size = 'large',
  position = 'fixed',
  showOnMobile = false, // Default to false for gallery, true for project
}: NavigationArrowsProps) {
  // Size configurations
  const sizeConfig = {
    small: {
      triangleSize: 16,
      clickableWidth: 80,
      padding: 15,
    },
    medium: {
      triangleSize: 24,
      clickableWidth: 100,
      padding: 20,
    },
    large: {
      triangleSize: 32,
      clickableWidth: 120,
      padding: 25,
    },
  }

  const config = sizeConfig[size]
  const triangleSize = config.triangleSize

  // Triangle components - EXACT same look as before
  const LeftTriangle = ({ size, color }: { size: number; color: string }) => (
    <div
      style={{
        width: 0,
        height: 0,
        borderTop: `${Math.round(size * 1.5)}px solid transparent`,
        borderBottom: `${Math.round(size * 1.5)}px solid transparent`,
        borderRight: `${Math.round(size * 1.5)}px solid ${color}`,
        transition: 'border-color 0.2s ease',
      }}
      aria-hidden="true"
    />
  )

  const RightTriangle = ({ size, color }: { size: number; color: string }) => (
    <div
      style={{
        width: 0,
        height: 0,
        borderTop: `${Math.round(size * 1.5)}px solid transparent`,
        borderBottom: `${Math.round(size * 1.5)}px solid transparent`,
        borderLeft: `${Math.round(size * 1.5)}px solid ${color}`,
        transition: 'border-color 0.2s ease',
      }}
      aria-hidden="true"
    />
  )

  // Consistent styling for both gallery and project pages
  const getClickableAreaStyle = (
    side: 'left' | 'right'
  ): React.CSSProperties => ({
    position: position,
    top: 0,
    bottom: 0,
    width: `${config.clickableWidth}px`,
    height: position === 'fixed' ? '100vh' : '100%',
    [side]: 0,
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: side === 'left' ? 'flex-start' : 'flex-end',
    paddingLeft: side === 'left' ? `${config.padding}px` : 0,
    paddingRight: side === 'right' ? `${config.padding}px` : 0,
    zIndex: 40, // Below header but above content
    outline: 'none',
    WebkitTapHighlightColor: 'transparent',
    userSelect: 'none',
    // Always visible like before
    opacity: 1,
    transition: 'none', // No fade transitions like before
  })

  // Triangle colors - EXACT same as before
  const triangleColor = '#f1f1f1' // Original grey color
  const triangleColorHover = '#e6e6e6' // Original hover grey

  // Fixed: Separate handlers for mouse and touch events
  const handleMouseInteractionStart = (
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    const triangle = e.currentTarget.querySelector('div') as HTMLElement
    if (triangle) {
      if (triangle.style.borderRight) {
        triangle.style.borderRightColor = triangleColorHover
      }
      if (triangle.style.borderLeft) {
        triangle.style.borderLeftColor = triangleColorHover
      }
    }
  }

  const handleMouseInteractionEnd = (
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    const triangle = e.currentTarget.querySelector('div') as HTMLElement
    if (triangle) {
      if (triangle.style.borderRight) {
        triangle.style.borderRightColor = triangleColor
      }
      if (triangle.style.borderLeft) {
        triangle.style.borderLeftColor = triangleColor
      }
    }
  }

  // Touch event handlers with correct typing
  const handleTouchStart = (e: React.TouchEvent<HTMLButtonElement>) => {
    const triangle = e.currentTarget.querySelector('div') as HTMLElement
    if (triangle) {
      if (triangle.style.borderRight) {
        triangle.style.borderRightColor = triangleColorHover
      }
      if (triangle.style.borderLeft) {
        triangle.style.borderLeftColor = triangleColorHover
      }
    }
  }

  const handleTouchEnd = (e: React.TouchEvent<HTMLButtonElement>) => {
    const triangle = e.currentTarget.querySelector('div') as HTMLElement
    if (triangle) {
      if (triangle.style.borderRight) {
        triangle.style.borderRightColor = triangleColor
      }
      if (triangle.style.borderLeft) {
        triangle.style.borderLeftColor = triangleColor
      }
    }
  }

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    action: () => void
  ) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      action()
    }
  }

  return (
    <>
      {/* Left Navigation Area - Only render if navigation is possible */}
      {canScrollLeft && (
        <button
          onClick={onScrollLeft}
          onMouseEnter={handleMouseInteractionStart}
          onMouseLeave={handleMouseInteractionEnd}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          style={getClickableAreaStyle('left')}
          aria-label="Previous image"
          type="button"
          onKeyDown={(e) => handleKeyDown(e, onScrollLeft)}
          data-nav="left"
          className={showOnMobile ? 'nav-show-mobile' : 'nav-hide-mobile'}
        >
          <LeftTriangle size={triangleSize} color={triangleColor} />
        </button>
      )}

      {/* Right Navigation Area - Only render if navigation is possible */}
      {canScrollRight && (
        <button
          onClick={onScrollRight}
          onMouseEnter={handleMouseInteractionStart}
          onMouseLeave={handleMouseInteractionEnd}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          style={getClickableAreaStyle('right')}
          aria-label="Next image"
          type="button"
          onKeyDown={(e) => handleKeyDown(e, onScrollRight)}
          data-nav="right"
          className={showOnMobile ? 'nav-show-mobile' : 'nav-hide-mobile'}
        >
          <RightTriangle size={triangleSize} color={triangleColor} />
        </button>
      )}

      {/* CSS for responsiveness and mobile control */}
      <style jsx>{`
        /* Default: Hide on mobile unless explicitly shown */
        .nav-hide-mobile {
          display: flex;
        }

        .nav-show-mobile {
          display: flex;
        }

        @media (max-width: 767px) {
          .nav-hide-mobile {
            display: none !important;
          }

          .nav-show-mobile {
            display: flex !important;
          }
        }

        /* Responsive scaling using CSS transforms */
        @media (max-width: 1023px) {
          [data-nav] {
            transform: scale(0.85);
          }
        }

        @media (max-width: 767px) {
          [data-nav] {
            transform: scale(0.7);
          }
        }

        @media (max-width: 480px) {
          [data-nav] {
            transform: scale(0.6);
          }
        }

        /* High contrast mode support */
        @media (prefers-contrast: high) {
          [data-nav] div {
            filter: contrast(2);
          }
        }

        /* Focus visibility for accessibility */
        [data-nav]:focus-visible {
          outline: 2px solid #0066cc;
          outline-offset: 2px;
        }
      `}</style>
    </>
  )
})

export default NavigationArrows
