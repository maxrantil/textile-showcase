// ABOUTME: Lightweight runtime Sanity client for data fetching in production
// Optimized for minimal bundle size with only essential features for public site

import { createClient } from 'next-sanity'
import { sanityConfig } from './config'

// Runtime client optimized for production with minimal features
export const client = createClient({
  ...sanityConfig,
  perspective: 'published', // Only published content
  useCdn: true, // Always use CDN for better performance
  stega: {
    enabled: false, // Disable visual editing features to reduce bundle
  },
})
