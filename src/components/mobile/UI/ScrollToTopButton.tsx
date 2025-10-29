// ABOUTME: Scroll to top button component with automatic visibility based on scroll position
'use client'

import { useEffect, useState } from 'react'

interface ScrollToTopButtonProps {
  containerRef: React.RefObject<HTMLDivElement | null>
  threshold?: number
  className?: string
  onScrollToTop?: () => void
}

export function ScrollToTopButton({
  containerRef,
  threshold = 900, // Sensible default - show after scrolling 400px
  className = '',
  onScrollToTop,
}: ScrollToTopButtonProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [activeScroller, setActiveScroller] = useState<
    'container' | 'window' | 'none'
  >('none')

  useEffect(() => {
    const container = containerRef.current

    const handleContainerScroll = () => {
      if (container) {
        const scroll = container.scrollTop
        if (scroll > 0) {
          setActiveScroller('container')
          setIsVisible(scroll > threshold)
        }
      }
    }

    const handleWindowScroll = () => {
      const scroll = window.scrollY
      if (scroll > 0) {
        setActiveScroller('window')
        setIsVisible(scroll > threshold)
      }
    }

    // Listen to both container and window scroll
    if (container) {
      container.addEventListener('scroll', handleContainerScroll, {
        passive: true,
      })
    }
    window.addEventListener('scroll', handleWindowScroll, { passive: true })

    // Check initial state
    handleContainerScroll()
    handleWindowScroll()

    return () => {
      if (container) {
        container.removeEventListener('scroll', handleContainerScroll)
      }
      window.removeEventListener('scroll', handleWindowScroll)
    }
  }, [containerRef, threshold])

  const scrollToTop = () => {
    if (onScrollToTop) {
      onScrollToTop()
    } else if (activeScroller === 'window') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (containerRef?.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  if (!isVisible) return null

  return (
    <button
      onClick={scrollToTop}
      className={`scroll-to-top-button ${className}`}
      aria-label="Scroll to top"
      type="button"
    >
      ^
    </button>
  )
}
