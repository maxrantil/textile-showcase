// src/hooks/useHorizontalScroll.ts - Updated version
'use client'

import { useRef, useState, useEffect, useCallback } from 'react'

interface UseHorizontalScrollProps {
  itemCount: number
  onIndexChange?: (index: number) => void
}

export function useHorizontalScroll({
  itemCount,
  onIndexChange,
}: UseHorizontalScrollProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const isScrollingRef = useRef(false)
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastReportedIndex = useRef<number>(-1)

  const checkScrollPosition = useCallback(() => {
    const container = scrollContainerRef.current
    if (!container || isScrollingRef.current) return

    const { scrollLeft, scrollWidth, clientWidth } = container
    setCanScrollLeft(scrollLeft > 10)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)

    const items = container.children
    if (items.length === 0) return

    const viewportCenter = scrollLeft + clientWidth / 2
    let closestIndex = 0
    let closestDistance = Infinity

    for (let i = 0; i < items.length && i < itemCount; i++) {
      const item = items[i] as HTMLElement
      const itemCenter = item.offsetLeft + item.offsetWidth / 2
      const distance = Math.abs(viewportCenter - itemCenter)

      if (distance < closestDistance) {
        closestDistance = distance
        closestIndex = i
      }
    }

    // Only update if the index has actually changed
    if (closestIndex !== lastReportedIndex.current) {
      lastReportedIndex.current = closestIndex
      setCurrentIndex(closestIndex)
      onIndexChange?.(closestIndex)

      // Update container attribute for scroll manager
      container.setAttribute('data-current-index', closestIndex.toString())
    }
  }, [itemCount, onIndexChange])

  const scrollToImage = useCallback(
    (direction: 'left' | 'right') => {
      const container = scrollContainerRef.current
      if (!container) return

      isScrollingRef.current = true

      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }

      const items = container.children
      if (items.length === 0) return

      let targetIndex = currentIndex
      if (direction === 'left') {
        targetIndex = Math.max(0, currentIndex - 1)
      } else {
        targetIndex = Math.min(items.length - 1, currentIndex + 1)
      }

      const targetItem = items[targetIndex] as HTMLElement
      if (targetItem) {
        const itemCenter = targetItem.offsetLeft + targetItem.offsetWidth / 2
        const viewportCenter = container.clientWidth / 2
        const targetScroll = Math.max(0, itemCenter - viewportCenter)

        container.scrollTo({
          left: targetScroll,
          behavior: 'smooth',
        })

        // Update state immediately
        setCurrentIndex(targetIndex)
        lastReportedIndex.current = targetIndex
        onIndexChange?.(targetIndex)
        container.setAttribute('data-current-index', targetIndex.toString())
      }

      scrollTimeoutRef.current = setTimeout(() => {
        isScrollingRef.current = false
      }, 600)
    },
    [currentIndex, onIndexChange]
  )

  const scrollToIndex = useCallback(
    (index: number, instant: boolean = false) => {
      const container = scrollContainerRef.current
      if (!container || index < 0 || index >= itemCount) return

      isScrollingRef.current = true

      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }

      const items = container.children
      const targetItem = items[index] as HTMLElement

      if (targetItem) {
        const itemCenter = targetItem.offsetLeft + targetItem.offsetWidth / 2
        const viewportCenter = container.clientWidth / 2
        const targetScroll = Math.max(0, itemCenter - viewportCenter)

        if (instant) {
          container.scrollLeft = targetScroll
          setCurrentIndex(index)
          lastReportedIndex.current = index
          onIndexChange?.(index)
          container.setAttribute('data-current-index', index.toString())
          isScrollingRef.current = false
        } else {
          container.scrollTo({
            left: targetScroll,
            behavior: 'smooth',
          })

          setCurrentIndex(index)
          lastReportedIndex.current = index
          onIndexChange?.(index)
          container.setAttribute('data-current-index', index.toString())

          scrollTimeoutRef.current = setTimeout(() => {
            isScrollingRef.current = false
          }, 600)
        }
      }
    },
    [itemCount, onIndexChange]
  )

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    // Set initial attributes
    container.setAttribute('data-scroll-container', 'true')
    container.setAttribute('data-current-index', '0')

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

    const initialCheck = () => {
      setTimeout(() => {
        checkScrollPosition()
      }, 100)
    }
    initialCheck()

    container.addEventListener('scroll', handleScroll, { passive: true })

    const handleResize = () => {
      setTimeout(checkScrollPosition, 100)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      container.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleResize)

      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [checkScrollPosition])

  return {
    scrollContainerRef,
    canScrollLeft,
    canScrollRight,
    currentIndex,
    setCurrentIndex,
    scrollToImage,
    scrollToIndex,
  }
}
