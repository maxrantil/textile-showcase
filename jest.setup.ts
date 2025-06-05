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

// Mock Headers for API tests - simplified to avoid iterator type conflicts
global.Headers = jest.fn().mockImplementation((init?: HeadersInit) => {
  const headers: Record<string, string> = {}

  // Initialize from various input types
  if (init) {
    if (typeof init === 'object' && !Array.isArray(init) && !(init instanceof Headers)) {
      Object.entries(init).forEach(([key, value]) => {
        headers[key.toLowerCase()] = value
      })
    } else if (Array.isArray(init)) {
      init.forEach(([key, value]) => {
        headers[key.toLowerCase()] = value
      })
    }
  }

  return {
    get: jest.fn((name: string) => headers[name.toLowerCase()] || null),
    set: jest.fn((name: string, value: string) => {
      headers[name.toLowerCase()] = value
    }),
    has: jest.fn((name: string) => name.toLowerCase() in headers),
    append: jest.fn((name: string, value: string) => {
      const existing = headers[name.toLowerCase()]
      if (existing) {
        headers[name.toLowerCase()] = `${existing}, ${value}`
      } else {
        headers[name.toLowerCase()] = value
      }
    }),
    delete: jest.fn((name: string) => {
      delete headers[name.toLowerCase()]
    }),
    getSetCookie: jest.fn(() => {
      const setCookies = headers['set-cookie']
      return setCookies ? setCookies.split(', ') : []
    }),
    forEach: jest.fn((callback: (value: string, key: string) => void) => {
      Object.entries(headers).forEach(([key, value]) => {
        callback(value, key)
      })
    }),
    entries: jest.fn(() => Object.entries(headers)),
    keys: jest.fn(() => Object.keys(headers)),
    values: jest.fn(() => Object.values(headers)),
    [Symbol.iterator]: jest.fn(function* () {
      for (const [key, value] of Object.entries(headers)) {
        yield [key, value]
      }
    })
  }
})

// Mock ReadableStream for API tests - simplified
global.ReadableStream = jest.fn().mockImplementation((underlyingSource?: any) => {
  const chunks: any[] = []
  let position = 0

  // If we have an underlying source with a start method, call it
  if (underlyingSource?.start) {
    const controller = {
      enqueue: (chunk: any) => {
        if (typeof chunk === 'string') {
          chunks.push(new TextEncoder().encode(chunk))
        } else {
          chunks.push(chunk)
        }
      },
      close: () => {},
      error: () => {}
    }
    underlyingSource.start(controller)
  }

  return {
    locked: false,
    getReader: jest.fn(() => ({
      read: jest.fn(async () => {
        if (position >= chunks.length) {
          return { done: true, value: undefined }
        }
        const chunk = chunks[position++]
        return { done: false, value: chunk }
      }),
      releaseLock: jest.fn(),
      closed: Promise.resolve(undefined),
      cancel: jest.fn(async () => undefined)
    })),
    cancel: jest.fn(async () => undefined),
    pipeTo: jest.fn(async () => undefined),
    pipeThrough: jest.fn(() => new (global.ReadableStream as any)()),
    tee: jest.fn(() => [new (global.ReadableStream as any)(), new (global.ReadableStream as any)()])
  }
})

// Add static method to ReadableStream
;(global.ReadableStream as any).fromString = jest.fn((str: string) => {
  return new (global.ReadableStream as any)({
    start(controller: any) {
      controller.enqueue(str)
      controller.close()
    }
  })
})

// Mock TextEncoder and TextDecoder
global.TextEncoder = jest.fn().mockImplementation(() => ({
  encoding: 'utf-8',
  encode: jest.fn((input = '') => {
    const bytes = new Uint8Array(input.length)
    for (let i = 0; i < input.length; i++) {
      bytes[i] = input.charCodeAt(i)
    }
    return bytes
  }),
  encodeInto: jest.fn(() => ({ read: 0, written: 0 }))
}))

global.TextDecoder = jest.fn().mockImplementation(() => ({
  encoding: 'utf-8',
  fatal: false,
  ignoreBOM: false,
  decode: jest.fn((input?: BufferSource) => {
    if (!input) return ''
    if (input instanceof Uint8Array) {
      return String.fromCharCode(...Array.from(input))
    }
    return ''
  })
}))

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
