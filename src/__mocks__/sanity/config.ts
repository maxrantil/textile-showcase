export const SANITY_PROJECT_CONFIG = {
  projectId: 'test-project-id',
  dataset: 'test',
  apiVersion: '2024-01-01',
  useCdn: false,
}

export const SANITY_CDN_CONFIG = {
  referrerPolicy: 'strict-origin-when-cross-origin' as const,
  crossOrigin: 'anonymous' as const,
  loading: 'lazy' as const,
}

export const SANITY_IMAGE_CONFIG = {
  deviceSizes: [640, 768, 1024, 1280, 1536],
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  formats: ['image/webp', 'image/avif'],
}
