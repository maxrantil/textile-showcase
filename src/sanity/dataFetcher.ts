// src/sanity/dataFetcher.ts
import { client } from './client'

/**
 * Cache interface for storing query results
 */
interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

/**
 * In-memory cache for query results
 */
class QueryCache {
  private cache = new Map<string, CacheEntry<unknown>>()
  private cleanupInterval: NodeJS.Timeout

  constructor() {
    // Clean up expired entries every 10 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 600000)
  }

  set<T>(key: string, data: T, ttl: number = 600000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    })
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  clear(): void {
    this.cache.clear()
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key)
      }
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval)
    this.cache.clear()
  }
}

// Global cache instance
const queryCache = new QueryCache()

/**
 * Options for resilient fetch
 */
interface FetchOptions {
  retries?: number
  timeout?: number
  cache?: boolean
  cacheTTL?: number
  tags?: string[] // For ISR cache tags
}

/**
 * Helper function to add timeout to any promise
 */
function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 15000
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error(`Operation timed out after ${timeoutMs}ms`)),
        timeoutMs
      )
    ),
  ])
}

/**
 * Enhanced data fetcher with retry logic, caching, and error handling
 */
export async function resilientFetch<T = unknown>(
  query: string,
  params: Record<string, unknown> = {},
  options: FetchOptions = {}
): Promise<T | null> {
  const {
    retries = 3,
    timeout = 15000,
    cache: useCache = true,
    cacheTTL = 600000,
    tags = [],
  } = options

  // Create cache key
  const cacheKey = `${query}-${JSON.stringify(params)}`

  // Check cache first
  if (useCache) {
    const cached = queryCache.get<T>(cacheKey)
    if (cached) {
      if (process.env.NODE_ENV === 'development') {
        console.log('📋 Cache hit for query')
      }
      return cached
    }
  }

  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔍 Sanity fetch attempt ${attempt}/${retries + 1}`)
      }

      // Add tags for ISR if provided
      const fetchOptions = tags.length > 0 ? { next: { tags } } : undefined

      const result = await withTimeout(
        client.fetch<T>(query, params, fetchOptions),
        timeout
      )

      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Sanity fetch successful')
      }

      // Cache successful result
      if (useCache && result) {
        queryCache.set(cacheKey, result, cacheTTL)
      }

      return result
    } catch (error) {
      const isLastAttempt = attempt === retries + 1

      if (process.env.NODE_ENV === 'development') {
        console.warn(`❌ Sanity fetch attempt ${attempt} failed:`, {
          error: error instanceof Error ? error.message : 'Unknown error',
          isLastAttempt,
        })
      }

      if (isLastAttempt) {
        console.error('🚨 All Sanity fetch attempts failed, returning null')
        return null
      }

      // Exponential backoff with jitter
      const baseDelay = Math.min(1000 * Math.pow(2, attempt - 1), 5000)
      const jitter = Math.random() * 1000
      const delay = baseDelay + jitter

      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  return null
}

/**
 * Specialized fetch functions for common patterns
 */
export const dataFetchers = {
  /**
   * Fetch single document by ID or slug
   */
  async fetchOne<T>(
    query: string,
    params: Record<string, unknown>,
    options?: FetchOptions
  ): Promise<T | null> {
    return resilientFetch<T>(query, params, options)
  },

  /**
   * Fetch multiple documents with pagination
   */
  async fetchMany<T>(
    query: string,
    params: Record<string, unknown> = {},
    options?: FetchOptions
  ): Promise<T[]> {
    const result = await resilientFetch<T[]>(query, params, options)
    return result || []
  },

  /**
   * Fetch with ISR tags for cache invalidation
   */
  async fetchWithTags<T>(
    query: string,
    params: Record<string, unknown>,
    tags: string[],
    options?: Omit<FetchOptions, 'tags'>
  ): Promise<T | null> {
    return resilientFetch<T>(query, params, { ...options, tags })
  },

  /**
   * Fetch and validate result structure
   */
  async fetchAndValidate<T>(
    query: string,
    params: Record<string, unknown>,
    validator: (data: unknown) => data is T,
    options?: FetchOptions
  ): Promise<T | null> {
    const result = await resilientFetch(query, params, options)

    if (result && validator(result)) {
      return result
    }

    if (process.env.NODE_ENV === 'development') {
      console.warn('📋 Query result failed validation:', { query, result })
    }

    return null
  },
}

/**
 * Preload data for better performance
 */
export const preloadData = {
  /**
   * Preload home page data
   */
  async preloadHome(): Promise<void> {
    // Import queries here to avoid circular dependencies
    const { queries } = await import('./queries')

    // Preload in background without waiting
    resilientFetch(queries.getDesignsForHome, {}, { cache: true }).catch(
      (error) => console.warn('Failed to preload home data:', error)
    )
  },

  /**
   * Preload project data
   */
  async preloadProject(slug: string): Promise<void> {
    const { queries } = await import('./queries')

    resilientFetch(queries.getProjectBySlug, { slug }, { cache: true }).catch(
      (error) => console.warn(`Failed to preload project ${slug}:`, error)
    )
  },
}

// Export cache utilities for testing/debugging
export const cacheUtils = {
  clear: () => queryCache.clear(),
  size: () => queryCache['cache'].size,
  destroy: () => queryCache.destroy(),
}
