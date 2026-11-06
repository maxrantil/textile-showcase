// ABOUTME: Tests for the in-memory fixed-window rate limiter
// Covers per-key limits, window reset, and bounded memory usage

import {
  checkRateLimit,
  rateLimitStore,
  RATE_LIMIT_MAX_KEYS,
} from '../rateLimit'

describe('checkRateLimit', () => {
  beforeEach(() => {
    rateLimitStore.clear()
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
})
