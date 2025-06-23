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

// Enhanced device and mode detection
const isIOSOrSafari = () => {
  if (typeof window === 'undefined') return false
  const userAgent = window.navigator.userAgent
  return (
    /iPad|iPhone|iPod/.test(userAgent) ||
    (/Safari/.test(userAgent) && !/Chrome/.test(userAgent))
  )
}

// Detect iOS lockdown mode (heuristic approach)
const isLockdownMode = () => {
  if (typeof window === 'undefined') return false

  // Lockdown mode detection heuristics
  try {
    // Check if IntersectionObserver is available (disabled in lockdown)
    const hasIntersectionObserver = 'IntersectionObserver' in window

    // Check if certain Web APIs are available
    const hasWebGL = !!window.WebGLRenderingContext
    const hasGamepad = 'getGamepads' in navigator

    // iOS device but missing multiple APIs suggests lockdown mode
    const isIOS = /iPad|iPhone|iPod/.test(window.navigator.userAgent)

    if (isIOS && (!hasIntersectionObserver || !hasWebGL || !hasGamepad)) {
      console.log('🔒 iOS Lockdown Mode detected')
      return true
    }

    return false
  } catch (error) {
    // If we can't run these checks, assume lockdown mode for safety
    console.warn('Error detecting lockdown mode:', error)
    return isIOSOrSafari()
  }
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

  // For lockdown mode, use simpler image URLs
  const lockdownMode = isLockdownMode()

  if (lockdownMode) {
    // Minimal transformations for lockdown mode
    if (width && width > 400) {
      imageBuilder = imageBuilder.width(Math.min(width, 800)) // Limit size
    }

    // Always use JPG for lockdown mode - most compatible
    const url = imageBuilder.quality(Math.min(quality, 80)).format('jpg').url()
    console.log('🔒 Lockdown mode image URL:', url)
    return url
  }

  // Normal mode - full transformations
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
    // Use JPG for iOS/Safari to avoid issues
    selectedFormat = isIOSOrSafari() ? 'jpg' : 'webp'
  } else if (format === 'webp' || format === 'jpg' || format === 'png') {
    selectedFormat = format
  }

  const url = imageBuilder.quality(quality).format(selectedFormat).url()
  return url
}

/**
 * Generate a simple, lockdown-mode compatible image URL
 */
export const getSimpleImageUrl = (
  source: SanityImageSource | null | undefined,
  maxWidth: number = 800
): string => {
  if (!source) return ''

  // Simplest possible URL for maximum compatibility
  return urlFor(source).width(maxWidth).quality(75).format('jpg').url()
}

// Keep all other functions the same...
export const getFallbackImageUrl = (
  source: SanityImageSource | null | undefined,
  options: ImageOptimizationOptions = {}
): string => {
  if (!source) return ''

  const fallbackOptions = {
    ...options,
    format: 'jpg' as const,
  }

  return getOptimizedImageUrl(source, fallbackOptions)
}

export const getBlurDataUrl = (
  source: SanityImageSource | null | undefined
): string | undefined => {
  if (!source) return undefined
  return urlFor(source)
    .width(20)
    .height(20)
    .blur(50)
    .quality(20)
    .format('jpg')
    .url()
}

// ... rest of the functions remain the same
export const getImageDimensions = (source: SanityImage | null | undefined) => {
  if (!source?.asset) return null

  const asset = source.asset

  if (asset.metadata?.dimensions) {
    return {
      width: asset.metadata.dimensions.width,
      height: asset.metadata.dimensions.height,
      aspectRatio:
        asset.metadata.dimensions.width / asset.metadata.dimensions.height,
    }
  }

  if (asset.width && asset.height) {
    return {
      width: asset.width,
      height: asset.height,
      aspectRatio: asset.width / asset.height,
    }
  }

  return {
    width: 800,
    height: 600,
    aspectRatio: 4 / 3,
  }
}

export const getImageDimensionsFromSource = (
  source: SanityImageSource | null | undefined
) => {
  if (!source) return null

  if (typeof source === 'string') {
    return {
      width: 800,
      height: 600,
      aspectRatio: 4 / 3,
    }
  }

  if (typeof source === 'object' && 'asset' in source) {
    return getImageDimensions(source as SanityImage)
  }

  if (typeof source === 'object' && ('_id' in source || 'metadata' in source)) {
    const asset = source as SanityImageAsset

    if (asset.metadata?.dimensions) {
      return {
        width: asset.metadata.dimensions.width,
        height: asset.metadata.dimensions.height,
        aspectRatio:
          asset.metadata.dimensions.width / asset.metadata.dimensions.height,
      }
    }

    if (asset.width && asset.height) {
      return {
        width: asset.width,
        height: asset.height,
        aspectRatio: asset.width / asset.height,
      }
    }
  }

  return {
    width: 800,
    height: 600,
    aspectRatio: 4 / 3,
  }
}

export const getResponsiveImageSrcSet = (
  source: SanityImageSource | null | undefined,
  baseSizes: number[] = [400, 800, 1200, 1600]
): string => {
  if (!source) return ''

  const srcSetEntries = baseSizes.map((size) => {
    const url = getOptimizedImageUrl(source, {
      width: size,
      quality: 85,
      format: 'auto',
    })
    return `${url} ${size}w`
  })

  return srcSetEntries.join(', ')
}

export const preloadImage = (url: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = reject
    img.src = url
  })
}

export const preloadImages = async (urls: string[]): Promise<void> => {
  try {
    await Promise.all(urls.map(preloadImage))
  } catch (error) {
    console.warn('Some images failed to preload:', error)
  }
}
