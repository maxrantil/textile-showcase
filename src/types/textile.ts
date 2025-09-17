// ABOUTME: Lightweight type definitions for textile designs without Sanity dependencies
// Extracted from Sanity types to enable better tree shaking and reduce bundle size

// Core textile design interface without Sanity-specific fields
export interface TextileDesign {
  _id: string
  title: string
  description?: string
  slug: {
    current: string
  }
  images: TextileImage[]
  category?: string
  materials?: string[]
  techniques?: string[]
  year?: number
  dimensions?: {
    width?: number
    height?: number
    unit?: string
  }
  featured?: boolean
  order?: number
}

// Lightweight image interface
export interface TextileImage {
  _key: string
  asset: {
    _ref: string
    _type: 'reference'
  }
  alt?: string
  caption?: string
  hotspot?: {
    x: number
    y: number
    height: number
    width: number
  }
  crop?: {
    top: number
    bottom: number
    left: number
    right: number
  }
}

// Simple image source type (compatible with Sanity but standalone)
export interface ImageSource {
  _ref?: string
  _type?: string
  asset?: {
    _ref: string
    _type: 'reference'
  }
  url?: string
}

// Gallery navigation types
export interface GalleryNavigation {
  currentIndex: number
  totalItems: number
  canGoNext: boolean
  canGoPrevious: boolean
  goToNext: () => void
  goToPrevious: () => void
  goToIndex: (index: number) => void
}
