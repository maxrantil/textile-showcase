// src/sanity/imageHelpers.ts
import imageUrlBuilder from '@sanity/image-url'
import { client } from './client'
import type { SanityImageSource } from '@sanity/image-url/lib/types/types'

// Define Sanity image types
interface SanityImageAsset {
  _id: string
  metadata?: {
    dimensions?: {
      width: number
      height: number
    }
  }
  width?: number
  height?: number
}

interface SanityImage {
  asset?: SanityImageAsset
  _ref?: string
}

// Image URL builder
const builder = imageUrlBuilder(client)

export const urlFor = (source: SanityImageSource | null | undefined) => {
  if (!source) {
    console.warn('urlFor received null or undefined source')
    return builder.image({})
  }
  return builder.image(source)
}

// Image optimization interface
interface ImageOptimizationOptions {
  width?: number
  height?: number
  quality?: number
  format?: 'webp' | 'jpg' | 'png'
  fit?: 'clip' | 'crop' | 'fill' | 'fillmax' | 'max' | 'scale' | 'min'
}

/**
 * Generate optimized image URL from Sanity image source
 */
export const getOptimizedImageUrl = (
  source: SanityImageSource | null | undefined,
  options: ImageOptimizationOptions = {}
): string => {
  if (!source) return ''

  const { width, height, quality = 85, format = 'webp', fit = 'max' } = options

  let imageBuilder = urlFor(source)

  if (width && !height) {
    imageBuilder = imageBuilder.width(width)
  } else if (height && !width) {
    imageBuilder = imageBuilder.height(height)
  } else if (width && height) {
    imageBuilder = imageBuilder.width(width).height(height).fit(fit)
  }

  const url = imageBuilder.quality(quality).format(format).url()
  return url
}

/**
 * Generate blur data URL for better loading experience
 */
export const getBlurDataUrl = (
  source: SanityImageSource | null | undefined
): string | undefined => {
  if (!source) return undefined
  return urlFor(source).width(20).height(20).blur(50).quality(20).url()
}

/**
 * Get image dimensions and aspect ratio from Sanity image
 */
export const getImageDimensions = (source: SanityImage | null | undefined) => {
  if (!source?.asset) return null

  // Try to get dimensions from the asset metadata
  const asset = source.asset

  // Check for dimensions in metadata
  if (asset.metadata?.dimensions) {
    return {
      width: asset.metadata.dimensions.width,
      height: asset.metadata.dimensions.height,
      aspectRatio:
        asset.metadata.dimensions.width / asset.metadata.dimensions.height,
    }
  }

  // Fallback to checking asset directly
  if (asset.width && asset.height) {
    return {
      width: asset.width,
      height: asset.height,
      aspectRatio: asset.width / asset.height,
    }
  }

  // Default fallback
  return {
    width: 800,
    height: 600,
    aspectRatio: 4 / 3,
  }
}

/**
 * Get dimensions from SanityImageSource (asset reference or object)
 */
export const getImageDimensionsFromSource = (
  source: SanityImageSource | null | undefined
) => {
  if (!source) return null

  // If source is a string (asset reference), we can't get dimensions
  if (typeof source === 'string') {
    return {
      width: 800,
      height: 600,
      aspectRatio: 4 / 3,
    }
  }

  // If source is an object with asset property
  if (typeof source === 'object' && 'asset' in source) {
    return getImageDimensions(source as SanityImage)
  }

  // If source is an asset object directly
  if (typeof source === 'object' && ('_id' in source || 'metadata' in source)) {
    const asset = source as SanityImageAsset

    // Check for dimensions in metadata
    if (asset.metadata?.dimensions) {
      return {
        width: asset.metadata.dimensions.width,
        height: asset.metadata.dimensions.height,
        aspectRatio:
          asset.metadata.dimensions.width / asset.metadata.dimensions.height,
      }
    }

    // Fallback to checking asset directly
    if (asset.width && asset.height) {
      return {
        width: asset.width,
        height: asset.height,
        aspectRatio: asset.width / asset.height,
      }
    }
  }

  // Default fallback
  return {
    width: 800,
    height: 600,
    aspectRatio: 4 / 3,
  }
}

/**
 * Generate responsive image srcSet for better performance
 */
export const getResponsiveImageSrcSet = (
  source: SanityImageSource | null | undefined,
  baseSizes: number[] = [400, 800, 1200, 1600]
): string => {
  if (!source) return ''

  const srcSetEntries = baseSizes.map((size) => {
    const url = getOptimizedImageUrl(source, {
      width: size,
      quality: 85,
      format: 'webp',
    })
    return `${url} ${size}w`
  })

  return srcSetEntries.join(', ')
}

/**
 * Preload image for better performance
 */
export const preloadImage = (url: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = reject
    img.src = url
  })
}

/**
 * Preload multiple images with error handling
 */
export const preloadImages = async (urls: string[]): Promise<void> => {
  try {
    await Promise.all(urls.map(preloadImage))
  } catch (error) {
    console.warn('Some images failed to preload:', error)
  }
}
