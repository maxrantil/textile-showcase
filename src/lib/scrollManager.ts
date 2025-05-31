// Create src/lib/scrollManager.ts
'use client'

export const scrollManager = {
  save: (scrollLeft: number) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('gallery-scroll-position', scrollLeft.toString())
      console.log('Saved scroll position:', scrollLeft)
    }
  },

  restore: (container: HTMLElement): boolean => {
    if (typeof window === 'undefined' || !container) return false
    
    const saved = sessionStorage.getItem('gallery-scroll-position')
    if (saved) {
      const scrollLeft = parseInt(saved, 10)
      if (!isNaN(scrollLeft)) {
        console.log('Restoring scroll position:', scrollLeft)
        // Set scroll position immediately and synchronously
        // Also disable smooth scrolling temporarily to ensure instant positioning
        const originalBehavior = container.style.scrollBehavior
        container.style.scrollBehavior = 'auto'
        container.scrollLeft = scrollLeft
        // Restore original scroll behavior after a frame
        requestAnimationFrame(() => {
          container.style.scrollBehavior = originalBehavior
        })
        return true
      }
    }
    return false
  },

  // NEW: Get the saved scroll position without restoring
  getSavedPosition: (): number | null => {
    if (typeof window === 'undefined') return null
    
    const saved = sessionStorage.getItem('gallery-scroll-position')
    if (saved) {
      const scrollLeft = parseInt(saved, 10)
      return !isNaN(scrollLeft) ? scrollLeft : null
    }
    return null
  },

  // NEW: Save immediately without debouncing - for urgent saves
  saveImmediate: (scrollLeft: number) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('gallery-scroll-position', scrollLeft.toString())
      console.log('Saved scroll position (immediate):', scrollLeft)
    }
  },

  clear: () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('gallery-scroll-position')
    }
  }
}
