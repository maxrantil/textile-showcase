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

// Detect iOS and Safari for format compatibility
const isIOSOrSafari = () => {
  if (typeof window === 'undefined') return false
  const userAgent = window.navigator.userAgent
  return (
    /iPad|iPhone|iPod/.test(userAgent) ||
    (/Safari/.test(userAgent) && !/Chrome/.test(userAgent))
  )
}

// Image optimization interface
interface ImageOptimizationOptions {
  width?: number
  height?: number
  quality?: number
  format?: 'webp' | 'jpg' | 'png' | 'auto'
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

  const { width, height, quality = 85, format = 'auto', fit = 'max' } = options

  let imageBuilder = urlFor(source)

  if (width && !height) {
    imageBuilder = imageBuilder.width(width)
  } else if (height && !width) {
    imageBuilder = imageBuilder.height(height)
  } else if (width && height) {
    imageBuilder = imageBuilder.width(width).height(height).fit(fit)
  }

  // Smart format selection - convert 'auto' to actual format
  let selectedFormat: 'webp' | 'jpg' | 'png' = 'webp' // Default
  if (format === 'auto') {
    // Use JPG for iOS/Safari to avoid lockdown mode issues
    selectedFormat = isIOSOrSafari() ? 'jpg' : 'webp'
  } else if (format === 'webp' || format === 'jpg' || format === 'png') {
    selectedFormat = format
  }

  const url = imageBuilder.quality(quality).format(selectedFormat).url()
  return url
}

/**
 * Generate fallback image URL with JPG format
 */
export const getFallbackImageUrl = (
  source: SanityImageSource | null | undefined,
  options: ImageOptimizationOptions = {}
): string => {
  if (!source) return ''

  const fallbackOptions = {
    ...options,
    format: 'jpg' as const, // Always use JPG as fallback
  }

  return getOptimizedImageUrl(source, fallbackOptions)
}

/**
 * Generate blur data URL for better loading experience
 */
export const getBlurDataUrl = (
  source: SanityImageSource | null | undefined
): string | undefined => {
  if (!source) return undefined
  // Always use JPG for blur placeholder to avoid compatibility issues
  return urlFor(source)
    .width(20)
    .height(20)
    .blur(50)
    .quality(20)
    .format('jpg')
    .url()
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
      format: 'auto', // Use auto format selection
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
