// ABOUTME: Studio-only Sanity client with full admin features
// Async-loaded only for /studio routes to minimize main bundle impact

import { createClient } from 'next-sanity'

// Lazy-loaded configuration to avoid bundling in main app
async function getStudioConfig() {
  const { sanityConfig } = await import('./config')
  return sanityConfig
}

// Studio client factory - creates client only when needed
export async function createStudioClient() {
  const config = await getStudioConfig()

  return createClient({
    ...config,
    perspective: 'previewDrafts', // Studio needs draft access
    useCdn: false, // Real-time data for editing
    stega: {
      enabled: true, // Visual editing capabilities
    },
    withCredentials: true, // Authentication support
  })
}

// Studio-specific utilities - async loaded
export async function getStudioUtilities() {
  const [{ structureTool }, { visionTool }] = await Promise.all([
    import('sanity/structure'),
    import('@sanity/vision'),
  ])

  return { structureTool, visionTool }
}
