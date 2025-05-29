'use client'

import { useState, useEffect, useRef } from 'react'

interface UseImageScrollProps {
  totalImages: number
  onIndexChange?: (index: number) => void
}

export function useImageScroll({ totalImages, onIndexChange }: UseImageScrollProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const isScrollingRef = useRef(false)
  const targetScrollRef = useRef(0)

  const goToPrevious = () => {
    const newIndex = currentIndex === 0 ? totalImages - 1 : currentIndex - 1
    setCurrentIndex(newIndex)
    onIndexChange?.(newIndex)
  }

  const goToNext = () => {
    const newIndex = currentIndex === totalImages - 1 ? 0 : currentIndex + 1
    setCurrentIndex(newIndex)
    onIndexChange?.(newIndex)
  }

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let currentScroll = currentIndex
    targetScrollRef.current = currentIndex

    const animate = () => {
      currentScroll += (targetScrollRef.current - currentScroll) * 0.1
      
      if (Math.abs(targetScrollRef.current - currentScroll) < 0.01) {
        currentScroll = targetScrollRef.current
        isScrollingRef.current = false
      }

      const roundedIndex = Math.round(currentScroll)
      if (roundedIndex !== currentIndex && !isScrollingRef.current) {
        setCurrentIndex(roundedIndex)
        onIndexChange?.(roundedIndex)
      }

      if (isScrollingRef.current) {
        requestAnimationFrame(animate)
      }
    }

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      
      if (isScrollingRef.current) return
      
      const delta = e.deltaY
      let newTarget = targetScrollRef.current
      
      if (delta > 0) {
        newTarget = Math.min(totalImages - 1, newTarget + 1)
      } else {
        newTarget = Math.max(0, newTarget - 1)
      }
      
      if (newTarget >= totalImages) newTarget = 0
      if (newTarget < 0) newTarget = totalImages - 1
      
      targetScrollRef.current = newTarget
      isScrollingRef.current = true
      animate()
    }

    let touchStartX = 0
    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX
    }

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      const diff = touchStartX - e.touches[0].clientX
      
      if (Math.abs(diff) > 50) {
        let newTarget = targetScrollRef.current
        newTarget += diff > 0 ? 1 : -1
        
        if (newTarget >= totalImages) newTarget = 0
        if (newTarget < 0) newTarget = totalImages - 1
        
        targetScrollRef.current = newTarget
        touchStartX = e.touches[0].clientX
        
        if (!isScrollingRef.current) {
          isScrollingRef.current = true
          animate()
        }
      }
    }

    container.addEventListener('wheel', handleWheel, { passive: false })
    container.addEventListener('touchstart', handleTouchStart, { passive: false })
    container.addEventListener('touchmove', handleTouchMove, { passive: false })

    return () => {
      container.removeEventListener('wheel', handleWheel)
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
    }
  }, [totalImages, currentIndex, onIndexChange])

  return {
    currentIndex,
    containerRef,
    goToPrevious,
    goToNext
  }
}
