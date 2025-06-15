// src/lib/scrollManager.ts - Updated version
'use client'

import { debounce } from '@/utils/performance'

interface ScrollPosition {
  index: number
  timestamp: number
}

interface ScrollState {
  [key: string]: ScrollPosition
}

class EnhancedScrollManager {
  private storageKey = 'gallery-scroll-positions-v3'
  private isNavigating = false
  private lastSavedIndex: number | null = null
  private hasVisitedGallery = false
  private debouncedSave: ReturnType<typeof debounce>
  private isRestoring = false // Add this flag

  constructor() {
    this.debouncedSave = debounce((...args: unknown[]) => {
      const index = args[0] as number
      const path = args[1] as string
      this.saveImmediate(index, path)
    }, 500) // Increase debounce time

    if (typeof window !== 'undefined') {
      this.setupNavigationListeners()
      this.cleanupOldPositions()
      this.checkFirstVisit()
    }
  }

  private checkFirstVisit() {
    this.hasVisitedGallery =
      sessionStorage.getItem('gallery-visited') === 'true'
  }

  private markGalleryVisited() {
    if (!this.hasVisitedGallery) {
      sessionStorage.setItem('gallery-visited', 'true')
      this.hasVisitedGallery = true
    }
  }

  private setupNavigationListeners() {
    window.addEventListener('gallery-navigation-start', () => {
      this.isNavigating = true
    })

    window.addEventListener('gallery-navigation-complete', () => {
      setTimeout(() => {
        this.isNavigating = false
      }, 300)
    })

    window.addEventListener('beforeunload', this.handlePageUnload.bind(this))
  }

  private handlePageUnload = () => {
    const currentIndexElement = document.querySelector(
      '[data-current-index]'
    ) as HTMLElement | null
    if (currentIndexElement?.dataset.currentIndex) {
      const currentIndex = parseInt(
        currentIndexElement.dataset.currentIndex,
        10
      )
      this.saveImmediate(currentIndex, window.location.pathname)
    }
  }

  save(currentIndex: number, path?: string): void {
    // Don't save if we're navigating, restoring, or if index hasn't changed
    if (
      this.isNavigating ||
      this.isRestoring ||
      currentIndex === this.lastSavedIndex
    ) {
      return
    }

    this.markGalleryVisited()
    this.debouncedSave(currentIndex, path || window.location.pathname)
  }

  saveImmediate(currentIndex: number, path?: string): void {
    if (typeof window === 'undefined' || this.isRestoring) return

    const currentPath = this.normalizePath(path || window.location.pathname)
    this.markGalleryVisited()

    // Only save if the index has actually changed
    if (this.lastSavedIndex === currentIndex) {
      return
    }

    const positions = this.getAllPositions()

    positions[currentPath] = {
      index: currentIndex,
      timestamp: Date.now(),
    }

    if (currentPath === '/') {
      positions['gallery'] = positions[currentPath]
    }

    this.lastSavedIndex = currentIndex

    try {
      sessionStorage.setItem(this.storageKey, JSON.stringify(positions))
      if (process.env.NODE_ENV === 'development') {
        console.log(`💾 Saved current index for ${currentPath}:`, currentIndex)
      }
    } catch (error) {
      console.warn('Failed to save scroll position:', error)
    }
  }

  getSavedIndex(path?: string): number | null {
    if (typeof window === 'undefined') return null

    const currentPath = this.normalizePath(path || window.location.pathname)

    // Only log this once per session to reduce noise
    if (process.env.NODE_ENV === 'development' && !this.isRestoring) {
      console.log(`🔍 Getting saved index for path: ${currentPath}`)
    }

    if (!this.hasVisitedGallery && currentPath === '/') {
      this.markGalleryVisited()
      return 0
    }

    const positions = this.getAllPositions()
    const savedPosition =
      positions[currentPath] || positions['gallery'] || positions['/']

    if (savedPosition) {
      return savedPosition.index
    }

    return this.lastSavedIndex || 0
  }

  startRestoration(): void {
    this.isRestoring = true
  }

  completeRestoration(): void {
    this.isRestoring = false
  }

  private normalizePath(path: string): string {
    if (!path || path === '/') return '/'
    return path.replace(/\/$/, '')
  }

  private getAllPositions(): ScrollState {
    if (typeof window === 'undefined') return {}

    try {
      const saved = sessionStorage.getItem(this.storageKey)
      return saved ? JSON.parse(saved) : {}
    } catch (error) {
      console.warn('Failed to parse saved scroll positions:', error)
      return {}
    }
  }

  clear(path?: string): void {
    if (typeof window === 'undefined') return

    if (path) {
      const normalizedPath = this.normalizePath(path)
      const positions = this.getAllPositions()
      delete positions[normalizedPath]
      sessionStorage.setItem(this.storageKey, JSON.stringify(positions))
    } else {
      sessionStorage.removeItem(this.storageKey)
      sessionStorage.removeItem('gallery-visited')
      this.hasVisitedGallery = false
    }
  }

  private cleanupOldPositions(): void {
    const positions = this.getAllPositions()
    const now = Date.now()
    const maxAge = 24 * 60 * 60 * 1000

    let hasChanges = false
    for (const [path, position] of Object.entries(positions)) {
      if (now - position.timestamp > maxAge) {
        delete positions[path]
        hasChanges = true
      }
    }

    if (hasChanges) {
      sessionStorage.setItem(this.storageKey, JSON.stringify(positions))
    }
  }

  triggerNavigationStart(): void {
    this.isNavigating = true
    window.dispatchEvent(new Event('gallery-navigation-start'))
  }

  triggerNavigationComplete(): void {
    setTimeout(() => {
      this.isNavigating = false
      window.dispatchEvent(new Event('gallery-navigation-complete'))
    }, 100)
  }

  debug(): void {
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 All saved scroll positions:', this.getAllPositions())
      console.log('📊 Last saved index:', this.lastSavedIndex)
      console.log('📊 Has visited gallery:', this.hasVisitedGallery)
      console.log('📊 Is navigating:', this.isNavigating)
      console.log('📊 Is restoring:', this.isRestoring)
    }
  }
}

export const scrollManager = new EnhancedScrollManager()
