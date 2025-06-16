// src/hooks/mobile/useVirtualKeyboard.ts
'use client'

import { useEffect, useState } from 'react'

export function useVirtualKeyboard() {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)
  const [viewportHeight, setViewportHeight] = useState(0)

  useEffect(() => {
    const initialHeight = window.innerHeight
    setViewportHeight(initialHeight)

    const handleResize = () => {
      const currentHeight = window.innerHeight
      const heightDiff = initialHeight - currentHeight

      // Assume keyboard is open if height decreased by more than 150px
      setIsKeyboardOpen(heightDiff > 150)
      setViewportHeight(currentHeight)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return { isKeyboardOpen, viewportHeight }
}
