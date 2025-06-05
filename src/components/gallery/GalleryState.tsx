// src/components/gallery/GalleryState.tsx
'use client'

import { useState, useRef, useCallback } from 'react'
import { useScrollRestoration } from '@/hooks/gallery/useScrollRestoration'
import { useHorizontalScroll } from '@/hooks/useHorizontalScroll'
import { TextileDesign } from '@/sanity/types'

interface GalleryStateProps {
  designs: TextileDesign[]
  pathname: string
}

export function useGalleryState({ designs, pathname }: GalleryStateProps) {
  const realTimeCurrentIndex = useRef(0)
  const isFirstMount = useRef(true)
  const [isMobile, setIsMobile] = useState(false)

  // Restoration logic
  const restoration = useScrollRestoration(pathname, designs.length)

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
      realTimeCurrentIndex.current = index
      if (scrollContainerRef.current) {
        scrollContainerRef.current.setAttribute('data-current-index', index.toString())
      }
    }
  })

  const updateMobileState = useCallback((mobile: boolean) => {
    setIsMobile(mobile)
  }, [])

  const markFirstMountComplete = useCallback(() => {
    isFirstMount.current = false
  }, [])

  return {
    // Refs
    realTimeCurrentIndex,
    isFirstMount,
    scrollContainerRef,
    
    // State
    isMobile,
    currentIndex,
    canScrollLeft,
    canScrollRight,
    
    // Restoration
    restoration,
    
    // Actions
    setCurrentIndex,
    scrollToImage,
    scrollToIndex,
    updateMobileState,
    markFirstMountComplete,
  }
}
