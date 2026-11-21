// ABOUTME: Tests for the in-memory fixed-window rate limiter
// Covers per-key limits, window reset, and bounded memory usage

import {
  checkRateLimit,
  pinnedRateLimitStore,
  rateLimitStore,
  RATE_LIMIT_MAX_KEYS,
} from '../rateLimit'

describe('checkRateLimit', () => {
  beforeEach(() => {
    rateLimitStore.clear()
    pinnedRateLimitStore.clear()
    jest.useRealTimers()
  })

  it('allows the default 5 requests per minute then blocks', () => {
    const results = Array.from({ length: 6 }, () => checkRateLimit('k'))
    expect(results).toEqual([true, true, true, true, true, false])
  })

  it('supports custom limits and windows', () => {
    expect(checkRateLimit('c', { limit: 1, windowMs: 1000 })).toBe(true)
    expect(checkRateLimit('c', { limit: 1, windowMs: 1000 })).toBe(false)
  })

  it('resets after the window elapses', () => {
    jest.useFakeTimers()
    jest.setSystemTime(0)
    checkRateLimit('w', { limit: 1, windowMs: 1000 })
    expect(checkRateLimit('w', { limit: 1, windowMs: 1000 })).toBe(false)
    jest.setSystemTime(1001)
    expect(checkRateLimit('w', { limit: 1, windowMs: 1000 })).toBe(true)
  })

  it('never grows beyond RATE_LIMIT_MAX_KEYS entries', () => {
    for (let i = 0; i < RATE_LIMIT_MAX_KEYS + 50; i++) {
      checkRateLimit(`ip-${i}`)
    }
    expect(rateLimitStore.size).toBeLessThanOrEqual(RATE_LIMIT_MAX_KEYS)
  })

  // Filling the store with fresh IPs used to evict the global contact
  // counter, granting a new budget (Issue #489)
  describe('pinned keys', () => {
    const GLOBAL = { limit: 3, windowMs: 3_600_000, pinned: true }

    it('keeps an exhausted pinned counter when the store fills with live keys', () => {
      jest.useFakeTimers()
      jest.setSystemTime(1_000)
      for (let i = 0; i < 3; i++) expect(checkRateLimit('global', GLOBAL)).toBe(true)
      expect(checkRateLimit('global', GLOBAL)).toBe(false)

      for (let i = 0; i < RATE_LIMIT_MAX_KEYS + 10; i++) {
        checkRateLimit(`ip-${i}`)
      }

      expect(checkRateLimit('global', GLOBAL)).toBe(false)
      expect(pinnedRateLimitStore.get('global')?.resetTime).toBe(3_601_000)
    })

    it('resets a pinned counter once its own window ends', () => {
      jest.useFakeTimers()
      jest.setSystemTime(0)
      for (let i = 0; i < 3; i++) checkRateLimit('global', GLOBAL)
      expect(checkRateLimit('global', GLOBAL)).toBe(false)

      jest.setSystemTime(3_600_001)
      expect(checkRateLimit('global', GLOBAL)).toBe(true)
    })

    it('counts a pinned key separately from the same unpinned key', () => {
      checkRateLimit('k', { limit: 1, pinned: true })
      expect(checkRateLimit('k', { limit: 1 })).toBe(true)
      expect(rateLimitStore.has('k')).toBe(true)
      expect(pinnedRateLimitStore.has('k')).toBe(true)
    })
  })
})
