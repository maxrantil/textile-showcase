'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { getOptimizedImageUrl, getBlurDataUrl } from '@/sanity/imageHelpers'
import { ImageLoadingPlaceholder } from './LoadingSpinner'
import type { SanityImageSource } from '@sanity/image-url/lib/types/types'

interface OptimizedImageProps {
  src: SanityImageSource | null | undefined
  alt: string
  width?: number
  height?: number
  className?: string
  style?: React.CSSProperties
  priority?: boolean
  sizes?: string
  quality?: number
  onClick?: () => void
  loading?: 'lazy' | 'eager'
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down'
  fill?: boolean
}

export function OptimizedImage({
  src,
  alt,
  width = 800,
  height = 600,
  className = '',
  style,
  priority = false,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 70vw, 50vw',
  quality = 85,
  onClick,
  objectFit = 'contain',
  fill = false,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isError, setIsError] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const imgRef = useRef<HTMLDivElement>(null)

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority) {
      setIsInView(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
      }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => observer.disconnect()
  }, [priority])

  // Generate optimized URLs
  const imageUrl = getOptimizedImageUrl(src, {
    width,
    height,
    quality,
    format: 'webp',
  })
  const blurDataUrl = getBlurDataUrl(src)

  // Handle click with proper event handling
  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault()
      onClick()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      onClick()
    }
  }

  return (
    <div
      ref={imgRef}
      className={`relative ${className}`}
      style={{
        width: fill ? '100%' : 'auto',
        height: fill ? '100%' : 'auto',
        ...style,
      }}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={onClick ? 0 : undefined}
      role={onClick ? 'button' : undefined}
      aria-label={onClick ? `View ${alt}` : alt}
    >
      {/* Loading placeholder */}
      {!isLoaded && !isError && (
        <ImageLoadingPlaceholder width="100%" height="100%" />
      )}

      {/* The actual image - only render when in view */}
      {isInView && imageUrl && (
        <>
          {fill ? (
            <Image
              src={imageUrl}
              alt={alt}
              fill
              loading={priority ? 'eager' : 'lazy'}
              priority={priority}
              sizes={sizes}
              placeholder={blurDataUrl ? 'blur' : 'empty'}
              blurDataURL={blurDataUrl}
              onLoad={() => setIsLoaded(true)}
              onError={() => setIsError(true)}
              style={{
                objectFit: objectFit,
                opacity: isLoaded ? 1 : 0,
                transition: 'opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              decoding="async"
            />
          ) : (
            <Image
              src={imageUrl}
              alt={alt}
              width={width}
              height={height}
              loading={priority ? 'eager' : 'lazy'}
              priority={priority}
              sizes={sizes}
              placeholder={blurDataUrl ? 'blur' : 'empty'}
              blurDataURL={blurDataUrl}
              onLoad={() => setIsLoaded(true)}
              onError={() => setIsError(true)}
              style={{
                objectFit: objectFit,
                opacity: isLoaded ? 1 : 0,
                transition: 'opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                ...(style || {}),
              }}
              decoding="async"
            />
          )}
        </>
      )}

      {/* Error state */}
      {isError && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: '#f5f5f5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            color: '#666',
          }}
        >
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            style={{ marginBottom: '8px', opacity: 0.5 }}
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21,15 16,10 5,21" />
          </svg>
          <span style={{ fontSize: '12px', textAlign: 'center' }}>
            Failed to load image
          </span>
        </div>
      )}

      {/* Loading indicator for interactive images */}
      {onClick && !isLoaded && !isError && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#666',
            fontSize: '12px',
            textAlign: 'center',
          }}
        >
          Loading...
        </div>
      )}
    </div>
  )
}
