'use client'
import { useEffect, useRef, useState } from 'react'
import { MobileGalleryItem } from './MobileGalleryItem'
import { ScrollToTopButton } from '../UI/ScrollToTopButton'
import { TextileDesign } from '@/types/textile'
import { UmamiEvents } from '@/utils/analytics'
import { scrollManager } from '@/lib/scrollManager'

interface MobileGalleryProps {
  designs: TextileDesign[]
}

export function MobileGallery({ designs }: MobileGalleryProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [hasRestored, setHasRestored] = useState(false)

  // Hide static first image after hydration (Issue #51 Phase 2)
  useEffect(() => {
    const staticFirstImage = document.querySelector(
      '[data-first-image="true"]'
    ) as HTMLElement
    if (staticFirstImage) {
      staticFirstImage.style.display = 'none'
      console.log('🎯 Static first image hidden after hydration')
    }
  }, [])

  // Restore scroll position on mount
  useEffect(() => {
    if (designs.length === 0 || hasRestored) return

    const restoreScrollPosition = async () => {
      const savedIndex = await scrollManager.restore('/')
      if (savedIndex !== null && savedIndex > 0) {
        setTimeout(() => {
          const container = containerRef.current
          if (container) {
            const items = container.querySelectorAll('.mobile-gallery-item')
            const targetItem = items[savedIndex] as HTMLElement
            if (targetItem) {
              console.log(`🔄 Mobile Gallery restored to index ${savedIndex}`)
              targetItem.scrollIntoView({
                behavior: 'auto',
                block: 'start',
                inline: 'nearest',
              })
              setCurrentIndex(savedIndex)
            }
          }
          setHasRestored(true)
        }, 150)
      } else {
        setHasRestored(true)
      }
    }

    restoreScrollPosition()
  }, [designs.length, hasRestored])

  // Track scroll position and update current index
  useEffect(() => {
    const container = containerRef.current
    if (!container || !hasRestored) return

    let ticking = false
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const newIndex = calculateCurrentIndex(container)
          if (newIndex !== currentIndex) {
            setCurrentIndex(newIndex)
            container.setAttribute('data-current-index', newIndex.toString())
          }
          ticking = false
        })
        ticking = true
      }
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [currentIndex, hasRestored])

  // Save scroll position when index changes (debounced)
  useEffect(() => {
    if (!hasRestored) return

    const timeoutId = setTimeout(() => {
      scrollManager.save(currentIndex)
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [currentIndex, hasRestored])

  // Track analytics when current item changes
  useEffect(() => {
    if (currentIndex >= 0 && currentIndex < designs.length && hasRestored) {
      UmamiEvents.galleryNavigation('scroll', currentIndex, currentIndex)
    }
  }, [currentIndex, designs.length, hasRestored])

  const calculateCurrentIndex = (container: HTMLElement): number => {
    const items = container.querySelectorAll('.mobile-gallery-item')
    let maxVisibleArea = 0
    let currentVisibleIndex = 0

    items.forEach((item, index) => {
      const rect = item.getBoundingClientRect()
      const containerRect = container.getBoundingClientRect()
      const top = Math.max(rect.top, containerRect.top)
      const bottom = Math.min(rect.bottom, containerRect.bottom)
      const visibleHeight = Math.max(0, bottom - top)
      const visibleArea = visibleHeight * rect.width

      if (visibleArea > maxVisibleArea) {
        maxVisibleArea = visibleArea
        currentVisibleIndex = index
      }
    })

    return currentVisibleIndex
  }

  const scrollToIndex = (index: number) => {
    if (!containerRef.current) return
    const items = containerRef.current.querySelectorAll('.mobile-gallery-item')
    const targetItem = items[index] as HTMLElement

    if (targetItem) {
      targetItem.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest',
      })
    }
  }

  const scrollToTop = () => {
    scrollToIndex(0)
    setCurrentIndex(0)
    scrollManager.saveImmediate(0)
  }

  const handleItemClick = (design: TextileDesign, index: number) => {
    scrollManager.saveImmediate(index)
  }

  return (
    <div className="mobile-gallery" data-testid="mobile-gallery">
      <div
        ref={containerRef}
        className="mobile-gallery-stack"
        data-scroll-container
        data-current-index={currentIndex}
        data-testid="mobile-gallery-stack"
      >
        {designs.map((design, index) => (
          <MobileGalleryItem
            key={design._id}
            design={design}
            index={index}
            isFirst={index === 0}
            onClick={() => handleItemClick(design, index)}
          />
        ))}
      </div>
      <ScrollToTopButton
        containerRef={containerRef}
        threshold={1000}
        className="mobile-gallery-scroll-to-top"
        onScrollToTop={scrollToTop}
      />
    </div>
  )
}
