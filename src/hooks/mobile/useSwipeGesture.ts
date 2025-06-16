// src/hooks/mobile/useSwipeGesture.ts
'use client'

import { useState, useCallback, useRef, TouchEvent } from 'react'

interface TouchPosition {
  x: number
  y: number
  time: number
}

interface SwipeGestureOptions {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  minSwipeDistance?: number
  maxSwipeTime?: number
  enabled?: boolean
  preventScroll?: boolean
  threshold?: number
}

export function useSwipeGesture({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  minSwipeDistance = 50,
  maxSwipeTime = 500,
  enabled = true,
  threshold = 10,
}: SwipeGestureOptions) {
  const [touchStart, setTouchStart] = useState<TouchPosition | null>(null)
  const [isSwiping, setIsSwiping] = useState(false)
  const swipeRef = useRef<{
    startX: number
    startY: number
    currentX: number
    currentY: number
    startTime: number
  } | null>(null)

  const getTouchPosition = (e: TouchEvent): TouchPosition => ({
    x: e.touches[0].clientX,
    y: e.touches[0].clientY,
    time: Date.now(),
  })

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (!enabled) return

      const touch = getTouchPosition(e)
      setTouchStart(touch)
      setIsSwiping(false)

      swipeRef.current = {
        startX: touch.x,
        startY: touch.y,
        currentX: touch.x,
        currentY: touch.y,
        startTime: touch.time,
      }

      console.log('🤏 Touch start:', { x: touch.x, y: touch.y, enabled })
    },
    [enabled]
  )

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!enabled || !touchStart || !swipeRef.current) return

      const currentTouch = getTouchPosition(e)
      swipeRef.current.currentX = currentTouch.x
      swipeRef.current.currentY = currentTouch.y

      const deltaX = Math.abs(currentTouch.x - touchStart.x)
      const deltaY = Math.abs(currentTouch.y - touchStart.y)

      const isHorizontalMovement = deltaX > deltaY
      const hasSignificantMovement = deltaX > threshold || deltaY > threshold

      if (hasSignificantMovement) {
        if (!isSwiping) {
          setIsSwiping(true)
          console.log('🔄 Swipe detected:', {
            deltaX,
            deltaY,
            isHorizontal: isHorizontalMovement,
          })
        }
      }
    },
    [enabled, touchStart, threshold, isSwiping]
  )

  const handleTouchEnd = useCallback(() => {
    console.log('🏁 Touch end called', {
      enabled,
      hasTouchStart: !!touchStart,
      hasSwipeRef: !!swipeRef.current,
    })

    if (!enabled || !touchStart || !swipeRef.current) {
      console.log('🚫 Touch end - missing data')
      setTouchStart(null)
      setIsSwiping(false)
      swipeRef.current = null
      return
    }

    const endTime = Date.now()
    const swipeTime = endTime - swipeRef.current.startTime

    if (swipeTime > maxSwipeTime) {
      console.log('⏰ Swipe too slow:', swipeTime + 'ms')
      setTouchStart(null)
      setIsSwiping(false)
      swipeRef.current = null
      return
    }

    const deltaX = swipeRef.current.startX - swipeRef.current.currentX
    const deltaY = swipeRef.current.startY - swipeRef.current.currentY
    const absDeltaX = Math.abs(deltaX)
    const absDeltaY = Math.abs(deltaY)

    console.log('📊 Swipe analysis:', {
      deltaX,
      deltaY,
      absDeltaX,
      absDeltaY,
      minDistance: minSwipeDistance,
      swipeTime,
    })

    const isHorizontalSwipe = absDeltaX > absDeltaY
    const isVerticalSwipe = absDeltaY > absDeltaX

    if (isHorizontalSwipe && absDeltaX > minSwipeDistance) {
      if (deltaX > 0) {
        console.log('👈 Swipe LEFT detected - calling onSwipeLeft')
        onSwipeLeft?.()
      } else {
        console.log('👉 Swipe RIGHT detected - calling onSwipeRight')
        onSwipeRight?.()
      }
    } else if (isVerticalSwipe && absDeltaY > minSwipeDistance) {
      if (deltaY > 0) {
        console.log('👆 Swipe UP detected')
        onSwipeUp?.()
      } else {
        console.log('👇 Swipe DOWN detected')
        onSwipeDown?.()
      }
    } else {
      console.log('❌ No valid swipe detected - not enough distance')
    }

    // Reset state
    setTouchStart(null)
    setIsSwiping(false)
    swipeRef.current = null
  }, [
    enabled,
    touchStart,
    maxSwipeTime,
    minSwipeDistance,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
  ])

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    isSwiping,
    swipeHandlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  }
}

// Simpler version for basic left/right swiping
export function useHorizontalSwipe({
  onSwipeLeft,
  onSwipeRight,
  enabled = true,
  minSwipeDistance = 75,
  maxSwipeTime = 400,
}: {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  enabled?: boolean
  minSwipeDistance?: number
  maxSwipeTime?: number
}) {
  console.log('🔧 useHorizontalSwipe initialized with:', {
    hasOnSwipeLeft: !!onSwipeLeft,
    hasOnSwipeRight: !!onSwipeRight,
    enabled,
    minSwipeDistance,
    maxSwipeTime,
  })

  return useSwipeGesture({
    onSwipeLeft,
    onSwipeRight,
    enabled,
    minSwipeDistance,
    maxSwipeTime,
    preventScroll: true, // This now only affects CSS, not JS
    threshold: 15,
  })
}
