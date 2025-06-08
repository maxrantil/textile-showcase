export const SANITY_PROJECT_CONFIG = {
  projectId: '2y05n6hf',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: process.env.NODE_ENV === 'production',
} as const
