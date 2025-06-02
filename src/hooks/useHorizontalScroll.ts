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
    
    // Get all items and their positions
    const items = container.children
    if (items.length === 0) return
    
    const viewportCenter = scrollLeft + (clientWidth / 2)
    let closestIndex = 0
    let closestDistance = Infinity
    
    // Create detailed position info for all items
    const itemPositions = []
    for (let i = 0; i < items.length && i < itemCount; i++) {
      const item = items[i] as HTMLElement
      const offsetLeft = item.offsetLeft
      const offsetWidth = item.offsetWidth
      const itemCenter = offsetLeft + (offsetWidth / 2)
      const distance = Math.abs(viewportCenter - itemCenter)
      
      itemPositions.push({
        index: i,
        offsetLeft,
        offsetWidth,
        itemCenter,
        distance,
        isReachable: itemCenter >= 0 && itemCenter <= scrollWidth
      })
      
      if (distance < closestDistance) {
        closestDistance = distance
        closestIndex = i
      }
    }
    
    // Log all positions every time to debug
    console.log('📊 All item positions:', itemPositions)
    console.log('🎯 Viewport center:', viewportCenter, 'Closest index:', closestIndex)
    console.log('📏 Scroll bounds:', { scrollLeft, scrollWidth, clientWidth })
    
    if (closestIndex !== currentIndex) {
      console.log('🔄 Index changed from', currentIndex, 'to', closestIndex)
      setCurrentIndex(closestIndex)
      onIndexChange?.(closestIndex)
    }
  }, [itemCount, currentIndex, onIndexChange])

  const scrollToImage = useCallback((direction: 'left' | 'right') => {
    const container = scrollContainerRef.current
    if (!container) return

    console.log('🚀 ScrollToImage called:', direction, 'from index:', currentIndex)
    
    isUpdatingRef.current = true
    
    const items = container.children
    if (items.length === 0) {
      console.log('❌ No items found')
      return
    }
    
    let targetIndex = currentIndex
    if (direction === 'left') {
      targetIndex = Math.max(0, currentIndex - 1)
    } else {
      targetIndex = Math.min(items.length - 1, currentIndex + 1)
    }
    
    console.log('🎯 Target index:', targetIndex, 'of', items.length, 'items')
    
    // FORCE the index change regardless of scroll detection
    console.log('🔧 FORCING index change from', currentIndex, 'to', targetIndex)
    setCurrentIndex(targetIndex)
    onIndexChange?.(targetIndex)
    
    // Ensure target index is valid
    if (targetIndex < 0 || targetIndex >= items.length) {
      console.log('❌ Invalid target index')
      isUpdatingRef.current = false
      return
    }
    
    const targetItem = items[targetIndex] as HTMLElement
    if (targetItem) {
      const itemCenter = targetItem.offsetLeft + (targetItem.offsetWidth / 2)
      const viewportCenter = container.clientWidth / 2
      const targetScroll = itemCenter - viewportCenter
      
      console.log('📍 Scroll calculation:', {
        targetIndex,
        itemOffsetLeft: targetItem.offsetLeft,
        itemWidth: targetItem.offsetWidth,
        itemCenter,
        viewportCenter,
        targetScroll: Math.max(0, targetScroll),
        containerScrollWidth: container.scrollWidth,
        containerClientWidth: container.clientWidth
      })
      
      container.scrollTo({ 
        left: Math.max(0, targetScroll),
        behavior: 'smooth' 
      })
    }

    // Reset the updating flag after animation
    setTimeout(() => {
      isUpdatingRef.current = false
      // Don't call checkScrollPosition here - let the forced index stick
    }, 700)
  }, [currentIndex, onIndexChange])

  const scrollToIndex = useCallback((index: number) => {
    const container = scrollContainerRef.current
    if (!container || index < 0 || index >= itemCount) return

    console.log('🎯 MANUAL scroll to index:', index)
    
    isUpdatingRef.current = true
    
    // NEW: Use actual DOM elements
    const items = container.children
    const targetItem = items[index] as HTMLElement
    
    if (targetItem) {
      // Force the index change first
      setCurrentIndex(index)
      onIndexChange?.(index)
      
      const itemCenter = targetItem.offsetLeft + (targetItem.offsetWidth / 2)
      const viewportCenter = container.clientWidth / 2
      const targetScroll = itemCenter - viewportCenter
      
      console.log('📍 Manual scroll calculation:', {
        index,
        itemOffsetLeft: targetItem.offsetLeft,
        itemWidth: targetItem.offsetWidth,
        itemCenter,
        viewportCenter,
        targetScroll: Math.max(0, targetScroll)
      })
      
      container.scrollTo({ 
        left: Math.max(0, targetScroll),
        behavior: 'smooth' 
      })
    }

    setTimeout(() => {
      isUpdatingRef.current = false
    }, 700)
  }, [itemCount, onIndexChange])

  // DISABLED: Auto-center current item when index changes
  // This was causing conflicts with manual navigation
  const centerCurrentItem = useCallback(() => {
    // Temporarily disabled to fix navigation issues
    console.log('⚠️ centerCurrentItem called but disabled')
  }, [currentIndex])

  // DISABLED: Center current item when currentIndex changes
  // useEffect(() => {
  //   if (!isUpdatingRef.current) {
  //     setTimeout(centerCurrentItem, 100)
  //   }
  // }, [currentIndex, centerCurrentItem])

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

    // Initial check with multiple attempts to ensure DOM is ready
    const initialCheck = () => {
      setTimeout(() => {
        console.log('🔍 Initial scroll position check')
        console.log('Container children count:', container.children.length)
        console.log('Expected itemCount:', itemCount)
        checkScrollPosition()
      }, 200)
      
      // Extra check for safety
      setTimeout(() => {
        console.log('🔍 Secondary scroll position check')
        checkScrollPosition()
      }, 500)
    }
    initialCheck()
    
    container.addEventListener('scroll', handleScroll, { passive: true })
    
    // Handle window resize
    const handleResize = () => {
      if (!isUpdatingRef.current) {
        setTimeout(() => {
          console.log('🔍 Resize scroll position check')
          checkScrollPosition()
        }, 200)
      }
    }
    window.addEventListener('resize', handleResize)
    
    return () => {
      container.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleResize)
    }
  }, [checkScrollPosition, itemCount])

  return {
    scrollContainerRef,
    canScrollLeft,
    canScrollRight,
    currentIndex,
    scrollToImage,
    scrollToIndex,
    centerCurrentItem, // NEW: Export centering function
  }
}
