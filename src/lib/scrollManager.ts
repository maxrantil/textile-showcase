// src/lib/scrollManager.ts - Fix unused parameter
'use client'

interface ScrollPosition {
  index: number
  timestamp: number
  container?: string
}

interface ScrollState {
  [path: string]: ScrollPosition
}

class ScrollManager {
  private storageKey = 'gallery-scroll-positions-v4'
  private isNavigating = false
  private isRestoring = false
  private restorationPromise: Promise<void> | null = null
  private lastSavedIndex: number | null = null
  private saveTimeout: NodeJS.Timeout | null = null

  constructor() {
    if (typeof window !== 'undefined') {
      this.setupNavigationListeners()
      this.cleanupOldPositions()
    }
  }

  private setupNavigationListeners() {
    // Listen for navigation events
    window.addEventListener('gallery-navigation-start', () => {
      this.isNavigating = true
    })

    window.addEventListener('gallery-navigation-complete', () => {
      setTimeout(() => {
        this.isNavigating = false
      }, 100)
    })

    // Save on page unload
    window.addEventListener('beforeunload', () => {
      this.saveCurrentPosition()
    })

    // Handle popstate (browser back/forward)
    window.addEventListener('popstate', () => {
      setTimeout(() => {
        this.isNavigating = false
      }, 50)
    })
  }

  private saveCurrentPosition() {
    const container = document.querySelector(
      '[data-scroll-container]'
    ) as HTMLElement
    if (container?.dataset.currentIndex) {
      const index = parseInt(container.dataset.currentIndex, 10)
      this.saveImmediate(index, window.location.pathname)
    }
  }

  // Debounced save to prevent excessive storage writes
  save(index: number, path?: string): void {
    if (this.isNavigating || this.isRestoring) return

    // Clear existing timeout
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout)
    }

    // Debounce saves by 300ms
    this.saveTimeout = setTimeout(() => {
      this.saveImmediate(index, path || window.location.pathname)
    }, 300)
  }

  saveImmediate(index: number, path?: string): void {
    if (typeof window === 'undefined' || this.isRestoring) return

    const currentPath = this.normalizePath(path || window.location.pathname)

    // Don't save if index hasn't changed
    if (this.lastSavedIndex === index) return

    const positions = this.getAllPositions()
    positions[currentPath] = {
      index,
      timestamp: Date.now(),
    }

    this.lastSavedIndex = index

    try {
      sessionStorage.setItem(this.storageKey, JSON.stringify(positions))
      if (process.env.NODE_ENV === 'development') {
        console.log(`💾 Saved scroll position for ${currentPath}: ${index}`)
      }
    } catch (error) {
      console.warn('Failed to save scroll position:', error)
    }
  }

  async restore(path?: string): Promise<number | null> {
    if (this.restorationPromise) {
      return this.restorationPromise.then(() => this.getSavedIndex(path))
    }

    this.restorationPromise = this.performRestore()
    return this.restorationPromise.then(() => this.getSavedIndex(path))
  }

  private async performRestore(): Promise<void> {
    this.isRestoring = true

    // Small delay to ensure DOM is ready
    await new Promise((resolve) => setTimeout(resolve, 50))

    this.isRestoring = false
  }

  getSavedIndex(path?: string): number | null {
    if (typeof window === 'undefined') return null

    const currentPath = this.normalizePath(path || window.location.pathname)
    const positions = this.getAllPositions()
    const savedPosition = positions[currentPath]

    if (savedPosition && savedPosition.index >= 0) {
      return savedPosition.index
    }

    return this.lastSavedIndex || 0
  }

  private normalizePath(path: string | null | undefined): string {
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
}

export const scrollManager = new ScrollManager()
