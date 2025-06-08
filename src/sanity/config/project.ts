export const SANITY_PROJECT_CONFIG = {
  projectId: '2y05n6hf',
  dataset: 'production',
  apiVersion: '2025-06-08',
  useCdn: process.env.NODE_ENV === 'production',
} as const
