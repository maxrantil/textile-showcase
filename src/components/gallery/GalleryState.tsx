// src/components/gallery/GalleryState.tsx - Fixed to use state instead of refs
'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useHorizontalScroll } from '@/hooks/useHorizontalScroll'
import { scrollManager } from '@/lib/scrollManager'
import { TextileDesign } from '@/sanity/types'

interface GalleryStateProps {
  designs: TextileDesign[]
  pathname: string
}

export function useGalleryState({ designs, pathname }: GalleryStateProps) {
  // Use state instead of ref for current index
  const [realTimeCurrentIndex, setRealTimeCurrentIndex] = useState(0)
  const isFirstMount = useRef(true)
  const hasRestored = useRef(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isRestoring, setIsRestoring] = useState(true)

  // Scroll management
  const {
    scrollContainerRef,
    canScrollLeft,
    canScrollRight,
    currentIndex,
    setCurrentIndex,
    scrollToImage,
    scrollToIndex,
  } = useHorizontalScroll({
    itemCount: designs.length,
    onIndexChange: (index: number) => {
      // Update both state and container attribute
      setRealTimeCurrentIndex(index)
      if (scrollContainerRef.current) {
        scrollContainerRef.current.setAttribute(
          'data-current-index',
          index.toString()
        )
      }

      // Save position using scroll manager (debounced)
      if (hasRestored.current && !isFirstMount.current) {
        scrollManager.save(index, pathname)
      }
    },
  })

  // Sync currentIndex with realTimeCurrentIndex
  useEffect(() => {
    setRealTimeCurrentIndex(currentIndex)
  }, [currentIndex])

  // Enhanced restoration on mount
  useEffect(() => {
    if (designs.length === 0 || hasRestored.current) return

    const restorePosition = async () => {
      try {
        const savedIndex = await scrollManager.restore(pathname)

        if (
          savedIndex !== null &&
          savedIndex >= 0 &&
          savedIndex < designs.length
        ) {
          // Restore to saved position
          setTimeout(() => {
            scrollToIndex(savedIndex, true)
            setCurrentIndex(savedIndex)
            setRealTimeCurrentIndex(savedIndex)
            hasRestored.current = true
            setIsRestoring(false)

            if (process.env.NODE_ENV === 'development') {
              console.log(`✅ Restored gallery to index ${savedIndex}`)
            }
          }, 150)
        } else {
          // Start from beginning
          hasRestored.current = true
          setIsRestoring(false)
        }
      } catch (error) {
        console.warn('Failed to restore scroll position:', error)
        hasRestored.current = true
        setIsRestoring(false)
      }
    }

    restorePosition()
  }, [
    pathname,
    designs.length,
    scrollToIndex,
    setCurrentIndex,
    scrollContainerRef,
  ])

  const updateMobileState = useCallback((mobile: boolean) => {
    setIsMobile(mobile)
  }, [])

  const markFirstMountComplete = useCallback(() => {
    isFirstMount.current = false
  }, [])

  return {
    // State instead of refs
    realTimeCurrentIndex,
    setRealTimeCurrentIndex,
    isFirstMount,
    scrollContainerRef,

    // State
    isMobile,
    currentIndex,
    canScrollLeft,
    canScrollRight,

    // Restoration state
    restoration: {
      isRestoring,
      restorationAttempted: hasRestored.current,
      attemptRestoration: () => {}, // No-op since we handle it above
      markRestored: () => {
        hasRestored.current = true
        setIsRestoring(false)
      },
    },

    // Actions
    setCurrentIndex,
    scrollToImage,
    scrollToIndex,
    updateMobileState,
    markFirstMountComplete,
  }
}
