// src/components/ui/LockdownImage.tsx
'use client'

import { getSimpleImageUrl } from '@/sanity/imageHelpers'
import type { SanityImageSource } from '@sanity/image-url/lib/types/types'

interface LockdownImageProps {
  src: SanityImageSource | null | undefined
  alt: string
  className?: string
  style?: React.CSSProperties
  onClick?: () => void
}

export function LockdownImage({
  src,
  alt,
  className = '',
  style,
  onClick,
}: LockdownImageProps) {
  if (!src) return null

  const imageUrl = getSimpleImageUrl(src, 800)

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault()
      onClick()
    }
  }

  return (
    <div
      className={`relative ${className}`}
      style={style}
      onClick={handleClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* Use regular img tag instead of Next.js Image for maximum compatibility */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt={alt}
        style={{
          width: '100%',
          height: 'auto',
          display: 'block',
          objectFit: 'cover',
        }}
        loading="lazy"
        decoding="async"
      />
    </div>
  )
}
