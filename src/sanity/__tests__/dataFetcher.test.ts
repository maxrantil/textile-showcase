// ABOUTME: Tests for resilientFetch's in-memory query cache with a mocked Sanity client
// ABOUTME: Missing documents are cached briefly, the cache is bounded, and identical fetches share one request (Issue #498)

const mockFetch = jest.fn()

jest.mock('@/sanity/client', () => ({
  client: { fetch: (...args: unknown[]) => mockFetch(...args) },
}))

import {
  cacheUtils,
  NEGATIVE_CACHE_TTL_MS,
  QUERY_CACHE_MAX_ENTRIES,
  resilientFetch,
} from '@/sanity/dataFetcher'

const QUERY = '*[slug.current == $slug][0]'
const once = { retries: 0, timeout: 1000 }

let now = 1_000_000
beforeEach(() => {
  mockFetch.mockReset()
  cacheUtils.clear()
  now = 1_000_000
  jest.spyOn(Date, 'now').mockImplementation(() => now)
})
afterEach(() => jest.restoreAllMocks())

describe('resilientFetch cache', () => {
  it('caches a found document for its TTL', async () => {
    mockFetch.mockResolvedValue({ title: 'Woven' })

    await resilientFetch(QUERY, { slug: 'woven' }, once)
    await resilientFetch(QUERY, { slug: 'woven' }, once)

    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  describe('missing documents', () => {
    it('answers a repeated missing slug from the cache', async () => {
      mockFetch.mockResolvedValue(null)

      expect(await resilientFetch(QUERY, { slug: 'nope' }, once)).toBeNull()
      expect(await resilientFetch(QUERY, { slug: 'nope' }, once)).toBeNull()

      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('asks Sanity again once the short negative TTL ends', async () => {
      mockFetch
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ title: 'New' })

      await resilientFetch(
        QUERY,
        { slug: 'soon' },
        { ...once, cacheTTL: 600_000 }
      )
      now += NEGATIVE_CACHE_TTL_MS + 1

      expect(await resilientFetch(QUERY, { slug: 'soon' }, once)).toEqual({
        title: 'New',
      })
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('keeps the negative TTL short (a new project appears within a minute)', () => {
      expect(NEGATIVE_CACHE_TTL_MS).toBeLessThanOrEqual(60_000)
      expect(NEGATIVE_CACHE_TTL_MS).toBeGreaterThan(0)
    })

    it('does not cache a fetch that failed', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {})
      mockFetch.mockRejectedValue(new Error('Sanity down'))

      expect(await resilientFetch(QUERY, { slug: 'x' }, once)).toBeNull()
      mockFetch.mockResolvedValue({ title: 'Back' })

      expect(await resilientFetch(QUERY, { slug: 'x' }, once)).toEqual({
        title: 'Back',
      })
    })

    it('does not cache anything when caching is off', async () => {
      mockFetch.mockResolvedValue(null)

      await resilientFetch(QUERY, { slug: 'nope' }, { ...once, cache: false })
      await resilientFetch(QUERY, { slug: 'nope' }, { ...once, cache: false })

      expect(mockFetch).toHaveBeenCalledTimes(2)
    })
  })

  describe('size cap', () => {
    it(`never holds more than QUERY_CACHE_MAX_ENTRIES entries`, async () => {
      mockFetch.mockResolvedValue({ ok: true })

      for (let i = 0; i <= QUERY_CACHE_MAX_ENTRIES + 10; i++) {
        await resilientFetch(QUERY, { slug: `s-${i}` }, once)
      }

      expect(cacheUtils.size()).toBeLessThanOrEqual(QUERY_CACHE_MAX_ENTRIES)
    })

    it('drops the oldest entry first and keeps the newest', async () => {
      mockFetch.mockResolvedValue({ ok: true })
      for (let i = 0; i < QUERY_CACHE_MAX_ENTRIES + 1; i++) {
        await resilientFetch(QUERY, { slug: `s-${i}` }, once)
      }
      mockFetch.mockClear()

      await resilientFetch(
        QUERY,
        { slug: `s-${QUERY_CACHE_MAX_ENTRIES}` },
        once
      )
      expect(mockFetch).not.toHaveBeenCalled()

      await resilientFetch(QUERY, { slug: 's-0' }, once)
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('does not grow when an existing key is stored again', async () => {
      mockFetch.mockResolvedValue({ ok: true })
      await resilientFetch(QUERY, { slug: 'same' }, once)
      now += 700_000 // past the default TTL
      await resilientFetch(QUERY, { slug: 'same' }, once)

      expect(cacheUtils.size()).toBe(1)
    })
  })

  it('shares one Sanity request between identical concurrent fetches', async () => {
    let resolve: (value: unknown) => void = () => {}
    mockFetch.mockReturnValue(new Promise((r) => (resolve = r)))

    const all = Promise.all(
      Array.from({ length: 5 }, () => resolvedFetch(QUERY, { slug: 'busy' }))
    )
    resolve({ title: 'Busy' })

    expect(await all).toEqual(Array(5).fill({ title: 'Busy' }))
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('starts a new request once the shared one has finished', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
    mockFetch.mockRejectedValueOnce(new Error('blip'))
    await resilientFetch(QUERY, { slug: 'retry' }, once)
    mockFetch.mockResolvedValueOnce({ title: 'Ok' })

    expect(await resilientFetch(QUERY, { slug: 'retry' }, once)).toEqual({
      title: 'Ok',
    })
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })
})

function resolvedFetch(query: string, params: Record<string, unknown>) {
  return resilientFetch(query, params, once)
}
