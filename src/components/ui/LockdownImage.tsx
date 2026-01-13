// src/components/ui/LockdownImage.tsx
'use client'

import { getSimpleImageUrl } from '@/utils/image-helpers'
import type { ImageSource } from '@/types/textile'

interface LockdownImageProps {
  src: ImageSource | string | null | undefined
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

  const imageUrl = getSimpleImageUrl(src)

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
        crossOrigin="anonymous"
      />
    </div>
  )
}
