// src/components/desktop/Gallery/DesktopGallery.tsx - Fixed version without loops
'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { useKeyboardNavigation } from '@/hooks/desktop/useKeyboardNavigation'
import { DesktopGalleryItem } from './DesktopGalleryItem'
import { NavigationArrows } from '@/components/ui/NavigationArrows'
import { TextileDesign } from '@/sanity/types'
import { UmamiEvents } from '@/utils/analytics'
import { simpleScrollManager } from '@/lib/simpleScrollManager'

interface DesktopGalleryProps {
  designs: TextileDesign[]
}

export function DesktopGallery({ designs }: DesktopGalleryProps) {
  const pathname = usePathname()
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const isScrollingRef = useRef(false)
  const hasRestoredRef = useRef(false)
  const lastSavedIndexRef = useRef<number>(-1)

  // Simple scroll to index function
  const scrollToIndex = useCallback(
    (index: number, instant = false) => {
      const container = scrollContainerRef.current
      if (!container || index < 0 || index >= designs.length) return

      const items = container.children
      const targetItem = items[index] as HTMLElement

      if (targetItem) {
        const itemCenter = targetItem.offsetLeft + targetItem.offsetWidth / 2
        const containerCenter = container.clientWidth / 2
        const scrollPosition = Math.max(0, itemCenter - containerCenter)

        isScrollingRef.current = true

        if (instant) {
          container.scrollLeft = scrollPosition
          isScrollingRef.current = false
        } else {
          container.scrollTo({
            left: scrollPosition,
            behavior: 'smooth',
          })

          // Reset flag after animation
          setTimeout(() => {
            isScrollingRef.current = false
          }, 600)
        }

        setCurrentIndex(index)
      }
    },
    [designs.length]
  )

  // Navigation functions
  const scrollToImage = useCallback(
    (direction: 'left' | 'right') => {
      let newIndex = currentIndex
      if (direction === 'left') {
        newIndex = Math.max(0, currentIndex - 1)
      } else {
        newIndex = Math.min(designs.length - 1, currentIndex + 1)
      }

      if (newIndex !== currentIndex) {
        scrollToIndex(newIndex)
      }
    },
    [currentIndex, designs.length, scrollToIndex]
  )

  // Update current index based on scroll position
  const updateCurrentIndex = useCallback(() => {
    if (isScrollingRef.current || !hasRestoredRef.current) return

    const container = scrollContainerRef.current
    if (!container) return

    const { scrollLeft, clientWidth } = container
    const items = container.children
    const containerCenter = scrollLeft + clientWidth / 2
    let closestIndex = 0
    let closestDistance = Infinity

    for (let i = 0; i < items.length; i++) {
      const item = items[i] as HTMLElement
      const itemCenter = item.offsetLeft + item.offsetWidth / 2
      const distance = Math.abs(containerCenter - itemCenter)

      if (distance < closestDistance) {
        closestDistance = distance
        closestIndex = i
      }
    }

    if (closestIndex !== currentIndex) {
      setCurrentIndex(closestIndex)
    }
  }, [currentIndex])

  // Check scroll boundaries
  const checkScrollBounds = useCallback(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const { scrollLeft, scrollWidth, clientWidth } = container
    setCanScrollLeft(scrollLeft > 10)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)

    updateCurrentIndex()
  }, [updateCurrentIndex])

  // Setup scroll listener
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    let ticking = false
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          checkScrollBounds()
          ticking = false
        })
        ticking = true
      }
    }

    container.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      container.removeEventListener('scroll', handleScroll)
    }
  }, [checkScrollBounds])

  // Restore scroll position ONCE on mount
  useEffect(() => {
    if (designs.length === 0 || hasRestoredRef.current) return

    simpleScrollManager.startRestoration()

    const savedIndex = simpleScrollManager.get(pathname)

    if (savedIndex !== null && savedIndex >= 0 && savedIndex < designs.length) {
      // Restore to saved position
      setTimeout(() => {
        scrollToIndex(savedIndex, true)
        hasRestoredRef.current = true
        lastSavedIndexRef.current = savedIndex
        simpleScrollManager.endRestoration()

        if (process.env.NODE_ENV === 'development') {
          console.log(`🔄 Restored to index ${savedIndex}`)
        }
      }, 200)
    } else {
      // No saved position, start at beginning
      hasRestoredRef.current = true
      lastSavedIndexRef.current = 0
      simpleScrollManager.endRestoration()
      setTimeout(checkScrollBounds, 100)
    }
  }, [pathname, designs.length, scrollToIndex, checkScrollBounds])

  // Save position only when index changes (debounced)
  useEffect(() => {
    if (!hasRestoredRef.current || currentIndex === lastSavedIndexRef.current) {
      return
    }

    const timeoutId = setTimeout(() => {
      simpleScrollManager.save(currentIndex, pathname)
      lastSavedIndexRef.current = currentIndex
    }, 1000) // Debounce saves by 1 second

    return () => clearTimeout(timeoutId)
  }, [currentIndex, pathname])

  // Keyboard navigation
  useKeyboardNavigation({
    onPrevious: () => {
      UmamiEvents.galleryNavigation(
        'keyboard-left',
        currentIndex,
        Math.max(0, currentIndex - 1)
      )
      scrollToImage('left')
    },
    onNext: () => {
      UmamiEvents.galleryNavigation(
        'keyboard-right',
        currentIndex,
        Math.min(designs.length - 1, currentIndex + 1)
      )
      scrollToImage('right')
    },
    onEnter: () => {
      const currentDesign = designs[currentIndex]
      if (currentDesign) {
        UmamiEvents.viewProject(currentDesign.title, currentDesign.year)
      }
    },
    enabled: true,
  })

  return (
    <>
      <NavigationArrows
        canScrollLeft={canScrollLeft && currentIndex > 0}
        canScrollRight={canScrollRight && currentIndex < designs.length - 1}
        onScrollLeft={() => {
          UmamiEvents.galleryNavigation(
            'arrow-left',
            currentIndex,
            Math.max(0, currentIndex - 1)
          )
          scrollToImage('left')
        }}
        onScrollRight={() => {
          UmamiEvents.galleryNavigation(
            'arrow-right',
            currentIndex,
            Math.min(designs.length - 1, currentIndex + 1)
          )
          scrollToImage('right')
        }}
        showOnMobile={false}
      />

      <div className="desktop-gallery">
        <div ref={scrollContainerRef} className="desktop-gallery-track">
          {designs.map((design, index) => (
            <DesktopGalleryItem
              key={design._id}
              design={design}
              index={index}
              isActive={index === currentIndex}
              onNavigate={() => {
                // Save current position immediately before navigating
                simpleScrollManager.save(currentIndex, pathname)
                lastSavedIndexRef.current = currentIndex
              }}
            />
          ))}
        </div>
      </div>
    </>
  )
}
