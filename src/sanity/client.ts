// src/sanity/client.ts
import { createClient } from 'next-sanity'

// Configuration based on environment with fallbacks
const config = {
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '2y05n6hf',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  useCdn: process.env.NODE_ENV === 'production',
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2025-06-08',
  perspective: 'published' as const,
}

// Remove the validation that throws errors
export const client = createClient(config)

// Export config for use in other modules
export const sanityConfig = config
export const isProduction = config.useCdn
export const projectId = config.projectId
export const dataset = config.dataset
