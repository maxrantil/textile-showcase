'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'

interface ResponsiveImageProps {
  src: string
  alt: string
  width: number
  height: number
  className?: string
  style?: React.CSSProperties
  priority?: boolean
  quality?: number
  onClick?: () => void
  sizes?: string
  webpSrc?: string // Optional WebP source
}

export function ResponsiveImage({
  src,
  alt,
  width,
  height,
  className = '',
  style,
  priority = false,
  quality = 85,
  onClick,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 70vw, 50vw',
  webpSrc,
}: ResponsiveImageProps) {
  const [imageFormat, setImageFormat] = useState<'webp' | 'original'>('webp')
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInView, setIsInView] = useState(priority)
  const imgRef = useRef<HTMLDivElement>(null)

  // Check WebP support
  useEffect(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 1
    canvas.height = 1
    const ctx = canvas.getContext('2d')

    if (ctx) {
      const webpSupported =
        canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0
      if (!webpSupported || !webpSrc) {
        setImageFormat('original')
      }
    } else {
      setImageFormat('original')
    }
  }, [webpSrc])

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || isInView) return

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
  }, [priority, isInView])

  const imageSrc = imageFormat === 'webp' && webpSrc ? webpSrc : src

  return (
    <div
      ref={imgRef}
      className={`relative ${className}`}
      style={style}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* Lazy loading placeholder */}
      {!isLoaded && (
        <div
          className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center"
          style={{
            width: '100%',
            height: '100%',
          }}
        >
          <svg
            className="w-8 h-8 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      )}

      {/* Actual image - only load when in view */}
      {isInView && (
        <Image
          src={imageSrc}
          alt={alt}
          width={width}
          height={height}
          quality={quality}
          priority={priority}
          loading={priority ? 'eager' : 'lazy'}
          sizes={sizes}
          className={`transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setIsLoaded(true)}
          onError={() => {
            // Fallback to original format if WebP fails
            if (imageFormat === 'webp') {
              setImageFormat('original')
            }
          }}
          style={{
            objectFit: 'cover',
            width: '100%',
            height: 'auto',
          }}
        />
      )}
    </div>
  )
}
