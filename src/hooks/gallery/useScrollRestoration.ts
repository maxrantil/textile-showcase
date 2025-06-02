'use client'

import { useState, useRef } from 'react'
import { scrollManager } from '@/lib/scrollManager'
import { GALLERY_CONFIG } from '@/config/galleryConfig'

export function useScrollRestoration(pathname: string, designCount: number) {
  const [isRestoring, setIsRestoring] = useState(true)
  const restorationAttempted = useRef(false)

  const attemptRestoration = (scrollToIndex: (index: number, instant?: boolean) => void, attempt: number = 1) => {
    if (restorationAttempted.current) return
    
    console.log(`🔄 Index restoration attempt ${attempt} for path: ${pathname}`)
    
    if (attempt === 1) {
      scrollManager.debug()
    }
    
    const savedIndex = scrollManager.getSavedIndex(pathname)
    
    if (savedIndex !== null && savedIndex >= 0 && savedIndex < designCount) {
      console.log('✅ Restoring to index:', savedIndex)
      scrollToIndex(savedIndex, true) // instant
      restorationAttempted.current = true
      
      setTimeout(() => {
        setIsRestoring(false)
      }, GALLERY_CONFIG.restorationDelay)
      
      return savedIndex
    } else if (attempt < 3) {
      const delay = 50 * attempt
      setTimeout(() => attemptRestoration(scrollToIndex, attempt + 1), delay)
    } else {
      console.log('✅ Starting from beginning (index 0)')
      scrollToIndex(0, true)
      restorationAttempted.current = true
      
      setTimeout(() => {
        setIsRestoring(false)
      }, GALLERY_CONFIG.restorationDelay)
      
      return 0
    }
  }

  const markRestored = () => {
    restorationAttempted.current = true
    setIsRestoring(false)
  }

  return {
    isRestoring,
    restorationAttempted: restorationAttempted.current,
    attemptRestoration,
    markRestored
  }
}
