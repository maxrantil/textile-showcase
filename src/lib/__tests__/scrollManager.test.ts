// ABOUTME: Unit tests for ScrollManager — scroll-position persistence via sessionStorage

const STORAGE_KEY = 'gallery-scroll-positions-v4'

type ScrollPositionMap = Record<string, { index: number; timestamp: number }>

function setStoragePositions(data: ScrollPositionMap) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

function getStoragePositions(): ScrollPositionMap {
  const raw = sessionStorage.getItem(STORAGE_KEY)
  return raw ? JSON.parse(raw) : {}
}

// Import type only for typing; actual instance is loaded via require() per test
import type { scrollManager as ScrollManagerInstance } from '../scrollManager'

describe('scrollManager', () => {
  let sm: typeof ScrollManagerInstance

  beforeEach(() => {
    sessionStorage.clear()
    jest.useFakeTimers()
    // Reset module to get a fresh singleton (clears lastSavedIndex, isNavigating, etc.)
    jest.resetModules()
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    sm = require('../scrollManager').scrollManager
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.clearAllTimers()
    sessionStorage.clear()
  })

  describe('saveImmediate', () => {
    it('saves index to sessionStorage for given path', () => {
      sm.saveImmediate(5, '/projects')
      expect(getStoragePositions()['/projects']?.index).toBe(5)
    })

    it('stores a timestamp with the saved position', () => {
      const before = Date.now()
      sm.saveImmediate(3, '/projects')
      expect(getStoragePositions()['/projects'].timestamp).toBeGreaterThanOrEqual(before)
    })

    it('does not save when index has not changed since last save', () => {
      sm.saveImmediate(5, '/projects')
      const ts1 = getStoragePositions()['/projects'].timestamp

      jest.advanceTimersByTime(10)
      sm.saveImmediate(5, '/projects')
      const ts2 = getStoragePositions()['/projects'].timestamp

      expect(ts2).toBe(ts1)
    })

    it('updates storage when index changes', () => {
      sm.saveImmediate(5, '/projects')
      sm.saveImmediate(6, '/projects')
      expect(getStoragePositions()['/projects'].index).toBe(6)
    })

    it('normalizes trailing slash from path', () => {
      sm.saveImmediate(2, '/projects/')
      const positions = getStoragePositions()
      expect(positions['/projects']).toBeDefined()
      expect(positions['/projects/']).toBeUndefined()
    })

    it('stores root path as "/"', () => {
      sm.saveImmediate(0, '/')
      expect(getStoragePositions()['/']).toBeDefined()
    })
  })

  describe('save (debounced)', () => {
    it('does not write to storage immediately', () => {
      sm.save(7, '/projects')
      expect(getStoragePositions()['/projects']).toBeUndefined()
    })

    it('writes to storage after 300ms debounce', () => {
      sm.save(7, '/projects')
      jest.advanceTimersByTime(300)
      expect(getStoragePositions()['/projects']?.index).toBe(7)
    })

    it('debounces multiple rapid saves — only last value persists', () => {
      sm.save(1, '/projects')
      sm.save(2, '/projects')
      sm.save(3, '/projects')
      jest.advanceTimersByTime(300)
      expect(getStoragePositions()['/projects']?.index).toBe(3)
    })
  })

  describe('getSavedIndex', () => {
    it('returns saved index for a known path', () => {
      setStoragePositions({ '/projects': { index: 4, timestamp: Date.now() } })
      expect(sm.getSavedIndex('/projects')).toBe(4)
    })

    it('returns 0 (lastSavedIndex default) when no saved position exists', () => {
      // lastSavedIndex is null initially → fallback returns 0
      expect(sm.getSavedIndex('/unknown')).toBe(0)
    })

    it('does not return index when saved index is negative', () => {
      setStoragePositions({ '/bad': { index: -1, timestamp: Date.now() } })
      // index < 0 → condition fails → falls through to lastSavedIndex (0)
      expect(sm.getSavedIndex('/bad')).toBe(0)
    })

    it('normalizes trailing slash before lookup', () => {
      setStoragePositions({ '/projects': { index: 9, timestamp: Date.now() } })
      expect(sm.getSavedIndex('/projects/')).toBe(9)
    })

    it('returns last saved index when path has no stored position', () => {
      sm.saveImmediate(5, '/projects')
      // Now lastSavedIndex = 5; asking for unknown path returns lastSavedIndex
      expect(sm.getSavedIndex('/unknown')).toBe(5)
    })
  })

  describe('clear', () => {
    it('removes a specific path from storage', () => {
      setStoragePositions({
        '/projects': { index: 3, timestamp: Date.now() },
        '/about': { index: 1, timestamp: Date.now() },
      })
      sm.clear('/projects')
      const positions = getStoragePositions()
      expect(positions['/projects']).toBeUndefined()
      expect(positions['/about']).toBeDefined()
    })

    it('removes all positions when no path is given', () => {
      setStoragePositions({
        '/projects': { index: 3, timestamp: Date.now() },
        '/about': { index: 1, timestamp: Date.now() },
      })
      sm.clear()
      expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull()
    })

    it('normalizes trailing slash before clear', () => {
      setStoragePositions({ '/projects': { index: 3, timestamp: Date.now() } })
      sm.clear('/projects/')
      expect(getStoragePositions()['/projects']).toBeUndefined()
    })
  })

  describe('restore', () => {
    it('resolves with saved index for given path', async () => {
      setStoragePositions({ '/projects': { index: 7, timestamp: Date.now() } })
      const resultPromise = sm.restore('/projects')
      jest.runAllTimers()
      const index = await resultPromise
      expect(index).toBe(7)
    })

    it('resolves with 0 when no saved position and no lastSavedIndex', async () => {
      const resultPromise = sm.restore('/unknown')
      jest.runAllTimers()
      const index = await resultPromise
      expect(index).toBe(0)
    })
  })

  describe('navigation state', () => {
    it('triggerNavigationStart does not throw', () => {
      expect(() => sm.triggerNavigationStart()).not.toThrow()
    })

    it('triggerNavigationComplete does not throw', () => {
      expect(() => sm.triggerNavigationComplete()).not.toThrow()
      jest.advanceTimersByTime(100)
    })

    it('save is skipped while navigating', () => {
      sm.triggerNavigationStart()
      sm.save(5, '/projects')
      jest.advanceTimersByTime(300)
      // Should not save while isNavigating is true
      expect(getStoragePositions()['/projects']).toBeUndefined()
    })
  })

  describe('sessionStorage error handling', () => {
    it('does not throw when sessionStorage.getItem throws', () => {
      jest.spyOn(Storage.prototype, 'getItem').mockImplementationOnce(() => {
        throw new Error('Storage quota exceeded')
      })
      expect(() => sm.getSavedIndex('/projects')).not.toThrow()
    })

    it('returns 0 when stored JSON is corrupt', () => {
      sessionStorage.setItem(STORAGE_KEY, 'not valid json{')
      expect(sm.getSavedIndex('/projects')).toBe(0)
    })

    it('does not throw when sessionStorage.setItem throws', () => {
      jest.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
        throw new Error('Storage quota exceeded')
      })
      expect(() => sm.saveImmediate(3, '/projects')).not.toThrow()
    })
  })
})
