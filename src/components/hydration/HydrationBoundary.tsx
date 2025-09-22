// ABOUTME: Progressive hydration boundary component
// Wrapper component that manages when child components hydrate

'use client'

import { useState, useEffect, useRef } from 'react'
import type { JSX } from 'react'
import {
  HydrationScheduler,
  HydrationPriority,
} from '@/utils/progressive-hydration'
import type { HydrationBoundaryProps } from './types'

export function HydrationBoundary({
  children,
  priority,
  trigger = 'immediate',
  fallback: Fallback,
  delay,
  rootMargin,
  threshold,
  onHydrationComplete,
  onError,
}: HydrationBoundaryProps): JSX.Element {
  const [isHydrated, setIsHydrated] = useState(false)
  const [hasError, setHasError] = useState(false)
  const schedulerRef = useRef<HydrationScheduler | null>(null)
  const elementRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const scheduler = new HydrationScheduler({})
    schedulerRef.current = scheduler

    const hydrateComponent = async () => {
      try {
        // Generate unique component ID
        const componentId = `component-${Date.now()}-${Math.random()}`

        await scheduler.hydrate(componentId, {
          priority,
          trigger,
          delay,
          rootMargin,
          threshold,
          onHydrated: () => {
            setIsHydrated(true)
            onHydrationComplete?.()
          },
          onError: (error) => {
            setHasError(true)
            onError?.(error)
          },
        })
      } catch (error) {
        setHasError(true)
        onError?.(error as Error)
      }
    }

    // Handle different trigger types
    if (trigger === 'immediate' || priority === HydrationPriority.CRITICAL) {
      hydrateComponent()
    } else if (trigger === 'intersection') {
      // Setup intersection observer
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) {
            hydrateComponent()
            observer.disconnect()
          }
        },
        {
          rootMargin: rootMargin || '200px',
          threshold: threshold || 0.01,
        }
      )

      if (elementRef.current) {
        observer.observe(elementRef.current)
      }

      return () => observer.disconnect()
    } else if (trigger === 'interaction') {
      // Setup interaction listeners
      const handleInteraction = () => {
        hydrateComponent()
        document.removeEventListener('click', handleInteraction)
        document.removeEventListener('touchstart', handleInteraction)
        document.removeEventListener('keydown', handleInteraction)
      }

      document.addEventListener('click', handleInteraction)
      document.addEventListener('touchstart', handleInteraction)
      document.addEventListener('keydown', handleInteraction)

      return () => {
        document.removeEventListener('click', handleInteraction)
        document.removeEventListener('touchstart', handleInteraction)
        document.removeEventListener('keydown', handleInteraction)
      }
    } else if (trigger === 'idle') {
      // Setup idle callback
      if (typeof requestIdleCallback !== 'undefined') {
        requestIdleCallback(() => hydrateComponent())
      } else {
        setTimeout(() => hydrateComponent(), 1000)
      }
    }

    return () => {
      if (schedulerRef.current) {
        schedulerRef.current.cleanup()
      }
    }
  }, [
    priority,
    trigger,
    delay,
    rootMargin,
    threshold,
    onHydrationComplete,
    onError,
  ])

  // Error boundary fallback
  if (hasError && Fallback) {
    return <Fallback />
  }

  // Show fallback while not hydrated
  if (!isHydrated && Fallback) {
    return <Fallback />
  }

  // Render children with hydration control
  return (
    <div ref={elementRef} suppressHydrationWarning={!isHydrated}>
      {children}
    </div>
  )
}
