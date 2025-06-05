// src/sanity/client.ts
import { createClient } from 'next-sanity'

// Configuration based on environment
const config = {
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  useCdn: process.env.NODE_ENV === 'production',
  apiVersion: '2024-01-01',
  perspective: 'published' as const,
}

// Validate required environment variables
if (!config.projectId) {
  throw new Error('Missing NEXT_PUBLIC_SANITY_PROJECT_ID environment variable')
}

if (!config.dataset) {
  throw new Error('Missing NEXT_PUBLIC_SANITY_DATASET environment variable')
}

export const client = createClient(config)

// Export config for use in other modules
export const sanityConfig = config

// Client utilities
export const isProduction = config.useCdn
export const projectId = config.projectId
export const dataset = config.dataset
