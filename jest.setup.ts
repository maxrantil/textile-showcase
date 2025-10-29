// jest.setup.ts
import '@testing-library/jest-dom'
import { configure } from '@testing-library/react'

configure({
  testIdAttribute: 'data-testid',
})

// For CSS testing, we'll need to inject styles manually in tests
// since JSDOM doesn't process CSS the same way browsers do

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

// Mock EventSource for SSE testing (required for SecurityDashboard)
class MockEventSource {
  url: string
  withCredentials: boolean
  readyState = 1
  addEventListener = jest.fn()
  removeEventListener = jest.fn()
  close = jest.fn()

  constructor(url: string, options?: { withCredentials?: boolean }) {
    this.url = url
    this.withCredentials = options?.withCredentials || false
  }
}

Object.defineProperty(globalThis, 'EventSource', {
  writable: true,
  value: MockEventSource,
})

// Mock Performance API for SecurityDashboard performance tests
Object.defineProperty(globalThis, 'performance', {
  writable: true,
  value: {
    ...globalThis.performance,
    now: jest.fn(() => Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByName: jest.fn().mockReturnValue([{ duration: 100 }]),
  },
})

// Mock getBoundingClientRect for touch target tests
Element.prototype.getBoundingClientRect = jest.fn(() => ({
  width: 48,
  height: 48,
  top: 0,
  left: 0,
  bottom: 48,
  right: 48,
  x: 0,
  y: 0,
  toJSON: jest.fn(),
}))

// Mock Web APIs for security tests (Next.js middleware needs these)
if (!global.Request) {
  global.Request = class MockRequest {
    constructor(
      public input: RequestInfo | URL,
      public init?: RequestInit
    ) {
      // Make url a getter to avoid conflicts with NextRequest
      Object.defineProperty(this, 'url', {
        value: typeof input === 'string' ? input : input.toString(),
        writable: false,
      })
      this.method = init?.method || 'GET'
      this.headers = new Headers(init?.headers)
      this._body = init?.body || undefined
    }
    headers = new Headers()
    method = 'GET'
    private _body?: BodyInit

    async json() {
      if (typeof this._body === 'string') {
        return JSON.parse(this._body)
      }
      return {}
    }

    async text() {
      return typeof this._body === 'string' ? this._body : ''
    }
  } as unknown as typeof Request
}

if (!global.Response) {
  global.Response = class MockResponse {
    constructor(
      public body?: BodyInit,
      public init?: ResponseInit
    ) {
      this.status = init?.status || 200
      this.ok = this.status >= 200 && this.status < 300
      this.headers = new Headers(init?.headers)
    }
    headers = new Headers()
    status = 200
    ok = true

    async json() {
      if (typeof this.body === 'string') {
        return JSON.parse(this.body)
      }
      return this.body
    }

    async text() {
      return typeof this.body === 'string' ? this.body : ''
    }

    static json(data: unknown, init?: ResponseInit) {
      const response = new MockResponse(JSON.stringify(data), init)
      response.headers.set('content-type', 'application/json')
      return response
    }
  } as unknown as typeof Response
}
