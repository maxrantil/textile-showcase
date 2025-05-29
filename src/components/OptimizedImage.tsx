'use client'

import { useState } from 'react'
import Image from 'next/image'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  style?: React.CSSProperties
}

export default function OptimizedImage({
  src,
  alt,
  width = 800,
  height = 800,
  className = '',
  style
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isError, setIsError] = useState(false)

  // Don't modify the src - it's already optimized by urlFor()
  const imageUrl = src

  return (
    <div className={`relative overflow-hidden ${className}`} style={style}>
      {/* Loading placeholder */}
      {!isLoaded && !isError && (
        <div 
          className="absolute inset-0 bg-gray-100 animate-pulse"
          style={{ width: '100%', height: '100%' }}
        />
      )}

      {/* The actual image */}
      <Image
        src={imageUrl}
        alt={alt}
        width={width}
        height={height}
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
        onError={() => setIsError(true)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: isLoaded ? 1 : 0,
          transition: 'opacity 0.6s ease',
          ...style
        }}
      />

      {/* Error state */}
      {isError && (
        <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
          <span className="text-gray-500 text-sm">Failed to load image</span>
        </div>
      )}
    </div>
  )
}
