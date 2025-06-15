// src/lib/simpleScrollManager.ts - Fixed version
'use client'

class SimpleScrollManager {
  private storageKey = 'gallery-positions'
  private isRestoring = false

  save(index: number, path: string = '/'): void {
    if (typeof window === 'undefined' || this.isRestoring) return

    try {
      const positions = this.getAll()

      // Only save if the index actually changed
      if (positions[path]?.index === index) {
        return
      }

      positions[path] = {
        index,
        timestamp: Date.now(),
      }
      sessionStorage.setItem(this.storageKey, JSON.stringify(positions))

      if (process.env.NODE_ENV === 'development') {
        console.log(`💾 Saved position for ${path}:`, index)
      }
    } catch (error) {
      console.warn('Failed to save scroll position:', error)
    }
  }

  get(path: string = '/'): number | null {
    if (typeof window === 'undefined') return null

    try {
      const positions = this.getAll()
      const saved = positions[path]

      if (saved && saved.index >= 0) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`🔍 Found saved position for ${path}:`, saved.index)
        }
        return saved.index
      }
    } catch (error) {
      console.warn('Failed to get scroll position:', error)
    }

    return null
  }

  startRestoration(): void {
    this.isRestoring = true
  }

  endRestoration(): void {
    this.isRestoring = false
  }

  private getAll(): Record<string, { index: number; timestamp: number }> {
    try {
      const saved = sessionStorage.getItem(this.storageKey)
      return saved ? JSON.parse(saved) : {}
    } catch {
      return {}
    }
  }

  clear(path?: string): void {
    if (typeof window === 'undefined') return

    if (path) {
      const positions = this.getAll()
      delete positions[path]
      sessionStorage.setItem(this.storageKey, JSON.stringify(positions))
    } else {
      sessionStorage.removeItem(this.storageKey)
    }
  }
}

export const simpleScrollManager = new SimpleScrollManager()
