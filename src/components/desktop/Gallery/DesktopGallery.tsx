'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useKeyboardNavigation } from '@/hooks/desktop/useKeyboardNavigation'
import { DesktopGalleryItem } from './DesktopGalleryItem'
import { NavigationArrows } from '@/components/ui/NavigationArrows'
import { TextileDesign } from '@/sanity/types'
import { UmamiEvents } from '@/utils/analytics'
import { scrollManager } from '@/lib/scrollManager'

interface DesktopGalleryProps {
  designs: TextileDesign[]
}

export function DesktopGallery({ designs }: DesktopGalleryProps) {
  const pathname = usePathname()
  const router = useRouter()
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const isScrollingRef = useRef(false)
  const hasRestoredRef = useRef(false)
  const lastSavedIndexRef = useRef<number>(-1)
  const [isRestoring, setIsRestoring] = useState(true)

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

    for (let i = 0; i < items.length && i < designs.length; i++) {
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

      // Update container attribute for scroll manager
      container.setAttribute('data-current-index', closestIndex.toString())
    }
  }, [currentIndex, designs.length])

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

    const restorePosition = async () => {
      try {
        setIsRestoring(true)

        const savedIndex = await scrollManager.restore(pathname)

        if (
          savedIndex !== null &&
          savedIndex >= 0 &&
          savedIndex < designs.length
        ) {
          // Restore to saved position
          setTimeout(() => {
            scrollToIndex(savedIndex, true)
            hasRestoredRef.current = true
            lastSavedIndexRef.current = savedIndex
            setIsRestoring(false)

            if (process.env.NODE_ENV === 'development') {
              console.log(`🔄 Desktop Gallery restored to index ${savedIndex}`)
            }
          }, 200)
        } else {
          // No saved position, start at beginning
          hasRestoredRef.current = true
          lastSavedIndexRef.current = 0
          setIsRestoring(false)
          setTimeout(checkScrollBounds, 100)
        }
      } catch (error) {
        console.warn('Failed to restore desktop gallery position:', error)
        hasRestoredRef.current = true
        setIsRestoring(false)
        setTimeout(checkScrollBounds, 100)
      }
    }

    restorePosition()
  }, [pathname, designs.length, scrollToIndex, checkScrollBounds])

  // Save position when index changes (debounced)
  useEffect(() => {
    if (!hasRestoredRef.current || currentIndex === lastSavedIndexRef.current) {
      return
    }

    const timeoutId = setTimeout(() => {
      scrollManager.save(currentIndex, pathname)
      lastSavedIndexRef.current = currentIndex
    }, 1000)

    return () => clearTimeout(timeoutId)
  }, [currentIndex, pathname])

  // Enhanced navigation function that opens projects
  const navigateToProject = useCallback(
    (design: TextileDesign) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(
          `🎹 Opening project: ${design.title} at index ${currentIndex}`
        )
      }

      // Save current position before navigating
      scrollManager.saveImmediate(currentIndex, pathname)
      lastSavedIndexRef.current = currentIndex

      // Track analytics
      UmamiEvents.viewProject(design.title, design.year)
      UmamiEvents.galleryNavigation(
        'keyboard-enter',
        currentIndex,
        currentIndex
      )

      // Navigate to project
      scrollManager.triggerNavigationStart()
      router.push(`/project/${design.slug?.current || design._id}`)
    },
    [currentIndex, pathname, router]
  )

  // Keyboard navigation
  useKeyboardNavigation({
    onPrevious: () => {
      UmamiEvents.galleryNavigation(
        'keyboard-left',
        currentIndex,
        Math.max(currentIndex - 1, 0)
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
        navigateToProject(currentDesign)
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
        <div
          ref={scrollContainerRef}
          className="desktop-gallery-track"
          data-scroll-container="true"
          data-current-index={currentIndex.toString()}
          style={{
            opacity: isRestoring ? 0 : 1,
            transition: isRestoring ? 'none' : 'opacity 0.4s ease',
          }}
        >
          {designs.map((design, index) => (
            <DesktopGalleryItem
              key={design._id}
              design={design}
              index={index}
              isActive={index === currentIndex}
              onNavigate={() => {
                // Save current position immediately before navigating
                scrollManager.saveImmediate(currentIndex, pathname)
                lastSavedIndexRef.current = currentIndex
              }}
            />
          ))}
        </div>
      </div>
    </>
  )
}
