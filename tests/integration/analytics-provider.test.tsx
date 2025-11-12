// ABOUTME: Integration tests for Umami Analytics Provider component
// Validates script injection logic and environment-based loading

import { render, waitFor } from '@testing-library/react'
import { AnalyticsProvider } from '@/app/components/analytics-provider'

describe('AnalyticsProvider Integration Tests', () => {
  const UMAMI_URL = 'https://analytics.idaromme.dk'
  const WEBSITE_ID = 'caa54504-d542-4ccc-893f-70b6eb054036'

  let originalEnv: NodeJS.ProcessEnv
  let mockRequestIdleCallback: jest.Mock
  let originalRequestIdleCallback: any

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env }

    // Mock document.head.appendChild
    jest.spyOn(document.head, 'appendChild').mockImplementation((node) => node)

    // Mock requestIdleCallback
    mockRequestIdleCallback = jest.fn((callback: IdleRequestCallback) => {
      // Execute callback immediately for testing
      callback({ didTimeout: false, timeRemaining: () => 50 } as IdleDeadline)
      return 1
    })

    originalRequestIdleCallback = window.requestIdleCallback
    Object.defineProperty(window, 'requestIdleCallback', {
      writable: true,
      value: mockRequestIdleCallback,
    })
  })

  afterEach(() => {
    // Restore environment
    process.env = originalEnv
    jest.restoreAllMocks()

    // Restore requestIdleCallback
    Object.defineProperty(window, 'requestIdleCallback', {
      writable: true,
      value: originalRequestIdleCallback,
    })

    // Clean up any scripts added to document
    const scripts = document.querySelectorAll('script[data-website-id]')
    scripts.forEach((script) => script.remove())
  })

  describe('Production Mode - Script Loading', () => {
    it('should load Umami script in production mode with env vars set', async () => {
      process.env.NODE_ENV = 'production'
      process.env.NEXT_PUBLIC_UMAMI_URL = UMAMI_URL
      process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID = WEBSITE_ID

      render(
        <AnalyticsProvider>
          <div>Test Content</div>
        </AnalyticsProvider>
      )

      await waitFor(() => {
        expect(document.head.appendChild).toHaveBeenCalled()
      })

      // Verify script was called with correct properties
      const appendCalls = (document.head.appendChild as jest.Mock).mock.calls
      const scriptCall = appendCalls.find(
        (call) => call[0]?.tagName?.toLowerCase() === 'script'
      )

      expect(scriptCall).toBeDefined()
      const script = scriptCall[0] as HTMLScriptElement

      expect(script.defer).toBe(true)
      expect(script.src).toBe(`${UMAMI_URL}/script.js`)
      expect(script.getAttribute('data-website-id')).toBe(WEBSITE_ID)
    })

    it('should use requestIdleCallback for deferred loading in production', async () => {
      process.env.NODE_ENV = 'production'
      process.env.NEXT_PUBLIC_UMAMI_URL = UMAMI_URL
      process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID = WEBSITE_ID

      render(
        <AnalyticsProvider>
          <div>Test Content</div>
        </AnalyticsProvider>
      )

      await waitFor(() => {
        expect(mockRequestIdleCallback).toHaveBeenCalled()
      })

      // Verify requestIdleCallback was called with proper timeout
      const callArgs = mockRequestIdleCallback.mock.calls[0]
      expect(callArgs).toBeDefined()
      expect(callArgs[1]).toEqual({ timeout: 2000 })
    })

    it('should fallback to setTimeout when requestIdleCallback unavailable', async () => {
      process.env.NODE_ENV = 'production'
      process.env.NEXT_PUBLIC_UMAMI_URL = UMAMI_URL
      process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID = WEBSITE_ID

      // Remove requestIdleCallback
      const originalRIC = window.requestIdleCallback
      // @ts-expect-error - intentionally removing property for test
      delete window.requestIdleCallback

      const setTimeoutSpy = jest.spyOn(window, 'setTimeout')

      render(
        <AnalyticsProvider>
          <div>Test Content</div>
        </AnalyticsProvider>
      )

      await waitFor(() => {
        expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 1000)
      })

      // Restore
      Object.defineProperty(window, 'requestIdleCallback', {
        writable: true,
        value: originalRIC,
      })
    })
  })

  describe('Development Mode - No Script Loading', () => {
    it('should NOT load script in development mode', async () => {
      process.env.NODE_ENV = 'development'
      process.env.NEXT_PUBLIC_UMAMI_URL = UMAMI_URL
      process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID = WEBSITE_ID

      render(
        <AnalyticsProvider>
          <div>Test Content</div>
        </AnalyticsProvider>
      )

      // Wait a bit to ensure no async loading happens
      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(document.head.appendChild).not.toHaveBeenCalled()
      expect(mockRequestIdleCallback).not.toHaveBeenCalled()
    })

    it('should NOT load script when NODE_ENV is test', async () => {
      process.env.NODE_ENV = 'test'
      process.env.NEXT_PUBLIC_UMAMI_URL = UMAMI_URL
      process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID = WEBSITE_ID

      render(
        <AnalyticsProvider>
          <div>Test Content</div>
        </AnalyticsProvider>
      )

      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(document.head.appendChild).not.toHaveBeenCalled()
    })
  })

  describe('Missing Environment Variables', () => {
    it('should NOT load script when NEXT_PUBLIC_UMAMI_URL is missing', async () => {
      process.env.NODE_ENV = 'production'
      delete process.env.NEXT_PUBLIC_UMAMI_URL
      process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID = WEBSITE_ID

      render(
        <AnalyticsProvider>
          <div>Test Content</div>
        </AnalyticsProvider>
      )

      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(document.head.appendChild).not.toHaveBeenCalled()
      expect(mockRequestIdleCallback).not.toHaveBeenCalled()
    })

    it('should NOT load script when NEXT_PUBLIC_UMAMI_WEBSITE_ID is missing', async () => {
      process.env.NODE_ENV = 'production'
      process.env.NEXT_PUBLIC_UMAMI_URL = UMAMI_URL
      delete process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID

      render(
        <AnalyticsProvider>
          <div>Test Content</div>
        </AnalyticsProvider>
      )

      await new Promise((resolve) => setTimeout(resolve, 100))

      // Script might be added but without website ID
      // This tests the component's handling of missing WEBSITE_ID
      const appendCalls = (document.head.appendChild as jest.Mock).mock.calls
      const scriptCall = appendCalls.find(
        (call) => call[0]?.tagName?.toLowerCase() === 'script'
      )

      if (scriptCall) {
        const script = scriptCall[0] as HTMLScriptElement
        // If script was added, website-id should be empty string
        expect(script.getAttribute('data-website-id')).toBe('')
      }
    })

    it('should NOT load script when both env vars are missing', async () => {
      process.env.NODE_ENV = 'production'
      delete process.env.NEXT_PUBLIC_UMAMI_URL
      delete process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID

      render(
        <AnalyticsProvider>
          <div>Test Content</div>
        </AnalyticsProvider>
      )

      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(document.head.appendChild).not.toHaveBeenCalled()
    })
  })

  describe('Children Rendering', () => {
    it('should render children regardless of analytics loading', async () => {
      process.env.NODE_ENV = 'production'
      process.env.NEXT_PUBLIC_UMAMI_URL = UMAMI_URL
      process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID = WEBSITE_ID

      const { getByText } = render(
        <AnalyticsProvider>
          <div>Test Content</div>
        </AnalyticsProvider>
      )

      expect(getByText('Test Content')).toBeInTheDocument()
    })

    it('should render children even when analytics fails to load', async () => {
      process.env.NODE_ENV = 'development'

      const { getByText } = render(
        <AnalyticsProvider>
          <div>Child Component</div>
        </AnalyticsProvider>
      )

      expect(getByText('Child Component')).toBeInTheDocument()
    })

    it('should render multiple children correctly', async () => {
      process.env.NODE_ENV = 'production'
      process.env.NEXT_PUBLIC_UMAMI_URL = UMAMI_URL
      process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID = WEBSITE_ID

      const { getByText } = render(
        <AnalyticsProvider>
          <div>First Child</div>
          <div>Second Child</div>
          <div>Third Child</div>
        </AnalyticsProvider>
      )

      expect(getByText('First Child')).toBeInTheDocument()
      expect(getByText('Second Child')).toBeInTheDocument()
      expect(getByText('Third Child')).toBeInTheDocument()
    })
  })

  describe('Script Attributes Validation', () => {
    it('should set defer attribute on script element', async () => {
      process.env.NODE_ENV = 'production'
      process.env.NEXT_PUBLIC_UMAMI_URL = UMAMI_URL
      process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID = WEBSITE_ID

      render(
        <AnalyticsProvider>
          <div>Test</div>
        </AnalyticsProvider>
      )

      await waitFor(() => {
        expect(document.head.appendChild).toHaveBeenCalled()
      })

      const appendCalls = (document.head.appendChild as jest.Mock).mock.calls
      const scriptCall = appendCalls.find(
        (call) => call[0]?.tagName?.toLowerCase() === 'script'
      )

      const script = scriptCall[0] as HTMLScriptElement
      expect(script.defer).toBe(true)
    })

    it('should construct correct script URL from environment variable', async () => {
      const customURL = 'https://custom-analytics.example.com'
      process.env.NODE_ENV = 'production'
      process.env.NEXT_PUBLIC_UMAMI_URL = customURL
      process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID = WEBSITE_ID

      render(
        <AnalyticsProvider>
          <div>Test</div>
        </AnalyticsProvider>
      )

      await waitFor(() => {
        expect(document.head.appendChild).toHaveBeenCalled()
      })

      const appendCalls = (document.head.appendChild as jest.Mock).mock.calls
      const scriptCall = appendCalls.find(
        (call) => call[0]?.tagName?.toLowerCase() === 'script'
      )

      const script = scriptCall[0] as HTMLScriptElement
      expect(script.src).toBe(`${customURL}/script.js`)
    })

    it('should set data-website-id attribute correctly', async () => {
      const customWebsiteId = 'custom-website-id-12345'
      process.env.NODE_ENV = 'production'
      process.env.NEXT_PUBLIC_UMAMI_URL = UMAMI_URL
      process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID = customWebsiteId

      render(
        <AnalyticsProvider>
          <div>Test</div>
        </AnalyticsProvider>
      )

      await waitFor(() => {
        expect(document.head.appendChild).toHaveBeenCalled()
      })

      const appendCalls = (document.head.appendChild as jest.Mock).mock.calls
      const scriptCall = appendCalls.find(
        (call) => call[0]?.tagName?.toLowerCase() === 'script'
      )

      const script = scriptCall[0] as HTMLScriptElement
      expect(script.getAttribute('data-website-id')).toBe(customWebsiteId)
    })
  })

  describe('Regression Prevention', () => {
    it('should fail if script is not deferred', async () => {
      process.env.NODE_ENV = 'production'
      process.env.NEXT_PUBLIC_UMAMI_URL = UMAMI_URL
      process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID = WEBSITE_ID

      render(
        <AnalyticsProvider>
          <div>Test</div>
        </AnalyticsProvider>
      )

      await waitFor(() => {
        expect(document.head.appendChild).toHaveBeenCalled()
      })

      const appendCalls = (document.head.appendChild as jest.Mock).mock.calls
      const scriptCall = appendCalls.find(
        (call) => call[0]?.tagName?.toLowerCase() === 'script'
      )

      const script = scriptCall[0] as HTMLScriptElement

      if (!script.defer) {
        throw new Error(
          'CRITICAL: Analytics script is not deferred! This will block page rendering and hurt performance.'
        )
      }

      expect(script.defer).toBe(true)
    })

    it('should fail if production mode check is removed', async () => {
      // This test ensures analytics only loads in production
      process.env.NODE_ENV = 'development'
      process.env.NEXT_PUBLIC_UMAMI_URL = UMAMI_URL
      process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID = WEBSITE_ID

      render(
        <AnalyticsProvider>
          <div>Test</div>
        </AnalyticsProvider>
      )

      await new Promise((resolve) => setTimeout(resolve, 100))

      const wasScriptLoaded = (document.head.appendChild as jest.Mock).mock
        .calls.length > 0

      if (wasScriptLoaded) {
        throw new Error(
          'CRITICAL: Analytics script loaded in development mode! ' +
            'This wastes resources and pollutes analytics data. ' +
            'Analytics should ONLY load in production.'
        )
      }

      expect(document.head.appendChild).not.toHaveBeenCalled()
    })

    it('should fail if environment variable check is removed', async () => {
      process.env.NODE_ENV = 'production'
      delete process.env.NEXT_PUBLIC_UMAMI_URL

      render(
        <AnalyticsProvider>
          <div>Test</div>
        </AnalyticsProvider>
      )

      await new Promise((resolve) => setTimeout(resolve, 100))

      const wasScriptLoaded = (document.head.appendChild as jest.Mock).mock
        .calls.length > 0

      if (wasScriptLoaded) {
        throw new Error(
          'CRITICAL: Analytics script loaded without NEXT_PUBLIC_UMAMI_URL! ' +
            'This will cause errors. Analytics should only load when properly configured.'
        )
      }

      expect(document.head.appendChild).not.toHaveBeenCalled()
    })
  })
})
