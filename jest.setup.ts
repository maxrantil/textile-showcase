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

// Note: We avoid mocking actual business logic per CLAUDE.md guidance
// Only mock essential browser APIs that JSDOM doesn't support

// Essential browser API mocks
Object.defineProperty(window, 'scrollBy', { value: jest.fn(), writable: true })
Object.defineProperty(window, 'scrollTo', { value: jest.fn(), writable: true })

// Mock scrollTo for DOM elements (JSDOM compatibility)
Element.prototype.scrollTo = jest.fn()
Element.prototype.scrollBy = jest.fn()
