// ABOUTME: Optimized image component with lazy loading, error handling, blur placeholder, and priority detection

'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { getOptimizedImageUrl } from '@/utils/image-helpers'
import { ImageLoadingPlaceholder } from './LoadingSpinner'
import {
  getImagePriority,
  shouldPreloadImage,
  getOptimizedObserverConfig,
  type ImageType,
} from '@/utils/image-optimization'
import type { ImageSource } from '@/types/textile'
import {
  FALLBACK_TIMEOUT_MS,
  FALLBACK_IMAGE_QUALITY,
  BLUR_PLACEHOLDER_QUALITY,
  BLUR_WIDTH,
  BLUR_HEIGHT,
  LARGE_IMAGE_THRESHOLD,
} from './OptimizedImage.constants'
import styles from './OptimizedImage.module.css'

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
  fetchPriority?: 'high' | 'low' | 'auto'
  imageType?: ImageType
  isAboveFold?: boolean
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
  fetchPriority,
  imageType = 'gallery',
  isAboveFold = false,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isError, setIsError] = useState(false)
  const [isInView, setIsInView] = useState(priority) // Start true if priority
  const [currentImageUrl, setCurrentImageUrl] = useState<string>('')
  const [usesFallback, setUsesFallback] = useState(false)
  const imgRef = useRef<HTMLDivElement>(null)

  // Enhanced optimization: determine priority and preload settings
  const optimizedFetchPriority =
    fetchPriority || getImagePriority(imageType, isAboveFold)
  const shouldPreload = shouldPreloadImage(imageType, isAboveFold)
  const observerConfig = getOptimizedObserverConfig()

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
        quality: FALLBACK_IMAGE_QUALITY,
        format: 'jpg', // Use JPG as fallback format
      })
    : ''

  const blurDataUrl = src
    ? getOptimizedImageUrl(src, {
        width: BLUR_WIDTH,
        height: BLUR_HEIGHT,
        quality: BLUR_PLACEHOLDER_QUALITY,
        format: 'jpg',
      })
    : ''

  // Set initial image URL
  useEffect(() => {
    setCurrentImageUrl(primaryImageUrl)
  }, [primaryImageUrl])

  // Enhanced Intersection Observer with optimized configuration
  useEffect(() => {
    if (priority || isInView) {
      return
    }

    // Fallback: if IntersectionObserver is not available or fails, load immediately
    if (typeof IntersectionObserver === 'undefined') {
      setIsInView(true)
      return
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsInView(true)
        observer.disconnect()
      }
    }, observerConfig)

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    // Fallback timeout - if observer doesn't trigger, load anyway
    const fallbackTimeout = setTimeout(() => {
      setIsInView(true)
      observer.disconnect()
    }, FALLBACK_TIMEOUT_MS)

    return () => {
      observer.disconnect()
      clearTimeout(fallbackTimeout)
    }
  }, [priority, isInView, observerConfig])

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
      className={`relative ${fill ? styles.containerFill : styles.containerAuto} ${className}`}
      style={style}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={onClick ? 0 : undefined}
      role={onClick ? 'button' : undefined}
      aria-label={onClick ? `View ${alt}` : alt}
      data-image-type={imageType}
      data-size={width > LARGE_IMAGE_THRESHOLD ? 'large' : 'small'}
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
              loading={priority || shouldPreload ? 'eager' : 'lazy'}
              priority={priority || shouldPreload}
              sizes={sizes}
              placeholder={blurDataUrl ? 'blur' : 'empty'}
              blurDataURL={blurDataUrl}
              onLoad={handleImageLoad}
              onError={handleImageError}
              className={isLoaded ? styles.fadeInLoaded : styles.fadeIn}
              style={{ objectFit }}
              decoding="async"
              // Enhanced resource hint for performance optimization
              {...({ fetchpriority: optimizedFetchPriority } as Record<
                string,
                string
              >)}
            />
          ) : (
            <Image
              src={currentImageUrl}
              alt={alt}
              width={width}
              height={height}
              loading={priority || shouldPreload ? 'eager' : 'lazy'}
              priority={priority || shouldPreload}
              sizes={sizes}
              placeholder={blurDataUrl ? 'blur' : 'empty'}
              blurDataURL={blurDataUrl}
              onLoad={handleImageLoad}
              onError={handleImageError}
              className={isLoaded ? styles.fadeInLoaded : styles.fadeIn}
              style={{ objectFit, ...style }}
              decoding="async"
              // Enhanced resource hint for performance optimization
              {...({ fetchpriority: optimizedFetchPriority } as Record<
                string,
                string
              >)}
            />
          )}
        </>
      )}

      {/* Error state with retry option */}
      {isError && (
        <div className={styles.errorContainer}>
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            className={styles.errorIcon}
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21,15 16,10 5,21" />
          </svg>
          <span className={styles.errorText}>Failed to load image</span>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setIsError(false)
              setIsLoaded(false)
              setUsesFallback(false)
              setCurrentImageUrl(primaryImageUrl)
            }}
            className={styles.retryButton}
          >
            Retry
          </button>
        </div>
      )}

      {/* Debug info in development */}
      {process.env.NODE_ENV === 'development' && (
        <div
          className={`${styles.debugPriority} ${
            optimizedFetchPriority === 'high'
              ? styles.debugPriorityHigh
              : optimizedFetchPriority === 'low'
                ? styles.debugPriorityLow
                : styles.debugPriorityAuto
          }`}
        >
          {optimizedFetchPriority.toUpperCase()}
        </div>
      )}

      {process.env.NODE_ENV === 'development' && usesFallback && (
        <div className={styles.debugFallback}>FALLBACK</div>
      )}
    </div>
  )
}
