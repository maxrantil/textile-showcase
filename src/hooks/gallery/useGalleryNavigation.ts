'use client'

import { useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { scrollManager } from '@/lib/scrollManager'
import { TextileDesign } from '@/sanity/types'

interface UseGalleryNavigationProps {
  designs: TextileDesign[]
  currentIndex: number
  pathname: string
  isFirstMount: boolean
}

export function useGalleryNavigation({ 
  designs, 
  currentIndex, 
  pathname, 
  isFirstMount
}: UseGalleryNavigationProps) {
  const router = useRouter()
  const lastClick = useRef(0)

  const handleImageClick = useCallback((design: TextileDesign) => {
    // Simple debouncing - only allow clicks every 300ms
    const now = Date.now()
    if (now - lastClick.current < 300) {
      console.log('🚫 Click too fast, ignoring')
      return
    }
    lastClick.current = now

    console.log('🖱️ Image clicked, saving index before navigation')
    
    if (!isFirstMount) {
      scrollManager.saveImmediate(currentIndex, pathname)
      console.log(`💾 Saved index ${currentIndex} for path ${pathname}`)
    }
    
    scrollManager.triggerNavigationStart()
    router.push(`/project/${design.slug?.current || design._id}`)
  }, [router, pathname, currentIndex, isFirstMount])

  const handlePageNavigation = useCallback((path: string) => {
    // Simple debouncing
    const now = Date.now()
    if (now - lastClick.current < 300) {
      console.log('🚫 Navigation too fast, ignoring')
      return
    }
    lastClick.current = now

    scrollManager.triggerNavigationStart()
    if (!isFirstMount) {
      scrollManager.saveImmediate(currentIndex, pathname)
    }
    router.push(path)
  }, [router, pathname, currentIndex, isFirstMount])

  return {
    handleImageClick,
    handlePageNavigation
  }
}
