'use client'

import dynamic from 'next/dynamic'
import { useState, useRef, useEffect } from 'react'
import type { ImageSource } from '@/types/textile'

interface DynamicOptimizedImageProps {
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

// Dynamically import the full OptimizedImage component only when needed
const OptimizedImage = dynamic(
  () =>
    import('./OptimizedImage').then((mod) => ({ default: mod.OptimizedImage })),
  {
    loading: () => (
      <div
        className="image-loading-placeholder"
        style={{
          width: '100%',
          height: '200px',
          backgroundColor: '#f5f5f5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#666',
        }}
      >
        Loading image...
      </div>
    ),
    ssr: false,
  }
)

export function DynamicOptimizedImage(props: DynamicOptimizedImageProps) {
  const [shouldLoad, setShouldLoad] = useState(props.priority || false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (shouldLoad || props.priority) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true)
          observer.disconnect()
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px', // Load images slightly before they come into view
      }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [shouldLoad, props.priority])

  return (
    <div ref={ref} className={props.className} style={props.style}>
      {shouldLoad ? (
        <OptimizedImage {...props} />
      ) : (
        <div
          className="image-placeholder"
          style={{
            width: props.fill ? '100%' : props.width || 800,
            height: props.fill ? '100%' : props.height || 600,
            backgroundColor: '#f8f9fa',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#6c757d',
            fontSize: '14px',
          }}
        >
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            opacity="0.3"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21,15 16,10 5,21" />
          </svg>
        </div>
      )}
    </div>
  )
}
