'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { getOptimizedImageUrl } from '@/utils/image-helpers'
import { ImageLoadingPlaceholder } from './LoadingSpinner'
import type { ImageSource } from '@/types/textile'

interface OptimizedImageProps {
  src: ImageSource | null | undefined
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
  const [isInView, setIsInView] = useState(priority) // Start true if priority
  const [currentImageUrl, setCurrentImageUrl] = useState<string>('')
  const [usesFallback, setUsesFallback] = useState(false)
  const imgRef = useRef<HTMLDivElement>(null)

  // Generate image URLs - only if src exists
  const primaryImageUrl = src
    ? getOptimizedImageUrl(src, {
        width,
        height,
        quality,
        format: 'auto', // Use auto format detection
      })
    : ''

  const fallbackImageUrl = src
    ? getOptimizedImageUrl(src, {
        width,
        height,
        quality: 80, // Lower quality for fallback
        format: 'jpg', // Use JPG as fallback format
      })
    : ''

  const blurDataUrl = src
    ? getOptimizedImageUrl(src, {
        width: 20,
        height: 15,
        quality: 20, // Very low quality for blur
        format: 'jpg',
      })
    : ''

  // Set initial image URL
  useEffect(() => {
    setCurrentImageUrl(primaryImageUrl)
  }, [primaryImageUrl])

  // Intersection Observer for lazy loading - with fallback for lockdown mode
  useEffect(() => {
    if (priority || isInView) {
      return
    }

    // Fallback: if IntersectionObserver is not available or fails, load immediately
    if (typeof IntersectionObserver === 'undefined') {
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

    // Fallback timeout - if observer doesn't trigger within 3 seconds, load anyway
    const fallbackTimeout = setTimeout(() => {
      setIsInView(true)
      observer.disconnect()
    }, 3000)

    return () => {
      observer.disconnect()
      clearTimeout(fallbackTimeout)
    }
  }, [priority, isInView])

  // Handle image load error - try fallback format
  const handleImageError = () => {
    if (
      !usesFallback &&
      fallbackImageUrl &&
      fallbackImageUrl !== currentImageUrl
    ) {
      console.warn(`Primary image failed, trying fallback for: ${alt}`)
      setUsesFallback(true)
      setCurrentImageUrl(fallbackImageUrl)
      setIsError(false) // Reset error state to try again
    } else {
      console.error(`All image formats failed for: ${alt}`)
      setIsError(true)
    }
  }

  const handleImageLoad = () => {
    setIsLoaded(true)
    setIsError(false)
  }

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

      {/* The actual image - only render when in view and URL is available */}
      {isInView && currentImageUrl && (
        <>
          {fill ? (
            <Image
              src={currentImageUrl}
              alt={alt}
              fill
              loading={priority ? 'eager' : 'lazy'}
              priority={priority}
              sizes={sizes}
              placeholder={blurDataUrl ? 'blur' : 'empty'}
              blurDataURL={blurDataUrl}
              onLoad={handleImageLoad}
              onError={handleImageError}
              style={{
                objectFit: objectFit,
                opacity: isLoaded ? 1 : 0,
                transition: 'opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              decoding="async"
            />
          ) : (
            <Image
              src={currentImageUrl}
              alt={alt}
              width={width}
              height={height}
              loading={priority ? 'eager' : 'lazy'}
              priority={priority}
              sizes={sizes}
              placeholder={blurDataUrl ? 'blur' : 'empty'}
              blurDataURL={blurDataUrl}
              onLoad={handleImageLoad}
              onError={handleImageError}
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

      {/* Error state with retry option */}
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
            padding: '16px',
            textAlign: 'center',
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
          <span style={{ fontSize: '12px', marginBottom: '8px' }}>
            Failed to load image
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setIsError(false)
              setIsLoaded(false)
              setUsesFallback(false)
              setCurrentImageUrl(primaryImageUrl)
            }}
            style={{
              padding: '4px 8px',
              fontSize: '10px',
              background: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Debug info in development */}
      {process.env.NODE_ENV === 'development' && usesFallback && (
        <div
          style={{
            position: 'absolute',
            top: '4px',
            left: '4px',
            background: 'orange',
            color: 'white',
            fontSize: '10px',
            padding: '2px 4px',
            borderRadius: '2px',
            zIndex: 10,
          }}
        >
          FALLBACK
        </div>
      )}
    </div>
  )
}
