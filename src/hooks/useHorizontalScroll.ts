// src/hooks/useHorizontalScroll.ts - Updated to export setCurrentIndex
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
    
    const items = container.children
    if (items.length === 0) return
    
    const viewportCenter = scrollLeft + (clientWidth / 2)
    let closestIndex = 0
    let closestDistance = Infinity
    
    for (let i = 0; i < items.length && i < itemCount; i++) {
      const item = items[i] as HTMLElement
      const itemCenter = item.offsetLeft + (item.offsetWidth / 2)
      const distance = Math.abs(viewportCenter - itemCenter)
      
      if (distance < closestDistance) {
        closestDistance = distance
        closestIndex = i
      }
    }
    
    // Only log when index actually changes
    if (closestIndex !== currentIndex) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🎯 Gallery index changed:', currentIndex, '→', closestIndex)
      }
      setCurrentIndex(closestIndex)
      onIndexChange?.(closestIndex)
    }
  }, [itemCount, currentIndex, onIndexChange])

  const scrollToImage = useCallback((direction: 'left' | 'right') => {
    const container = scrollContainerRef.current
    if (!container) return

    if (process.env.NODE_ENV === 'development') {
      console.log('🚀 ScrollToImage called:', direction, 'from index:', currentIndex)
    }
    
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
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🎯 Target index:', targetIndex, 'of', items.length, 'items')
      console.log('🔧 FORCING index change from', currentIndex, 'to', targetIndex)
    }
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
      
      if (process.env.NODE_ENV === 'development') {
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
      }
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

  const scrollToIndex = useCallback((index: number, instant: boolean = false) => {
    const container = scrollContainerRef.current
    if (!container || index < 0 || index >= itemCount) return

    if (process.env.NODE_ENV === 'development') {
      console.log('🚀 scrollToIndex called:', index, 'from index:', currentIndex)
    }
    
    if (!instant) {
      isUpdatingRef.current = true
    }
    
    // Force the index change first
    setCurrentIndex(index)
    onIndexChange?.(index)
    
    // Use actual DOM elements
    const items = container.children
    const targetItem = items[index] as HTMLElement
    
    if (targetItem) {
      const itemCenter = targetItem.offsetLeft + (targetItem.offsetWidth / 2)
      const viewportCenter = container.clientWidth / 2
      const targetScroll = itemCenter - viewportCenter
      
      if (process.env.NODE_ENV === 'development') {
        console.log('📍 Manual scroll calculation:', {
          index,
          itemOffsetLeft: targetItem.offsetLeft,
          itemWidth: targetItem.offsetWidth,
          itemCenter,
          viewportCenter,
          targetScroll: Math.max(0, targetScroll),
          instant
        })
      }
      
      if (instant) {
        // Instant scroll without animation - for restoration
        const originalBehavior = container.style.scrollBehavior
        container.style.scrollBehavior = 'auto'
        container.scrollLeft = Math.max(0, targetScroll)
        
        // Force update the scroll position detection immediately
        setTimeout(() => {
          container.style.scrollBehavior = originalBehavior
          // Trigger a manual scroll event to update position detection
          container.dispatchEvent(new Event('scroll'))
        }, 10)
      } else {
        // Smooth animated scroll - for user navigation
        container.scrollTo({ 
          left: Math.max(0, targetScroll),
          behavior: 'smooth' 
        })
      }
    }

    if (!instant) {
      setTimeout(() => {
        isUpdatingRef.current = false
      }, 700)
    }
  }, [itemCount, currentIndex, onIndexChange])

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
        if (process.env.NODE_ENV === 'development') {
          console.log('🔍 Initial scroll position check')
          console.log('Container children count:', container.children.length)
          console.log('Expected itemCount:', itemCount)
        }
        checkScrollPosition()
      }, 200)
      
      // Extra check for safety
      setTimeout(() => {
        if (process.env.NODE_ENV === 'development') {
          console.log('🔍 Secondary scroll position check')
        }
        checkScrollPosition()
      }, 500)
    }
    initialCheck()
    
    container.addEventListener('scroll', handleScroll, { passive: true })
    
    // Handle window resize
    const handleResize = () => {
      if (!isUpdatingRef.current) {
        setTimeout(() => {
          if (process.env.NODE_ENV === 'development') {
            console.log('🔍 Resize scroll position check')
          }
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
    setCurrentIndex, // Export setCurrentIndex for manual control
    scrollToImage,
    scrollToIndex,
  }
}
