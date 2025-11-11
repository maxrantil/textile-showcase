// ABOUTME: Horizontal scrolling carousel gallery for homepage
// Restores original carousel functionality with scroll restoration and keyboard nav

'use client'

import { useEffect, useRef, useState, useCallback, memo } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Image from 'next/image'
import { TextileDesign } from '@/types/textile'
import { getOptimizedImageUrl } from '@/utils/image-helpers'
import { UmamiEvents } from '@/utils/analytics'
import { scrollManager } from '@/lib/scrollManager'
import { NavigationArrows } from '@/components/ui/NavigationArrows'

interface GalleryProps {
  designs: TextileDesign[]
}

// Gallery Item Component
const GalleryItem = memo(function GalleryItem({
  design,
  index,
  isActive,
  onNavigate,
}: {
  design: TextileDesign
  index: number
  isActive: boolean
  onNavigate?: (clickedIndex: number) => void
}) {
  const router = useRouter()

  const handleClick = () => {
    onNavigate?.(index)
    UmamiEvents.viewProject(design.title, design.year)
    router.push(`/project/${design.slug?.current || design._id}`)
  }

  const imageSource = design.image || design.images?.[0]?.asset
  const imageUrl = imageSource
    ? getOptimizedImageUrl(imageSource, {
        height: 700,
        quality: 75,
        format: 'webp',
        fit: 'crop',
      })
    : ''

  const displayImageUrl = imageUrl || '/images/placeholder.jpg'

  return (
    <div
      className={`desktop-gallery-item ${isActive ? 'active' : ''}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label={`View ${design.title}${design.year ? ` from ${design.year}` : ''} project details`}
      data-testid={`gallery-item-${index}`}
      data-active={isActive}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleClick()
        }
      }}
    >
      <div className="desktop-gallery-image">
        <Image
          src={displayImageUrl}
          alt={design.title}
          height={600}
          width={800}
          sizes="(max-width: 1024px) 90vw, (max-width: 1440px) 800px, 900px"
          style={{
            width: 'auto',
            height: '60vh',
            objectFit: 'contain',
          }}
          priority={index < 2}
          loading={index < 2 ? 'eager' : 'lazy'}
          className="desktop-gallery-img"
        />
      </div>

      <div className="desktop-gallery-info">
        <h3>{design.title}</h3>
      </div>
    </div>
  )
})

// Main Gallery Component
export default function Gallery({ designs }: GalleryProps) {
  const pathname = usePathname()
  const router = useRouter()
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const isScrollingRef = useRef(false)
  const hasRestoredRef = useRef(false)
  const mountTimeRef = useRef(Date.now()) // Track when component mounts
  const focusTimeoutRef = useRef<NodeJS.Timeout | null>(null) // Track focus management timeout for cleanup

  // Phase 4: Hide static first image AFTER first gallery image loads AND minimum display time
  // Issue #132: Ensures FirstImage visible for minimum 300ms (allows E2E tests to verify + prevents CLS flash)
  useEffect(() => {
    const MIN_DISPLAY_TIME = 300 // ms - minimum time FirstImage must be visible

    const hideFirstImage = () => {
      const staticFirstImage = document.querySelector(
        '[data-first-image="true"]'
      ) as HTMLElement
      if (staticFirstImage) {
        staticFirstImage.style.visibility = 'hidden'
        staticFirstImage.style.pointerEvents = 'none'
      }
    }

    const hideWithMinimumTime = () => {
      const elapsed = Date.now() - mountTimeRef.current
      const remaining = Math.max(0, MIN_DISPLAY_TIME - elapsed)

      // Ensure FirstImage visible for at least 300ms
      setTimeout(hideFirstImage, remaining)
    }

    // Wait for first gallery image to load before hiding FirstImage
    const firstGalleryImg = document.querySelector(
      '.desktop-gallery-img'
    ) as HTMLImageElement

    if (firstGalleryImg) {
      if (firstGalleryImg.complete && firstGalleryImg.naturalWidth > 0) {
        // Image already loaded - hide after minimum time
        hideWithMinimumTime()
      } else {
        // Wait for image load, then hide after minimum time
        firstGalleryImg.addEventListener('load', hideWithMinimumTime, {
          once: true,
        })

        // Fallback: hide after 15s regardless (safety net for very slow networks)
        const fallbackTimer = setTimeout(hideFirstImage, 15000)

        return () => {
          firstGalleryImg.removeEventListener('load', hideWithMinimumTime)
          clearTimeout(fallbackTimer)
        }
      }
    } else {
      // Gallery not rendered yet, use fallback timer
      const fallbackTimer = setTimeout(hideFirstImage, 15000)
      return () => clearTimeout(fallbackTimer)
    }
  }, [])

  // Scroll to specific index
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

  // Restore scroll position and focus
  useEffect(() => {
    if (designs.length === 0 || hasRestoredRef.current) return

    const restorePosition = async () => {
      try {
        const savedIndex = await scrollManager.restore(pathname ?? undefined)

        if (
          savedIndex !== null &&
          savedIndex >= 0 &&
          savedIndex < designs.length
        ) {
          setTimeout(() => {
            scrollToIndex(savedIndex, true)
            hasRestoredRef.current = true

            // Restore focus after scroll restoration
            const savedFocusIndex = sessionStorage.getItem('galleryFocusIndex')
            if (savedFocusIndex !== null && pathname === '/') {
              const focusIndex = parseInt(savedFocusIndex, 10)

              // Additional delay to ensure DOM is ready
              setTimeout(() => {
                const galleryItem = document.querySelector(
                  `[data-testid="gallery-item-${focusIndex}"]`
                ) as HTMLElement

                if (galleryItem) {
                  galleryItem.focus()
                  sessionStorage.removeItem('galleryFocusIndex')
                }
              }, 200)
            }
          }, 150)
        } else {
          hasRestoredRef.current = true
          setTimeout(checkScrollBounds, 100)

          // Still try to restore focus even if no scroll position
          const savedFocusIndex = sessionStorage.getItem('galleryFocusIndex')
          if (savedFocusIndex !== null && pathname === '/') {
            const focusIndex = parseInt(savedFocusIndex, 10)

            setTimeout(() => {
              const galleryItem = document.querySelector(
                `[data-testid="gallery-item-${focusIndex}"]`
              ) as HTMLElement

              if (galleryItem) {
                galleryItem.focus()
                sessionStorage.removeItem('galleryFocusIndex')
              }
            }, 200)
          }
        }
      } catch {
        hasRestoredRef.current = true
        setTimeout(checkScrollBounds, 100)
      }
    }

    restorePosition()
  }, [designs.length, pathname, scrollToIndex, checkScrollBounds])

  // Save position and focus before navigation
  const handleNavigate = useCallback((clickedIndex?: number) => {
    // Use clicked index if provided, otherwise use currentIndex (for keyboard navigation)
    const indexToSave = clickedIndex !== undefined ? clickedIndex : currentIndex
    scrollManager.saveImmediate(indexToSave, pathname ?? undefined)
    // Save current focused element index for restoration
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('galleryFocusIndex', indexToSave.toString())
    }
  }, [pathname, currentIndex])

  // Keyboard navigation (with vim keybindings)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't interfere with form inputs or when user is typing
      const target = e.target as HTMLElement
      const isTypingContext =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target?.contentEditable === 'true'

      if (isTypingContext) return

      // Left navigation: ArrowLeft or h (vim)
      if (e.key === 'ArrowLeft' || e.key === 'h') {
        e.preventDefault()
        const newIndex = Math.max(0, currentIndex - 1)
        scrollToImage('left')

        // Clear any pending focus timeout (handles rapid key presses)
        if (focusTimeoutRef.current) {
          clearTimeout(focusTimeoutRef.current)
        }

        // Move focus to newly centered item after scroll animation completes
        // Delay matches scroll animation duration (600ms from line 182-184)
        focusTimeoutRef.current = setTimeout(() => {
          const newItem = document.querySelector(
            `[data-testid="gallery-item-${newIndex}"]`
          ) as HTMLElement

          if (newItem) {
            // Use preventScroll to avoid triggering additional scroll
            newItem.focus({ preventScroll: true })
          }

          focusTimeoutRef.current = null
        }, 600)
      }
      // Right navigation: ArrowRight or l (vim)
      else if (e.key === 'ArrowRight' || e.key === 'l') {
        e.preventDefault()
        const newIndex = Math.min(designs.length - 1, currentIndex + 1)
        scrollToImage('right')

        // Clear any pending focus timeout (handles rapid key presses)
        if (focusTimeoutRef.current) {
          clearTimeout(focusTimeoutRef.current)
        }

        // Move focus to newly centered item after scroll animation completes
        // Delay matches scroll animation duration (600ms from line 182-184)
        focusTimeoutRef.current = setTimeout(() => {
          const newItem = document.querySelector(
            `[data-testid="gallery-item-${newIndex}"]`
          ) as HTMLElement

          if (newItem) {
            // Use preventScroll to avoid triggering additional scroll
            newItem.focus({ preventScroll: true })
          }

          focusTimeoutRef.current = null
        }, 600)
      }
      // Enter or Space to open project
      else if ((e.key === 'Enter' || e.key === ' ') && designs[currentIndex]) {
        e.preventDefault()
        // Save current scroll position before navigating
        handleNavigate()
        const design = designs[currentIndex]
        router.push(`/project/${design.slug?.current || design._id}`)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      // Cleanup focus timeout on unmount
      if (focusTimeoutRef.current) {
        clearTimeout(focusTimeoutRef.current)
      }
    }
  }, [currentIndex, designs, router, scrollToImage, handleNavigate])

  if (!designs || designs.length === 0) {
    return (
      <div className="gallery-loading">
        <p>No designs available at the moment.</p>
      </div>
    )
  }

  return (
    <>
      <NavigationArrows
        canScrollLeft={canScrollLeft && currentIndex > 0}
        canScrollRight={canScrollRight && currentIndex < designs.length - 1}
        onScrollLeft={() => scrollToImage('left')}
        onScrollRight={() => scrollToImage('right')}
        variant="gallery"
        position="fixed"
        showOnMobile={false}
      />

      <div className="desktop-gallery" data-testid="desktop-gallery">
        <div
          className="desktop-gallery-track"
          ref={scrollContainerRef}
          data-scroll-container="true"
          data-current-index={currentIndex.toString()}
        >
          {designs.map((design, index) => (
            <GalleryItem
              key={design._id}
              design={design}
              index={index}
              isActive={index === currentIndex}
              onNavigate={handleNavigate}
            />
          ))}
        </div>
      </div>
    </>
  )
}
