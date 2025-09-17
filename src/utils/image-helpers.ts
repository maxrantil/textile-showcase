// ABOUTME: Lightweight image URL generation without full Sanity dependencies
// Optimized for bundle size while maintaining compatibility with Sanity images

import type { ImageSource } from '@/types/textile'

// Sanity CDN configuration
const SANITY_PROJECT_ID =
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '2y05n6hf'
const SANITY_DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'

/**
 * Generate optimized image URL from Sanity asset reference
 * Lightweight alternative to @sanity/image-url for better bundle size
 */
export function getOptimizedImageUrl(
  source: ImageSource | string,
  options: {
    width?: number
    height?: number
    quality?: number
    format?: 'webp' | 'jpg' | 'png' | 'auto'
    fit?: 'crop' | 'fillmax' | 'fill' | 'clip' | 'scale'
  } = {}
): string {
  // Handle direct URL strings
  if (typeof source === 'string') {
    return source
  }

  // Extract asset reference
  const assetRef = source._ref || source.asset?._ref
  if (!assetRef) {
    return ''
  }

  // Parse asset reference (format: image-{id}-{width}x{height}-{format})
  const [, id, dimensions, format] = assetRef.split('-')
  if (!id) {
    return ''
  }

  // Build Sanity CDN URL
  const baseUrl = `https://cdn.sanity.io/images/${SANITY_PROJECT_ID}/${SANITY_DATASET}/${id}-${dimensions}.${format}`

  // Add optimization parameters
  const params = new URLSearchParams()

  if (options.width) params.set('w', options.width.toString())
  if (options.height) params.set('h', options.height.toString())
  if (options.quality) params.set('q', options.quality.toString())
  if (
    options.format &&
    options.format !== 'auto' &&
    options.format !== format
  ) {
    params.set('fm', options.format)
  }
  if (options.fit) params.set('fit', options.fit)

  const queryString = params.toString()
  return queryString ? `${baseUrl}?${queryString}` : baseUrl
}

/**
 * Generate simple image URL without optimization parameters
 * Ultra-lightweight version for basic use cases
 */
export function getSimpleImageUrl(source: ImageSource | string): string {
  if (typeof source === 'string') {
    return source
  }

  const assetRef = source._ref || source.asset?._ref
  if (!assetRef) {
    return ''
  }

  const [, id, dimensions, format] = assetRef.split('-')
  if (!id) {
    return ''
  }

  return `https://cdn.sanity.io/images/${SANITY_PROJECT_ID}/${SANITY_DATASET}/${id}-${dimensions}.${format}`
}

/**
 * Generate responsive image URLs for different screen sizes
 * Returns object with different sizes for srcSet
 */
export function getResponsiveImageUrls(
  source: ImageSource | string,
  sizes: number[] = [640, 768, 1024, 1280, 1920]
): { [key: number]: string } {
  const urls: { [key: number]: string } = {}

  for (const size of sizes) {
    urls[size] = getOptimizedImageUrl(source, {
      width: size,
      quality: 85,
      format: 'webp',
    })
  }

  return urls
}

/**
 * Generate srcSet string for responsive images
 */
export function generateSrcSet(
  source: ImageSource | string,
  sizes: number[] = [640, 768, 1024, 1280, 1920]
): string {
  const urls = getResponsiveImageUrls(source, sizes)
  return sizes.map((size) => `${urls[size]} ${size}w`).join(', ')
}
