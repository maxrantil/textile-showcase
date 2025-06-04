// src/lib/sanity.ts - Updated queries with better performance and timeouts

import { createClient } from 'next-sanity'
import imageUrlBuilder from '@sanity/image-url'
import { perf } from '@/utils/performance'

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

// FIXED: Enhanced image URL with aspect ratio preservation
export const getOptimizedImageUrl = (
  source: any, 
  options: {
    width?: number
    height?: number
    quality?: number
    format?: 'webp' | 'jpg' | 'png'
    fit?: 'clip' | 'crop' | 'fill' | 'fillmax' | 'max' | 'scale' | 'min'
  } = {}
) => {
  if (!source) return ''
  
  const { width, height, quality = 85, format = 'webp', fit = 'max' } = options
  
  let imageBuilder = urlFor(source)
  
  // Only set ONE dimension to preserve aspect ratio
  if (width && !height) {
    imageBuilder = imageBuilder.width(width)
  } else if (height && !width) {
    imageBuilder = imageBuilder.height(height)
  } else if (width && height) {
    // If both are provided, use fit parameter to control behavior
    imageBuilder = imageBuilder.width(width).height(height).fit(fit)
  }
  
  return imageBuilder
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

// NEW: Get image dimensions and aspect ratio
export const getImageDimensions = (source: any) => {
  if (!source?.asset) return null
  
  // Try to get dimensions from the asset metadata
  const asset = source.asset
  
  // Check for dimensions in metadata
  if (asset.metadata?.dimensions) {
    return {
      width: asset.metadata.dimensions.width,
      height: asset.metadata.dimensions.height,
      aspectRatio: asset.metadata.dimensions.width / asset.metadata.dimensions.height
    }
  }
  
  // Fallback to checking asset directly
  if (asset.width && asset.height) {
    return {
      width: asset.width,
      height: asset.height,
      aspectRatio: asset.width / asset.height
    }
  }
  
  // Default fallback
  return {
    width: 800,
    height: 600,
    aspectRatio: 4/3
  }
}

// Helper function to add timeout to any promise
function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 15000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
    )
  ])
}

// Enhanced cache with TTL
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>()

// FIXED: Resilient fetch function with better timeout handling
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
  // INCREASED timeouts for better reliability
  const { retries = 3, timeout = 15000, cache: useCache = true, cacheTTL = 600000 } = options // 10 min default TTL
  
  // Create a shorter name for performance tracking
  const queryName = query.replace(/\s+/g, ' ').slice(0, 50).replace(/[^a-zA-Z0-9\s]/g, '').trim()
  const perfName = `sanity-${queryName}`
  
  // WRAP THE ENTIRE FUNCTION IN PERFORMANCE MONITORING
  return await perf.measureAsync(perfName, async () => {
    // Create cache key
    const cacheKey = `${query}-${JSON.stringify(params)}`
    
    // Check cache first
    if (useCache) {
      const cached = cache.get(cacheKey)
      if (cached && Date.now() - cached.timestamp < cached.ttl) {
        console.log('📋 Cache hit for:', query.slice(0, 50) + '...')
        return cached.data
      }
    }
    
    for (let attempt = 1; attempt <= retries + 1; attempt++) {
      try {
        console.log(`🔍 Sanity fetch attempt ${attempt}/${retries + 1}:`, query.slice(0, 50) + '...')
        
        const result = await withTimeout(
          client.fetch<T>(query, params),
          timeout
        )
        
        console.log('✅ Sanity fetch successful')
        
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
        
        console.warn(`❌ Sanity fetch attempt ${attempt} failed:`, {
          error: error instanceof Error ? error.message : 'Unknown error',
          query: query.slice(0, 100) + '...', // Log first 100 chars of query
          isLastAttempt
        })
        
        if (isLastAttempt) {
          console.error('🚨 All Sanity fetch attempts failed, returning null')
          return null
        }
        
        // Wait before retrying (exponential backoff)
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000)
        console.log(`⏳ Waiting ${delay}ms before retry...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
    
    return null
  })
}

// OPTIMIZED queries with better performance
export const queries = {
  // Home page - Use the order field from Sanity for proper sorting
  getDesignsForHome: `
    *[_type == "textileDesign"] {
      _id,
      title,
      slug,
      image {
        asset-> {
          _id,
          metadata {
            dimensions
          }
        }
      },
      year,
      featured,
      order,
      _createdAt
    } | order(
      order asc,      // First, sort by manual order field (ascending - 0, 1, 2, etc.)
      featured desc,  // Then by featured status (featured items first)
      _createdAt desc // Finally by creation date (newest first)
    )[0...20]
  `,
  
  // Project page - all fields needed with image metadata
  getProjectBySlug: `
    *[_type == "textileDesign" && (slug.current == $slug || _id == $slug)][0] {
      _id,
      title,
      slug,
      image {
        asset-> {
          _id,
          metadata {
            dimensions
          }
        }
      },
      gallery[] {
        _key,
        asset-> {
          _id,
          metadata {
            dimensions
          }
        },
        caption
      },
      description,
      detailedDescription,
      year,
      materials,
      dimensions,
      technique,
      featured,
      order
    }
  `,
  
  // SIMPLIFIED sitemap query - only essential fields for better performance
  getAllSlugs: `
    *[_type == "textileDesign" && defined(slug.current)] {
      "slug": slug.current,
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
