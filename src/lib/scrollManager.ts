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
  private debounceTimeout: NodeJS.Timeout | null = null
  private isNavigating = false
  private lastSavedIndex: number | null = null
  private hasVisitedGallery = false
  private debouncedSave: ReturnType<typeof debounce>

  constructor() {
    // Fix the debounce typing issue
    this.debouncedSave = debounce((...args: unknown[]) => {
      const index = args[0] as number
      const path = args[1] as string
      this.saveImmediate(index, path)
    }, 300)
    
    if (typeof window !== 'undefined') {
      this.setupNavigationListeners()
      this.cleanupOldPositions()
      this.checkFirstVisit()
    }
  }

  private checkFirstVisit() {
    this.hasVisitedGallery = sessionStorage.getItem('gallery-visited') === 'true'
    if (!this.hasVisitedGallery) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🆕 First visit to gallery - will start from beginning')
      }
    }
  }

  private markGalleryVisited() {
    if (!this.hasVisitedGallery) {
      sessionStorage.setItem('gallery-visited', 'true')
      this.hasVisitedGallery = true
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Marked gallery as visited')
      }
    }
  }

  private setupNavigationListeners() {
    window.addEventListener('gallery-navigation-start', () => {
      this.isNavigating = true
      if (process.env.NODE_ENV === 'development') {
        console.log('🚫 Navigation started - stopping scroll saves')
      }
    })

    window.addEventListener('gallery-navigation-complete', () => {
      setTimeout(() => {
        this.isNavigating = false
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Navigation complete - resuming scroll saves')
        }
      }, 300)
    })

    window.addEventListener('beforeunload', this.handlePageUnload.bind(this))
    window.addEventListener('popstate', this.handlePopState.bind(this))
  }

  private handlePageUnload = () => {
    const currentIndexElement = document.querySelector('[data-current-index]') as HTMLElement | null
    if (currentIndexElement?.dataset.currentIndex) {
      const currentIndex = parseInt(currentIndexElement.dataset.currentIndex, 10)
      this.saveImmediate(currentIndex, window.location.pathname)
    }
  }

  private handlePopState = () => {
    setTimeout(() => {
      window.dispatchEvent(new Event('gallery-navigation-complete'))
    }, 50)
  }

  save(currentIndex: number, path?: string): void {
    if (this.isNavigating) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🚫 Navigation in progress, skipping save for index:', currentIndex)
      }
      return
    }

    this.markGalleryVisited()
    this.lastSavedIndex = currentIndex
    
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout)
    }

    this.debouncedSave(currentIndex, path || window.location.pathname)
  }

  saveImmediate(currentIndex: number, path?: string): void {
    if (typeof window === 'undefined') return

    const currentPath = this.normalizePath(path || window.location.pathname)
    
    this.markGalleryVisited()
    
    const positions = this.getAllPositions()
    
    positions[currentPath] = {
      index: currentIndex,
      timestamp: Date.now()
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
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔍 Getting saved index for path: ${currentPath}`)
      console.log(`🔍 Has visited gallery before: ${this.hasVisitedGallery}`)
    }
    
    if (!this.hasVisitedGallery && currentPath === '/') {
      if (process.env.NODE_ENV === 'development') {
        console.log('🆕 First visit - returning index 0')
      }
      this.markGalleryVisited()
      return 0
    }

    const pathsToTry = [
      currentPath,
      currentPath === '/' ? 'gallery' : currentPath,
      '/',
      'gallery'
    ]

    let savedPosition: ScrollPosition | null = null
    const positions = this.getAllPositions()

    for (const pathToTry of pathsToTry) {
      if (positions[pathToTry]) {
        savedPosition = positions[pathToTry]
        if (process.env.NODE_ENV === 'development') {
          console.log(`🔍 Found saved position for path: ${pathToTry} - index: ${savedPosition.index}`)
        }
        break
      }
    }

    if (!savedPosition && this.lastSavedIndex !== null && this.hasVisitedGallery) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔄 Using last saved index: ${this.lastSavedIndex}`)
      }
      return this.lastSavedIndex
    }
    
    if (savedPosition) {
      return savedPosition.index
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`ℹ️ No saved index found for ${currentPath} - returning 0`)
    }
    return 0
  }

  restore(container: HTMLElement, path?: string): boolean {
    const savedIndex = this.getSavedIndex(path)
    if (savedIndex !== null) {
      container.setAttribute('data-restore-index', savedIndex.toString())
      container.setAttribute('data-restore-instantly', 'true')
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔄 Marked container to restore to index: ${savedIndex}`)
      }
      return true
    }
    return false
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
      if (process.env.NODE_ENV === 'development') {
        console.log('🧹 Cleaned up old scroll positions')
      }
    }
  }

  triggerNavigationStart(): void {
    this.isNavigating = true
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout)
      this.debounceTimeout = null
    }
    window.dispatchEvent(new Event('gallery-navigation-start'))
  }

  triggerNavigationComplete(): void {
    setTimeout(() => {
      this.isNavigating = false
      window.dispatchEvent(new Event('gallery-navigation-complete'))
    }, 50)
  }

  debug(): void {
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 All saved scroll positions:', this.getAllPositions())
      console.log('📊 Last saved index:', this.lastSavedIndex)
      console.log('📊 Has visited gallery:', this.hasVisitedGallery)
      console.log('📊 Is navigating:', this.isNavigating)
    }
  }

  resetFirstVisit(): void {
    sessionStorage.removeItem('gallery-visited')
    this.hasVisitedGallery = false
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 Reset first visit flag')
    }
  }
}

export const scrollManager = new EnhancedScrollManager()
