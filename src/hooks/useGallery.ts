'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { TextileDesign } from '@/types/sanity'
import { scrollManager } from '@/lib/scrollManager'

interface UseGalleryProps {
  designs: TextileDesign[]
  onIndexChange?: (index: number) => void
}

interface UseGalleryReturn {
  // Refs
  scrollContainerRef: React.RefObject<HTMLDivElement>
  
  // State
  currentIndex: number
  canScrollLeft: boolean
  canScrollRight: boolean
  isRestoring: boolean
  
  // Actions
  scrollToImage: (direction: 'left' | 'right') => void
  scrollToIndex: (index: number, instant?: boolean) => void
  handleImageClick: (design: TextileDesign) => void
  handlePageNavigation: (path: string) => void
  
  // Setters (for external control)
  setCurrentIndex: (index: number) => void
}

export function useGallery({ 
  designs, 
  onIndexChange 
}: UseGalleryProps): UseGalleryReturn {
  const router = useRouter()
  const pathname = usePathname()
  
  // Refs
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const realTimeCurrentIndex = useRef(0)
  const isFirstMount = useRef(true)
  const restorationAttempted = useRef(false)
  const isUpdatingRef = useRef(false)
  const lastClick = useRef(0)
  
  // State
  const [currentIndex, setCurrentIndex] = useState(0)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const [isRestoring, setIsRestoring] = useState(true)

  // Update real-time index when state changes
  useEffect(() => {
    realTimeCurrentIndex.current = currentIndex
    onIndexChange?.(currentIndex)
  }, [currentIndex, onIndexChange])

  // Scroll position detection
  const checkScrollPosition = useCallback(() => {
    const container = scrollContainerRef.current
    if (!container || isUpdatingRef.current) return

    const { scrollLeft, scrollWidth, clientWidth } = container
    setCanScrollLeft(scrollLeft > 10)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
    
    const items = container.children
    if (items.length === 0) return
    
    const viewportCenter = scrollLeft + (clientWidth / 2)
    let closestIndex = 0
    let closestDistance = Infinity
    
    for (let i = 0; i < items.length && i < designs.length; i++) {
      const item = items[i] as HTMLElement
      const itemCenter = item.offsetLeft + (item.offsetWidth / 2)
      const distance = Math.abs(viewportCenter - itemCenter)
      
      if (distance < closestDistance) {
        closestDistance = distance
        closestIndex = i
      }
    }
    
    if (closestIndex !== currentIndex) {
      setCurrentIndex(closestIndex)
      if (scrollContainerRef.current) {
        scrollContainerRef.current.setAttribute('data-current-index', closestIndex.toString())
      }
    }
  }, [designs.length, currentIndex])

  // Scroll to specific image
  const scrollToImage = useCallback((direction: 'left' | 'right') => {
    const container = scrollContainerRef.current
    if (!container) return

    isUpdatingRef.current = true
    
    const targetIndex = direction === 'left' 
      ? Math.max(0, currentIndex - 1)
      : Math.min(designs.length - 1, currentIndex + 1)
    
    setCurrentIndex(targetIndex)
    realTimeCurrentIndex.current = targetIndex
    
    const items = container.children
    const targetItem = items[targetIndex] as HTMLElement
    
    if (targetItem) {
      const itemCenter = targetItem.offsetLeft + (targetItem.offsetWidth / 2)
      const viewportCenter = container.clientWidth / 2
      const targetScroll = itemCenter - viewportCenter
      
      container.scrollTo({ 
        left: Math.max(0, targetScroll),
        behavior: 'smooth' 
      })
    }

    setTimeout(() => {
      isUpdatingRef.current = false
    }, 700)
  }, [currentIndex, designs.length])

  // Scroll to specific index
  const scrollToIndex = useCallback((index: number, instant: boolean = false) => {
    const container = scrollContainerRef.current
    if (!container || index < 0 || index >= designs.length) return

    if (!instant) {
      isUpdatingRef.current = true
    }
    
    setCurrentIndex(index)
    realTimeCurrentIndex.current = index
    
    const items = container.children
    const targetItem = items[index] as HTMLElement
    
    if (targetItem) {
      const itemCenter = targetItem.offsetLeft + (targetItem.offsetWidth / 2)
      const viewportCenter = container.clientWidth / 2
      const targetScroll = itemCenter - viewportCenter
      
      if (instant) {
        const originalBehavior = container.style.scrollBehavior
        container.style.scrollBehavior = 'auto'
        container.scrollLeft = Math.max(0, targetScroll)
        
        setTimeout(() => {
          container.style.scrollBehavior = originalBehavior
          container.dispatchEvent(new Event('scroll'))
        }, 10)
      } else {
        container.scrollTo({ 
          left: Math.max(0, targetScroll),
          behavior: 'smooth' 
        })
      }
    }

    if (!instant) {
      setTimeout(() => {
        isUpdatingRef.current = false
      }, 700)
    }
  }, [designs.length])

  // Handle image click navigation
  const handleImageClick = useCallback((design: TextileDesign) => {
    const now = Date.now()
    if (now - lastClick.current < 300) return
    lastClick.current = now

    if (!isFirstMount.current) {
      scrollManager.saveImmediate(realTimeCurrentIndex.current, pathname)
    }
    
    scrollManager.triggerNavigationStart()
    router.push(`/project/${design.slug?.current || design._id}`)
  }, [router, pathname])

  // Handle page navigation
  const handlePageNavigation = useCallback((path: string) => {
    const now = Date.now()
    if (now - lastClick.current < 300) return
    lastClick.current = now

    scrollManager.triggerNavigationStart()
    if (!isFirstMount.current) {
      scrollManager.saveImmediate(realTimeCurrentIndex.current, pathname)
    }
    router.push(path)
  }, [router, pathname])

  // Restoration logic
  const attemptRestoration = useCallback((attempt: number = 1) => {
    if (restorationAttempted.current) return
    
    const savedIndex = scrollManager.getSavedIndex(pathname)
    
    if (savedIndex !== null && savedIndex >= 0 && savedIndex < designs.length) {
      setCurrentIndex(savedIndex)
      realTimeCurrentIndex.current = savedIndex
      scrollContainerRef.current?.setAttribute('data-current-index', savedIndex.toString())
      
      scrollToIndex(savedIndex, true)
      restorationAttempted.current = true
      
      setTimeout(() => setIsRestoring(false), 50)
    } else if (attempt < 3) {
      setTimeout(() => attemptRestoration(attempt + 1), 50 * attempt)
    } else {
      setCurrentIndex(0)
      realTimeCurrentIndex.current = 0
      scrollContainerRef.current?.setAttribute('data-current-index', '0')
      
      scrollToIndex(0, true)
      restorationAttempted.current = true
      
      setTimeout(() => setIsRestoring(false), 50)
    }
  }, [pathname, designs.length, scrollToIndex])

  // Setup container and restoration
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container || designs.length === 0) return

    container.setAttribute('data-scroll-container', 'true')
    container.setAttribute('data-current-index', '0')
    
    attemptRestoration()
  }, [pathname, designs.length, attemptRestoration])

  // Setup scroll listener
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    let ticking = false
    const handleScroll = () => {
      if (!ticking && !isUpdatingRef.current) {
        requestAnimationFrame(() => {
          checkScrollPosition()
          ticking = false
        })
        ticking = true
      }
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    
    const handleResize = () => {
      if (!isUpdatingRef.current) {
        setTimeout(checkScrollPosition, 200)
      }
    }
    window.addEventListener('resize', handleResize)
    
    return () => {
      container.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleResize)
    }
  }, [checkScrollPosition])

  // Index saving
  useEffect(() => {
    if (!restorationAttempted.current || isFirstMount.current) return

    let isNavigating = false

    const stopSaving = () => { isNavigating = true }
    const resumeSaving = () => { 
      setTimeout(() => { isNavigating = false }, 200) 
    }

    window.addEventListener('gallery-navigation-start', stopSaving)
    window.addEventListener('gallery-navigation-complete', resumeSaving)

    if (!isNavigating) {
      scrollManager.save(realTimeCurrentIndex.current, pathname)
    }

    return () => {
      window.removeEventListener('gallery-navigation-start', stopSaving)
      window.removeEventListener('gallery-navigation-complete', resumeSaving)
      if (!isNavigating) {
        scrollManager.saveImmediate(realTimeCurrentIndex.current, pathname)
      }
    }
  }, [currentIndex, pathname])

  // Mark first mount complete
  useEffect(() => {
    const timer = setTimeout(() => {
      isFirstMount.current = false
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

  // Reset on design changes
  useEffect(() => {
    realTimeCurrentIndex.current = 0
    isFirstMount.current = true
    restorationAttempted.current = false
    setIsRestoring(true)
  }, [designs])

  return {
    scrollContainerRef,
    currentIndex,
    canScrollLeft,
    canScrollRight,
    isRestoring,
    scrollToImage,
    scrollToIndex,
    handleImageClick,
    handlePageNavigation,
    setCurrentIndex
  }
}
