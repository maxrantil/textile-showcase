'use client'

import { useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { scrollManager } from '@/lib/scrollManager'
import { TextileDesign } from '@/types/textile'

interface UseGalleryNavigationProps {
  designs: TextileDesign[]
  currentIndex: number
  pathname: string
  isFirstMount: boolean
}

export function useGalleryNavigation({
  currentIndex,
  pathname,
  isFirstMount,
}: UseGalleryNavigationProps) {
  const router = useRouter()
  const lastClick = useRef(0)
  const lastClickedDesign = useRef<string | null>(null)

  const handleImageClick = useCallback(
    (design: TextileDesign) => {
      const now = Date.now()
      const timeSinceLastClick = now - lastClick.current

      // Different debounce times based on context
      const debounceTime = lastClickedDesign.current === design._id ? 200 : 100

      if (timeSinceLastClick < debounceTime) {
        if (process.env.NODE_ENV === 'development') {
          console.log(
            `🚫 Click ignored (${timeSinceLastClick}ms < ${debounceTime}ms)`
          )
        }
        return
      }

      lastClick.current = now
      lastClickedDesign.current = design._id // Track which item was clicked

      if (process.env.NODE_ENV === 'development') {
        console.log('🖱️ Navigating to project:', design.title)
      }

      if (!isFirstMount) {
        scrollManager.saveImmediate(currentIndex, pathname)
      }

      scrollManager.triggerNavigationStart()
      router.push(`/project/${design.slug?.current || design._id}`)
    },
    [router, pathname, currentIndex, isFirstMount]
  )

  const handlePageNavigation = useCallback(
    (path: string) => {
      // Simple debouncing
      const now = Date.now()
      if (now - lastClick.current < 150) {
        console.log('🚫 Navigation too fast, ignoring')
        return
      }
      lastClick.current = now

      scrollManager.triggerNavigationStart()
      if (!isFirstMount) {
        scrollManager.saveImmediate(currentIndex, pathname)
      }
      router.push(path)
    },
    [router, pathname, currentIndex, isFirstMount]
  )

  return {
    handleImageClick,
    handlePageNavigation,
  }
}
