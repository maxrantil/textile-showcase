// src/lib/scrollManager.ts - Updated to match old code functionality
'use client'

interface ScrollPosition {
  index: number // Store item index instead of pixel position
  timestamp: number
}

interface ScrollState {
  [key: string]: ScrollPosition
}

class EnhancedScrollManager {
  private storageKey = 'gallery-scroll-positions-v3' // Updated version
  private debounceTimeout: NodeJS.Timeout | null = null
  private isNavigating = false
  private lastSavedIndex: number | null = null
  private hasVisitedGallery = false

  constructor() {
    if (typeof window !== 'undefined') {
      this.setupNavigationListeners()
      this.cleanupOldPositions()
      this.checkFirstVisit()
    }
  }

  private checkFirstVisit() {
    this.hasVisitedGallery = sessionStorage.getItem('gallery-visited') === 'true'
    if (!this.hasVisitedGallery) {
      console.log('🆕 First visit to gallery - will start from beginning')
    }
  }

  private markGalleryVisited() {
    if (!this.hasVisitedGallery) {
      sessionStorage.setItem('gallery-visited', 'true')
      this.hasVisitedGallery = true
      console.log('✅ Marked gallery as visited')
    }
  }

  private setupNavigationListeners() {
    window.addEventListener('gallery-navigation-start', () => {
      this.isNavigating = true
      console.log('🚫 Navigation started - stopping scroll saves')
    })

    window.addEventListener('gallery-navigation-complete', () => {
      setTimeout(() => {
        this.isNavigating = false
        console.log('✅ Navigation complete - resuming scroll saves')
      }, 300)
    })

    window.addEventListener('beforeunload', this.handlePageUnload.bind(this))
    window.addEventListener('popstate', this.handlePopState.bind(this))
  }

  private handlePageUnload = () => {
    // Get current index from the gallery if available
    const currentIndexElement = document.querySelector('[data-current-index]') as HTMLElement
    if (currentIndexElement) {
      const currentIndex = parseInt(currentIndexElement.dataset.currentIndex || '0', 10)
      this.saveImmediate(currentIndex, window.location.pathname)
    }
  }

  private handlePopState = () => {
    setTimeout(() => {
      window.dispatchEvent(new Event('gallery-navigation-complete'))
    }, 50)
  }

  // Save index instead of scroll position
  save(currentIndex: number, path?: string): void {
    if (this.isNavigating) {
      console.log('🚫 Navigation in progress, skipping save')
      return
    }

    this.markGalleryVisited()
    this.lastSavedIndex = currentIndex
    
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout)
    }

    this.debounceTimeout = setTimeout(() => {
      this.saveImmediate(currentIndex, path)
    }, 100)
  }

  // Save index immediately
  saveImmediate(currentIndex: number, path?: string): void {
    if (typeof window === 'undefined') return

    const currentPath = this.normalizePath(path || window.location.pathname)
    
    this.markGalleryVisited()
    
    const positions = this.getAllPositions()
    
    positions[currentPath] = {
      index: currentIndex,
      timestamp: Date.now()
    }

    // Also save the root path explicitly for gallery
    if (currentPath === '/') {
      positions['gallery'] = positions[currentPath]
    }

    this.lastSavedIndex = currentIndex

    try {
      sessionStorage.setItem(this.storageKey, JSON.stringify(positions))
      console.log(`💾 Saved current index for ${currentPath}:`, currentIndex)
    } catch (error) {
      console.warn('Failed to save scroll position:', error)
    }
  }

  // Get saved index for restoration
  getSavedIndex(path?: string): number | null {
    if (typeof window === 'undefined') return null
    
    const currentPath = this.normalizePath(path || window.location.pathname)
    console.log(`🔍 Getting saved index for path: ${currentPath}`)
    console.log(`🔍 Has visited gallery before: ${this.hasVisitedGallery}`)
    
    // If this is the first visit to the gallery, always start from the beginning
    if (!this.hasVisitedGallery && currentPath === '/') {
      console.log('🆕 First visit - returning index 0')
      this.markGalleryVisited()
      return 0
    }

    // Try to find saved position
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
        console.log(`✅ Found saved index for path: ${pathToTry} - index: ${savedPosition.index}`)
        break
      }
    }

    // Use last saved index as fallback (but not for first visit)
    if (!savedPosition && this.lastSavedIndex !== null && this.hasVisitedGallery) {
      console.log(`🔄 Using last saved index: ${this.lastSavedIndex}`)
      return this.lastSavedIndex
    }
    
    if (savedPosition) {
      return savedPosition.index
    }
    
    console.log(`ℹ️ No saved index found for ${currentPath} - returning 0`)
    return 0
  }

  // Legacy method for compatibility - now delegates to gallery for actual scrolling
  restore(container: HTMLElement, path?: string): boolean {
    const savedIndex = this.getSavedIndex(path)
    if (savedIndex !== null) {
      // Store the saved index as a data attribute for the gallery to use
      container.setAttribute('data-restore-index', savedIndex.toString())
      container.setAttribute('data-restore-instantly', 'true')
      console.log(`🔄 Marked container to restore to index: ${savedIndex}`)
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
    const maxAge = 24 * 60 * 60 * 1000 // 24 hours
    
    let hasChanges = false
    for (const [path, position] of Object.entries(positions)) {
      if (now - position.timestamp > maxAge) {
        delete positions[path]
        hasChanges = true
      }
    }
    
    if (hasChanges) {
      sessionStorage.setItem(this.storageKey, JSON.stringify(positions))
      console.log('🧹 Cleaned up old scroll positions')
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
    }, 50)
  }

  // Debug method
  debug(): void {
    console.log('📊 All saved scroll positions:', this.getAllPositions())
    console.log('📊 Last saved index:', this.lastSavedIndex)
    console.log('📊 Has visited gallery:', this.hasVisitedGallery)
    console.log('📊 Gallery visited flag:', sessionStorage.getItem('gallery-visited'))
  }

  // Method to reset for testing
  resetFirstVisit(): void {
    sessionStorage.removeItem('gallery-visited')
    this.hasVisitedGallery = false
    console.log('🔄 Reset first visit flag')
  }
}

export const scrollManager = new EnhancedScrollManager()
