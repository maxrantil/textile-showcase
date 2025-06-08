// src/sanity/index.ts
// Main barrel export for all Sanity functionality

// Client and configuration
export {
  client,
  sanityConfig,
  isProduction,
  projectId,
  dataset,
} from './client'

// Image helpers
export {
  urlFor,
  getOptimizedImageUrl,
  getBlurDataUrl,
  getImageDimensions,
  getResponsiveImageSrcSet,
  preloadImage,
  preloadImages,
} from './imageHelpers'

// Queries
export {
  queries,
  homeQueries,
  projectQueries,
  seoQueries,
  adminQueries,
  queryParams,
} from './queries'

// Data fetching
export {
  resilientFetch,
  dataFetchers,
  preloadData,
  cacheUtils,
} from './dataFetcher'

// Types
export type { TextileDesign } from './types'
