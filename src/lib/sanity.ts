import { createClient } from 'next-sanity'
import imageUrlBuilder from '@sanity/image-url'

// Configuration based on environment
const config = {
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  useCdn: process.env.NODE_ENV === 'production',
  apiVersion: '2024-01-01',
  perspective: 'published' as const,
}

export const client = createClient(config)

const builder = imageUrlBuilder(client)

export const urlFor = (source: any) => {
  if (!source) {
    console.warn('urlFor received null or undefined source')
    return builder.image({})
  }
  return builder.image(source)
}

// Enhanced image URL with responsive sizing
export const getOptimizedImageUrl = (
  source: any, 
  options: {
    width?: number
    height?: number
    quality?: number
    format?: 'webp' | 'jpg' | 'png'
  } = {}
) => {
  if (!source) return ''
  
  const { width = 800, height = 600, quality = 85, format = 'webp' } = options
  
  return urlFor(source)
    .width(width)
    .height(height)
    .quality(quality)
    .format(format)
    .url()
}

// Generate blur data URL for better loading experience
export const getBlurDataUrl = (source: any) => {
  if (!source) return undefined
  
  return urlFor(source)
    .width(20)
    .height(20)
    .blur(50)
    .quality(20)
    .url()
}

// Helper function to add timeout to any promise
function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 10000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
    )
  ])
}

// Enhanced cache with TTL
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>()

// Resilient fetch function with retry logic and caching
export async function resilientFetch<T = any>(
  query: string,
  params: Record<string, any> = {},
  options: { 
    retries?: number
    timeout?: number
    cache?: boolean
    cacheTTL?: number
  } = {}
): Promise<T | null> {
  const { retries = 2, timeout = 8000, cache: useCache = true, cacheTTL = 300000 } = options // 5 min default TTL
  
  // Create cache key
  const cacheKey = `${query}-${JSON.stringify(params)}`
  
  // Check cache first
  if (useCache) {
    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data
    }
  }
  
  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      const result = await withTimeout(
        client.fetch<T>(query, params),
        timeout
      )
      
      // Cache successful result
      if (useCache && result) {
        cache.set(cacheKey, {
          data: result,
          timestamp: Date.now(),
          ttl: cacheTTL
        })
      }
      
      return result
    } catch (error) {
      const isLastAttempt = attempt === retries + 1
      
      console.warn(`Sanity fetch attempt ${attempt} failed:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        query: query.slice(0, 100) + '...', // Log first 100 chars of query
        isLastAttempt
      })
      
      if (isLastAttempt) {
        console.error('All Sanity fetch attempts failed, returning null')
        return null
      }
      
      // Wait before retrying (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  return null
}

// Optimized queries
export const queries = {
  // Home page - only essential fields
  getDesignsForHome: `
    *[_type == "textileDesign"] | order(_createdAt desc) {
      _id,
      title,
      slug,
      image,
      year,
      featured
    }[0...20]
  `,
  
  // Project page - all fields needed
  getProjectBySlug: `
    *[_type == "textileDesign" && (slug.current == $slug || _id == $slug)][0] {
      _id,
      title,
      slug,
      image,
      gallery[] {
        _key,
        asset,
        caption
      },
      description,
      detailedDescription,
      year,
      materials,
      dimensions,
      technique,
      featured
    }
  `,
  
  // For sitemap generation
  getAllSlugs: `
    *[_type == "textileDesign" && defined(slug.current)] {
      slug,
      _updatedAt
    }
  `
}

// Clean up old cache entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > value.ttl) {
      cache.delete(key)
    }
  }
}, 600000) // Clean every 10 minutes
