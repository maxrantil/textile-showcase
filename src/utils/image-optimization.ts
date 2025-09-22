// ABOUTME: Image optimization utilities for enhanced lazy loading with priority hints

export type ImagePriority = 'high' | 'low' | 'auto'
export type ImageType =
  | 'hero'
  | 'gallery'
  | 'thumbnail'
  | 'critical'
  | 'deferred'

export interface ImagePriorityConfig {
  aboveFold: ImagePriority
  belowFold: ImagePriority
  critical: ImagePriority
  deferred: ImagePriority
}

export interface ImagePreloadStrategy {
  hero: { priority: ImagePriority; preload: boolean }
  aboveFold: { priority: ImagePriority; preload: boolean }
  belowFold: { priority: ImagePriority; preload: boolean }
}

export interface ObserverConfig {
  rootMargin: string
  threshold: number
}

/**
 * Get image priority based on image type and position
 */
export function getImagePriority(
  imageType: ImageType,
  isAboveFold: boolean = false
): ImagePriority {
  if (imageType === 'hero' || imageType === 'critical') {
    return 'high'
  }

  if (isAboveFold) {
    return 'high'
  }

  if (imageType === 'thumbnail') {
    return 'low'
  }

  return 'auto'
}

/**
 * Determine if image should be preloaded
 */
export function shouldPreloadImage(
  imageType: ImageType,
  isAboveFold: boolean = false
): boolean {
  return imageType === 'hero' || imageType === 'critical' || isAboveFold
}

/**
 * Get optimized intersection observer configuration
 */
export function getOptimizedObserverConfig(): ObserverConfig {
  return {
    rootMargin: '200px', // Larger margin for smoother loading
    threshold: 0.01, // Lower threshold for earlier triggering
  }
}

/**
 * Priority hints configuration
 */
export const priorityHintsConfig: ImagePriorityConfig = {
  aboveFold: 'high',
  belowFold: 'low',
  critical: 'high',
  deferred: 'auto',
}

/**
 * Image preloading strategy configuration
 */
export const imagePreloadStrategy: ImagePreloadStrategy = {
  hero: { priority: 'high', preload: true },
  aboveFold: { priority: 'high', preload: true },
  belowFold: { priority: 'low', preload: false },
}
