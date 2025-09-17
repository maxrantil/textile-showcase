// src/sanity/config.ts

// Debug logging during build time
if (process.env.NODE_ENV !== 'production') {
  console.log('🔍 Sanity Config Debug:', {
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'FALLBACK',
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'FALLBACK',
    apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || 'FALLBACK',
    hasToken: !!process.env.SANITY_API_TOKEN,
    nodeEnv: process.env.NODE_ENV,
  })
}

export const sanityConfig = {
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '2y05n6hf',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2023-05-03',
  useCdn: process.env.NODE_ENV === 'production',
  token: process.env.SANITY_API_TOKEN,
}
