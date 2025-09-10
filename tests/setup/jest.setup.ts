// ABOUTME: Jest test environment setup for Phase 3 comprehensive testing

import '@testing-library/jest-dom'
import {
  loadTestBaseline,
  saveTestBaseline,
  createRegressionReport,
} from '../utils/test-regression'

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  })),
  usePathname: jest.fn(() => '/'),
  useSearchParams: jest.fn(() => new URLSearchParams()),
  useParams: jest.fn(() => ({})),
}))

// Mock scroll manager
jest.mock('@/lib/scrollManager', () => ({
  scrollManager: {
    saveImmediate: jest.fn(),
    triggerNavigationStart: jest.fn(),
    restore: jest.fn(),
    clear: jest.fn(),
  },
}))

// Mock device type detection
jest.mock('@/hooks/shared/useDeviceType', () => ({
  useDeviceType: jest.fn(() => 'desktop'),
}))

// Global test utilities
global.mockTouchEvent = class MockTouchEvent {
  touches: Array<{ clientX: number; clientY: number }>

  constructor(x: number, y: number) {
    this.touches = [{ clientX: x, clientY: y }]
  }
}

// Performance timing mock
Object.defineProperty(global, 'performance', {
  value: {
    now: jest.fn(() => Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByType: jest.fn(() => []),
    getEntriesByName: jest.fn(() => []),
  },
  writable: true,
})

// Intersection Observer mock for image loading tests
global.IntersectionObserver = jest.fn(() => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
  unobserve: jest.fn(),
}))

// ResizeObserver mock
global.ResizeObserver = jest.fn(() => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
  unobserve: jest.fn(),
}))

// Canvas mock for image processing tests
global.HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  fillRect: jest.fn(),
  clearRect: jest.fn(),
  getImageData: jest.fn(() => ({
    data: new Uint8ClampedArray(4),
  })),
  putImageData: jest.fn(),
  createImageData: jest.fn(() => ({
    data: new Uint8ClampedArray(4),
  })),
  setTransform: jest.fn(),
  drawImage: jest.fn(),
  save: jest.fn(),
  fillText: jest.fn(),
  restore: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  closePath: jest.fn(),
  stroke: jest.fn(),
  translate: jest.fn(),
  scale: jest.fn(),
  rotate: jest.fn(),
  arc: jest.fn(),
  fill: jest.fn(),
  measureText: jest.fn(() => ({ width: 100 })),
  transform: jest.fn(),
  rect: jest.fn(),
  clip: jest.fn(),
  createLinearGradient: jest.fn(() => ({
    addColorStop: jest.fn(),
  })),
}))

// Mock URL.createObjectURL for image tests
global.URL.createObjectURL = jest.fn(() => 'mock-object-url')
global.URL.revokeObjectURL = jest.fn()

// Console error/warn suppression for expected errors in tests
const originalError = console.error
const originalWarn = console.warn

beforeAll(() => {
  console.error = (message: any, ...args: any[]) => {
    // Suppress React warnings in tests
    if (
      typeof message === 'string' &&
      (message.includes('Warning: ReactDOM.render') ||
        message.includes('Warning: findDOMNode') ||
        message.includes('Warning: componentWillMount'))
    ) {
      return
    }
    originalError(message, ...args)
  }

  console.warn = (message: any, ...args: any[]) => {
    // Suppress development warnings
    if (typeof message === 'string' && message.includes('Warning:')) {
      return
    }
    originalWarn(message, ...args)
  }
})

afterAll(() => {
  console.error = originalError
  console.warn = originalWarn
})

// Global test timeout for integration tests
jest.setTimeout(10000) // 10 seconds

// Test environment variables
process.env.NODE_ENV = 'test'
process.env.NEXT_PUBLIC_SANITY_PROJECT_ID = 'test-project'
process.env.NEXT_PUBLIC_SANITY_DATASET = 'test'

// Phase 3: Test regression tracking
let testStartTime: number
const testResults: Array<Record<string, unknown>> = []

beforeEach(() => {
  testStartTime = performance.now()
  // Clear all mocks before each test
  jest.clearAllMocks()
})

afterEach(() => {
  const testEndTime = performance.now()
  const testDuration = testEndTime - testStartTime

  // Track test performance for regression detection
  if (expect.getState().currentTestName) {
    testResults.push({
      name: expect.getState().currentTestName,
      duration: testDuration,
      status: expect.getState().assertionCalls > 0 ? 'passed' : 'failed',
    })
  }
})

// Export test utilities for use in tests
export const testUtils = {
  mockTextileDesign: (overrides?: Record<string, unknown>) => ({
    _id: 'test-id',
    title: 'Test Design',
    slug: { current: 'test-design' },
    description: 'Test description',
    images: [
      {
        _key: 'img-1',
        asset: {
          _ref: 'image-ref',
          _type: 'reference',
        },
        alt: 'Test image',
        _type: 'image',
      },
    ],
    _createdAt: '2024-01-01',
    _updatedAt: '2024-01-01',
    _rev: 'rev1',
    _type: 'textileDesign',
    ...overrides,
  }),

  createMockTouchEvent: (x: number, y: number) => ({
    touches: [{ clientX: x, clientY: y }],
    preventDefault: jest.fn(),
    stopPropagation: jest.fn(),
  }),

  waitForNextTick: () => new Promise((resolve) => setTimeout(resolve, 0)),

  mockRouter: {
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  },

  createMockSwipeGesture: (overrides?: Record<string, unknown>) => ({
    onTouchStart: jest.fn(),
    onTouchMove: jest.fn(),
    onTouchEnd: jest.fn(),
    isSwiping: false,
    swipeHandlers: {
      onTouchStart: jest.fn(),
      onTouchMove: jest.fn(),
      onTouchEnd: jest.fn(),
    },
    ...overrides,
  }),
}

// Phase 3: Global test quality enforcement
declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveAccessibleName(): R
      toBeVisuallyHidden(): R
      toHaveCorrectARIA(): R
    }
  }
}

// Custom matchers for accessibility testing
expect.extend({
  toHaveAccessibleName(received: HTMLElement) {
    const hasAriaLabel = received.hasAttribute('aria-label')
    const hasAriaLabelledBy = received.hasAttribute('aria-labelledby')
    const hasTitle = received.hasAttribute('title')
    const hasTextContent = Boolean(received.textContent?.trim())

    const pass = hasAriaLabel || hasAriaLabelledBy || hasTitle || hasTextContent

    if (pass) {
      return {
        message: () => `expected element not to have accessible name`,
        pass: true,
      }
    } else {
      return {
        message: () =>
          `expected element to have accessible name (aria-label, aria-labelledby, title, or text content)`,
        pass: false,
      }
    }
  },

  toBeVisuallyHidden(received: HTMLElement) {
    const computedStyle = window.getComputedStyle(received)
    const isHidden =
      computedStyle.display === 'none' ||
      computedStyle.visibility === 'hidden' ||
      computedStyle.opacity === '0' ||
      received.hasAttribute('hidden') ||
      received.getAttribute('aria-hidden') === 'true'

    if (isHidden) {
      return {
        message: () => `expected element not to be visually hidden`,
        pass: true,
      }
    } else {
      return {
        message: () => `expected element to be visually hidden`,
        pass: false,
      }
    }
  },

  toHaveCorrectARIA(received: HTMLElement) {
    // Basic ARIA validation
    const role = received.getAttribute('role')
    const ariaLabel = received.getAttribute('aria-label')
    const ariaLabelledby = received.getAttribute('aria-labelledby')

    let pass = true
    const errors: string[] = []

    // If element has role, validate it's a valid role
    if (
      role &&
      ![
        'button',
        'link',
        'navigation',
        'main',
        'complementary',
        'banner',
        'contentinfo',
      ].includes(role)
    ) {
      pass = false
      errors.push(`Invalid ARIA role: ${role}`)
    }

    // If element has aria-labelledby, referenced element should exist
    if (ariaLabelledby) {
      const referencedElement = document.getElementById(ariaLabelledby)
      if (!referencedElement) {
        pass = false
        errors.push(
          `aria-labelledby references non-existent element: ${ariaLabelledby}`
        )
      }
    }

    return {
      pass,
      message: () => {
        if (pass) {
          return 'expected element to have incorrect ARIA attributes'
        } else {
          return `ARIA validation errors: ${errors.join(', ')}`
        }
      },
    }
  },
})
