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

// Mock Sanity client
jest.mock('@/sanity/lib', () => ({
  client: {
    fetch: jest.fn(),
  },
  getOptimizedImageUrl: jest.fn((src) => `optimized-${src}`),
  getBlurDataUrl: jest.fn(() => 'blur-data-url'),
}))

// Mock scroll manager
jest.mock('@/lib/scrollManager', () => ({
  scrollManager: {
    save: jest.fn(),
    saveImmediate: jest.fn(),
    getSavedIndex: jest.fn(() => 0),
    triggerNavigationStart: jest.fn(),
    triggerNavigationComplete: jest.fn(),
    debug: jest.fn(),
  },
}))

// Mock Headers for API tests
global.Headers = class Headers {
  private headers: Record<string, string> = {}
  
  constructor(init?: Record<string, string>) {
    if (init) {
      Object.assign(this.headers, init)
    }
  }
  
  get(name: string) {
    return this.headers[name.toLowerCase()] || null
  }
  
  set(name: string, value: string) {
    this.headers[name.toLowerCase()] = value
  }
  
  has(name: string) {
    return name.toLowerCase() in this.headers
  }
  
  append(name: string, value: string) {
    const existing = this.get(name)
    if (existing) {
      this.set(name, `${existing}, ${value}`)
    } else {
      this.set(name, value)
    }
  }
  
  delete(name: string) {
    delete this.headers[name.toLowerCase()]
  }
  
  *[Symbol.iterator]() {
    for (const [name, value] of Object.entries(this.headers)) {
      yield [name, value]
    }
  }
}

// Mock ReadableStream for API tests
global.ReadableStream = class ReadableStream {
  private chunks: Uint8Array[]
  private position: number
  
  constructor(underlyingSource?: any) {
    this.chunks = []
    this.position = 0
    
    // If we have an underlying source with a start method, call it
    if (underlyingSource?.start) {
      const controller = {
        enqueue: (chunk: any) => {
          if (typeof chunk === 'string') {
            this.chunks.push(new TextEncoder().encode(chunk))
          } else if (chunk instanceof Uint8Array) {
            this.chunks.push(chunk)
          }
        },
        close: () => {},
        error: (error: any) => {}
      }
      underlyingSource.start(controller)
    }
  }
  
  getReader() {
    return {
      read: async () => {
        if (this.position >= this.chunks.length) {
          return { done: true, value: undefined }
        }
        const chunk = this.chunks[this.position++]
        return { done: false, value: chunk }
      },
      releaseLock: () => {}
    }
  }
  
  // Add static method to create from string (useful for tests)
  static fromString(str: string) {
    return new ReadableStream({
      start(controller) {
        controller.enqueue(str)
        controller.close()
      }
    })
  }
}

// Mock TextEncoder and TextDecoder for ReadableStream
global.TextEncoder = class TextEncoder {
  encode(input: string): Uint8Array {
    const bytes = new Uint8Array(input.length)
    for (let i = 0; i < input.length; i++) {
      bytes[i] = input.charCodeAt(i)
    }
    return bytes
  }
}

global.TextDecoder = class TextDecoder {
  decode(input: Uint8Array): string {
    return String.fromCharCode(...Array.from(input))
  }
}

// Mock window.scrollBy for keyboard navigation tests
Object.defineProperty(window, 'scrollBy', {
  value: jest.fn(),
  writable: true,
})

// Mock window.scrollTo for gallery tests
Object.defineProperty(window, 'scrollTo', {
  value: jest.fn(),
  writable: true,
})
