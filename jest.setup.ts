// jest.setup.ts
import '@testing-library/jest-dom'
import { configure } from '@testing-library/react'

configure({
  testIdAttribute: 'data-testid',
})

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  usePathname() {
    return '/'
  },
  useSearchParams() {
    return new URLSearchParams()
  },
}))

// Mock Sanity client to avoid module loading issues
jest.mock('@/sanity/client', () => ({
  client: {
    fetch: jest.fn(),
  },
}))

// Mock Sanity image helpers
jest.mock('@/sanity/imageHelpers', () => ({
  getOptimizedImageUrl: jest.fn((src) => `optimized-${src}`),
  getBlurDataUrl: jest.fn(() => 'blur-data-url'),
}))

// Mock Sanity config to avoid undefined errors
jest.mock('@/sanity/config', () => ({
  SANITY_CDN_CONFIG: {
    referrerPolicy: 'strict-origin-when-cross-origin',
    crossOrigin: 'anonymous',
  },
}))

// Essential browser API mocks
Object.defineProperty(window, 'scrollBy', { value: jest.fn(), writable: true })
Object.defineProperty(window, 'scrollTo', { value: jest.fn(), writable: true })
