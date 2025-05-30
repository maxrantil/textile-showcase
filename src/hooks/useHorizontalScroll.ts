'use client'

import { useRef, useState, useEffect, useCallback } from 'react'

interface UseHorizontalScrollProps {
  itemCount: number
  onIndexChange?: (index: number) => void
}

export function useHorizontalScroll({ itemCount, onIndexChange }: UseHorizontalScrollProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)

  const checkScrollPosition = useCallback(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const { scrollLeft, scrollWidth, clientWidth } = container
    setCanScrollLeft(scrollLeft > 10)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
    
    // Calculate current index based on scroll position
    const itemWidth = container.scrollWidth / itemCount
    const newIndex = Math.round(scrollLeft / itemWidth)
    
    if (newIndex !== currentIndex) {
      setCurrentIndex(newIndex)
      onIndexChange?.(newIndex)
    }
  }, [itemCount, currentIndex, onIndexChange])

  const scrollToImage = useCallback((direction: 'left' | 'right') => {
    const container = scrollContainerRef.current
    if (!container) return

    const scrollAmount = container.clientWidth * 0.85
    const targetScroll = direction === 'left' 
      ? container.scrollLeft - scrollAmount
      : container.scrollLeft + scrollAmount

    container.scrollTo({ left: targetScroll, behavior: 'smooth' })
  }, [])

  const scrollToIndex = useCallback((index: number) => {
    const container = scrollContainerRef.current
    if (!container || index < 0 || index >= itemCount) return

    const itemWidth = container.scrollWidth / itemCount
    const targetScroll = itemWidth * index

    container.scrollTo({ left: targetScroll, behavior: 'smooth' })
  }, [itemCount])

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    // Throttled scroll handler for better performance
    let ticking = false
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          checkScrollPosition()
          ticking = false
        })
        ticking = true
      }
    }

    checkScrollPosition()
    container.addEventListener('scroll', handleScroll, { passive: true })
    
    // Handle window resize
    const handleResize = () => {
      checkScrollPosition()
    }
    window.addEventListener('resize', handleResize)
    
    return () => {
      container.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleResize)
    }
  }, [checkScrollPosition])

  return {
    scrollContainerRef,
    canScrollLeft,
    canScrollRight,
    currentIndex,
    scrollToImage,
    scrollToIndex,
  }
}
