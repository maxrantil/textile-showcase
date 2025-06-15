// src/components/mobile/Gallery/MobileGalleryIndicators.tsx
'use client'

interface MobileGalleryIndicatorsProps {
  total: number
  current: number
  onDotClick: (index: number) => void
}

export function MobileGalleryIndicators({
  total,
  current,
  onDotClick,
}: MobileGalleryIndicatorsProps) {
  const maxDots = 8
  const showDots = Math.min(total, maxDots)

  return (
    <div className="mobile-gallery-indicators">
      {Array.from({ length: showDots }, (_, index) => (
        <button
          key={index}
          className={`indicator-dot ${index === current ? 'active' : ''}`}
          onClick={() => onDotClick(index)}
          aria-label={`Go to image ${index + 1}`}
        />
      ))}

      {total > maxDots && (
        <span className="indicator-counter">
          {current + 1}/{total}
        </span>
      )}
    </div>
  )
}
