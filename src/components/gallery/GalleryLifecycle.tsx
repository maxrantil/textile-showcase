// src/components/gallery/GalleryLifecycle.tsx
'use client'
import { useEffect } from 'react'
import { scrollManager } from '@/lib/scrollManager'
import { logMemoryUsage } from '@/utils/performance'
import { TextileDesign } from '@/sanity/types'

interface ScrollRestoration {
  isRestoring: boolean
  restorationAttempted: boolean
  attemptRestoration: (
    scrollToIndex: (index: number, instant?: boolean) => void
  ) => void
  markRestored: () => void
}

interface GalleryLifecycleProps {
  pathname: string
  designs: TextileDesign[]
  restoration: ScrollRestoration
  scrollContainerRef: React.RefObject<HTMLDivElement | null>
  scrollToIndex: (index: number, instant?: boolean) => void
  setCurrentIndex: (index: number) => void
  realTimeCurrentIndex: React.MutableRefObject<number>
  markFirstMountComplete: () => void
}

export function useGalleryLifecycle({
  pathname,
  designs,
  restoration,
  scrollContainerRef,
  scrollToIndex,
  setCurrentIndex,
  realTimeCurrentIndex,
  markFirstMountComplete,
}: GalleryLifecycleProps) {
  // Handle restoration when component mounts
  useEffect(() => {
    if (!scrollContainerRef.current || designs.length === 0) return

    scrollContainerRef.current.setAttribute('data-scroll-container', 'true')
    scrollContainerRef.current.setAttribute('data-current-index', '0')

    const attemptRestore = () => {
      restoration.attemptRestoration((index: number, instant?: boolean) => {
        setCurrentIndex(index)
        realTimeCurrentIndex.current = index
        scrollContainerRef.current?.setAttribute(
          'data-current-index',
          index.toString()
        )
        scrollToIndex(index, instant)
      })
    }

    attemptRestore()
  }, [
    pathname,
    designs.length,
    scrollToIndex,
    setCurrentIndex,
    restoration,
    scrollContainerRef,
    realTimeCurrentIndex,
  ])

  // Reset state on pathname change
  useEffect(() => {
    realTimeCurrentIndex.current = 0
  }, [pathname, realTimeCurrentIndex])

  // Index saving on scroll changes
  useEffect(() => {
    if (!restoration.restorationAttempted) return

    let isNavigating = false
    const stopSaving = () => {
      isNavigating = true
    }
    const resumeSaving = () => {
      setTimeout(() => {
        isNavigating = false
      }, 200)
    }

    window.addEventListener('gallery-navigation-start', stopSaving)
    window.addEventListener('gallery-navigation-complete', resumeSaving)

    if (!isNavigating) {
      scrollManager.save(realTimeCurrentIndex.current, pathname)
    }

    return () => {
      window.removeEventListener('gallery-navigation-start', stopSaving)
      window.removeEventListener('gallery-navigation-complete', resumeSaving)
      if (!isNavigating) {
        scrollManager.saveImmediate(realTimeCurrentIndex.current, pathname)
      }
    }
  }, [pathname, restoration.restorationAttempted, realTimeCurrentIndex])

  // Memory monitoring in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      logMemoryUsage('Gallery mounted')
      const interval = setInterval(() => {
        logMemoryUsage('Gallery active')
      }, 10000)

      return () => {
        clearInterval(interval)
        logMemoryUsage('Gallery unmounted')
      }
    }
  }, [])

  // Mark first mount complete
  useEffect(() => {
    const timer = setTimeout(() => {
      markFirstMountComplete()
    }, 1000)
    return () => clearTimeout(timer)
  }, [markFirstMountComplete])
}
