// Update src/hooks/useHorizontalScroll.ts
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
  const isUpdatingRef = useRef(false)

  const checkScrollPosition = useCallback(() => {
    const container = scrollContainerRef.current
    if (!container || isUpdatingRef.current) return

    const { scrollLeft, scrollWidth, clientWidth } = container
    setCanScrollLeft(scrollLeft > 10)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
    
    // Calculate current index based on which item is most centered in viewport
    // Your gallery: 70vw items, 40px gaps, 15vw padding on each side
    const viewportCenter = scrollLeft + (clientWidth / 2)
    const paddingLeft = clientWidth * 0.15 // 15vw left padding
    const itemWidth = clientWidth * 0.7 // 70vw item width
    const gapWidth = 40 // 40px gap
    const itemPlusGap = itemWidth + gapWidth
    
    // Find which item center is closest to viewport center
    let closestIndex = 0
    let closestDistance = Infinity
    
    for (let i = 0; i < itemCount; i++) {
      // Calculate the center position of each item
      const itemCenter = paddingLeft + (i * itemPlusGap) + (itemWidth / 2)
      const distance = Math.abs(viewportCenter - itemCenter)
      
      if (distance < closestDistance) {
        closestDistance = distance
        closestIndex = i
      }
    }
    
    console.log('Scroll calculation:', {
      scrollLeft,
      viewportCenter,
      paddingLeft,
      itemWidth,
      closestIndex,
      currentIndex
    })
    
    if (closestIndex !== currentIndex) {
      console.log('Index changed from', currentIndex, 'to', closestIndex)
      setCurrentIndex(closestIndex)
      onIndexChange?.(closestIndex)
    }
  }, [itemCount, currentIndex, onIndexChange])

  const scrollToImage = useCallback((direction: 'left' | 'right') => {
    const container = scrollContainerRef.current
    if (!container) return

    isUpdatingRef.current = true
    
    // Calculate scroll amount based on viewport width
    const scrollAmount = container.clientWidth * 0.75
    const targetScroll = direction === 'left' 
      ? Math.max(0, container.scrollLeft - scrollAmount)
      : container.scrollLeft + scrollAmount

    container.scrollTo({ 
      left: targetScroll, 
      behavior: 'smooth' 
    })

    // Reset the updating flag after animation
    setTimeout(() => {
      isUpdatingRef.current = false
      checkScrollPosition()
    }, 500)
  }, [checkScrollPosition])

  const scrollToIndex = useCallback((index: number) => {
    const container = scrollContainerRef.current
    if (!container || index < 0 || index >= itemCount) return

    isUpdatingRef.current = true
    
    const { clientWidth, scrollWidth } = container
    const totalPadding = clientWidth * 0.3
    const itemWidth = (scrollWidth - totalPadding) / itemCount
    const targetScroll = (itemWidth * index) + (totalPadding * 0.5)

    container.scrollTo({ 
      left: targetScroll, 
      behavior: 'smooth' 
    })

    setTimeout(() => {
      isUpdatingRef.current = false
      checkScrollPosition()
    }, 500)
  }, [itemCount, checkScrollPosition])

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    // Throttled scroll handler for better performance
    let ticking = false
    const handleScroll = () => {
      if (!ticking && !isUpdatingRef.current) {
        requestAnimationFrame(() => {
          checkScrollPosition()
          ticking = false
        })
        ticking = true
      }
    }

    // Initial check
    checkScrollPosition()
    
    container.addEventListener('scroll', handleScroll, { passive: true })
    
    // Handle window resize
    const handleResize = () => {
      if (!isUpdatingRef.current) {
        checkScrollPosition()
      }
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
