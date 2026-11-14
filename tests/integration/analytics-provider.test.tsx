// ABOUTME: Integration tests for Umami Analytics Provider component
// Validates script injection logic and environment-based loading

import { render, waitFor } from '@testing-library/react'
import { AnalyticsProvider } from '@/app/components/analytics-provider'

describe('AnalyticsProvider Integration Tests', () => {
  const UMAMI_URL = 'https://analytics.idaromme.dk'
  const WEBSITE_ID = 'caa54504-d542-4ccc-893f-70b6eb054036'

  let originalEnv: NodeJS.ProcessEnv
  let mockRequestIdleCallback: jest.Mock
  let originalRequestIdleCallback: typeof window.requestIdleCallback

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
      Object.defineProperty(process.env, 'NODE_ENV', {
        writable: true,
        value: 'production',
      })
      Object.defineProperty(process.env, 'NEXT_PUBLIC_UMAMI_URL', {
        writable: true,
        value: UMAMI_URL,
      })
      Object.defineProperty(process.env, 'NEXT_PUBLIC_UMAMI_WEBSITE_ID', {
        writable: true,
        value: WEBSITE_ID,
      })

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
      Object.defineProperty(process.env, 'NODE_ENV', {
        writable: true,
        value: 'production',
      })
      Object.defineProperty(process.env, 'NEXT_PUBLIC_UMAMI_URL', {
        writable: true,
        value: UMAMI_URL,
      })
      Object.defineProperty(process.env, 'NEXT_PUBLIC_UMAMI_WEBSITE_ID', {
        writable: true,
        value: WEBSITE_ID,
      })

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
      Object.defineProperty(process.env, 'NODE_ENV', {
        writable: true,
        value: 'production',
      })
      Object.defineProperty(process.env, 'NEXT_PUBLIC_UMAMI_URL', {
        writable: true,
        value: UMAMI_URL,
      })
      Object.defineProperty(process.env, 'NEXT_PUBLIC_UMAMI_WEBSITE_ID', {
        writable: true,
        value: WEBSITE_ID,
      })

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
      Object.defineProperty(process.env, 'NODE_ENV', {
        writable: true,
        value: 'development',
      })
      Object.defineProperty(process.env, 'NEXT_PUBLIC_UMAMI_URL', {
        writable: true,
        value: UMAMI_URL,
      })
      Object.defineProperty(process.env, 'NEXT_PUBLIC_UMAMI_WEBSITE_ID', {
        writable: true,
        value: WEBSITE_ID,
      })

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
      Object.defineProperty(process.env, 'NODE_ENV', {
        writable: true,
        value: 'test',
      })
      Object.defineProperty(process.env, 'NEXT_PUBLIC_UMAMI_URL', {
        writable: true,
        value: UMAMI_URL,
      })
      Object.defineProperty(process.env, 'NEXT_PUBLIC_UMAMI_WEBSITE_ID', {
        writable: true,
        value: WEBSITE_ID,
      })

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
      Object.defineProperty(process.env, 'NODE_ENV', {
        writable: true,
        value: 'production',
      })
      Object.defineProperty(process.env, 'NEXT_PUBLIC_UMAMI_URL', {
        writable: true,
        value: undefined,
      })
      Object.defineProperty(process.env, 'NEXT_PUBLIC_UMAMI_WEBSITE_ID', {
        writable: true,
        value: WEBSITE_ID,
      })

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
      Object.defineProperty(process.env, 'NODE_ENV', {
        writable: true,
        value: 'production',
      })
      Object.defineProperty(process.env, 'NEXT_PUBLIC_UMAMI_URL', {
        writable: true,
        value: UMAMI_URL,
      })
      Object.defineProperty(process.env, 'NEXT_PUBLIC_UMAMI_WEBSITE_ID', {
        writable: true,
        value: undefined,
      })

      render(
        <AnalyticsProvider>
          <div>Test Content</div>
        </AnalyticsProvider>
      )

      await new Promise((resolve) => setTimeout(resolve, 100))

      // Without a website ID the tracker has nowhere to report to
      expect(document.head.appendChild).not.toHaveBeenCalled()
      expect(mockRequestIdleCallback).not.toHaveBeenCalled()
    })

    it('should NOT load script when both env vars are missing', async () => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        writable: true,
        value: 'production',
      })
      Object.defineProperty(process.env, 'NEXT_PUBLIC_UMAMI_URL', {
        writable: true,
        value: undefined,
      })
      Object.defineProperty(process.env, 'NEXT_PUBLIC_UMAMI_WEBSITE_ID', {
        writable: true,
        value: undefined,
      })

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
      Object.defineProperty(process.env, 'NODE_ENV', {
        writable: true,
        value: 'production',
      })
      Object.defineProperty(process.env, 'NEXT_PUBLIC_UMAMI_URL', {
        writable: true,
        value: UMAMI_URL,
      })
      Object.defineProperty(process.env, 'NEXT_PUBLIC_UMAMI_WEBSITE_ID', {
        writable: true,
        value: WEBSITE_ID,
      })

      const { getByText } = render(
        <AnalyticsProvider>
          <div>Test Content</div>
        </AnalyticsProvider>
      )

      expect(getByText('Test Content')).toBeInTheDocument()
    })

    it('should render children even when analytics fails to load', async () => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        writable: true,
        value: 'development',
      })

      const { getByText } = render(
        <AnalyticsProvider>
          <div>Child Component</div>
        </AnalyticsProvider>
      )

      expect(getByText('Child Component')).toBeInTheDocument()
    })

    it('should render multiple children correctly', async () => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        writable: true,
        value: 'production',
      })
      Object.defineProperty(process.env, 'NEXT_PUBLIC_UMAMI_URL', {
        writable: true,
        value: UMAMI_URL,
      })
      Object.defineProperty(process.env, 'NEXT_PUBLIC_UMAMI_WEBSITE_ID', {
        writable: true,
        value: WEBSITE_ID,
      })

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
      Object.defineProperty(process.env, 'NODE_ENV', {
        writable: true,
        value: 'production',
      })
      Object.defineProperty(process.env, 'NEXT_PUBLIC_UMAMI_URL', {
        writable: true,
        value: UMAMI_URL,
      })
      Object.defineProperty(process.env, 'NEXT_PUBLIC_UMAMI_WEBSITE_ID', {
        writable: true,
        value: WEBSITE_ID,
      })

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
      Object.defineProperty(process.env, 'NODE_ENV', {
        writable: true,
        value: 'production',
      })
      Object.defineProperty(process.env, 'NEXT_PUBLIC_UMAMI_URL', {
        writable: true,
        value: customURL,
      })
      Object.defineProperty(process.env, 'NEXT_PUBLIC_UMAMI_WEBSITE_ID', {
        writable: true,
        value: WEBSITE_ID,
      })

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
      Object.defineProperty(process.env, 'NODE_ENV', {
        writable: true,
        value: 'production',
      })
      Object.defineProperty(process.env, 'NEXT_PUBLIC_UMAMI_URL', {
        writable: true,
        value: UMAMI_URL,
      })
      Object.defineProperty(process.env, 'NEXT_PUBLIC_UMAMI_WEBSITE_ID', {
        writable: true,
        value: customWebsiteId,
      })

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

  describe('Isolation from the page (Issue #263)', () => {
    const enableAnalytics = () => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        writable: true,
        value: 'production',
      })
      Object.defineProperty(process.env, 'NEXT_PUBLIC_UMAMI_URL', {
        writable: true,
        value: UMAMI_URL,
      })
      Object.defineProperty(process.env, 'NEXT_PUBLIC_UMAMI_WEBSITE_ID', {
        writable: true,
        value: WEBSITE_ID,
      })
    }

    const setReadyState = (state: DocumentReadyState) => {
      Object.defineProperty(document, 'readyState', {
        configurable: true,
        get: () => state,
      })
    }

    afterEach(() => {
      // Drop the override so the document reports its own state again
      delete (document as unknown as Record<string, unknown>).readyState
    })

    it('should apply the CSP nonce to the script element', async () => {
      enableAnalytics()

      render(
        <AnalyticsProvider nonce="test-nonce-123">
          <div>Test</div>
        </AnalyticsProvider>
      )

      await waitFor(() => {
        expect(document.head.appendChild).toHaveBeenCalled()
      })

      const script = (document.head.appendChild as jest.Mock).mock
        .calls[0][0] as HTMLScriptElement
      expect(script.getAttribute('nonce')).toBe('test-nonce-123')
    })

    it('should wait for the window load event before adding the script', async () => {
      enableAnalytics()
      setReadyState('loading')

      render(
        <AnalyticsProvider>
          <div>Test</div>
        </AnalyticsProvider>
      )

      await new Promise((resolve) => setTimeout(resolve, 50))

      // A pending script request must not be able to hold back the load event
      expect(mockRequestIdleCallback).not.toHaveBeenCalled()
      expect(document.head.appendChild).not.toHaveBeenCalled()

      window.dispatchEvent(new Event('load'))

      await waitFor(() => {
        expect(document.head.appendChild).toHaveBeenCalled()
      })
    })

    it('should keep children rendered when adding the script throws', async () => {
      enableAnalytics()
      ;(document.head.appendChild as jest.Mock).mockImplementation(() => {
        throw new Error('appendChild failed')
      })

      const { getByText } = render(
        <AnalyticsProvider>
          <div>Still Here</div>
        </AnalyticsProvider>
      )

      await waitFor(() => {
        expect(document.head.appendChild).toHaveBeenCalled()
      })

      expect(getByText('Still Here')).toBeInTheDocument()
    })

    it('should add the script only once when the nonce changes', async () => {
      enableAnalytics()
      // Let the script reach the document so the second run can see it
      ;(document.head.appendChild as jest.Mock).mockRestore()

      const { rerender } = render(
        <AnalyticsProvider nonce="first">
          <div>Test</div>
        </AnalyticsProvider>
      )

      await waitFor(() => {
        expect(
          document.querySelectorAll('script[data-website-id]')
        ).toHaveLength(1)
      })

      rerender(
        <AnalyticsProvider nonce="second">
          <div>Test</div>
        </AnalyticsProvider>
      )

      await new Promise((resolve) => setTimeout(resolve, 50))

      expect(document.querySelectorAll('script[data-website-id]')).toHaveLength(
        1
      )
    })
  })

  describe('Regression Prevention', () => {
    it('should fail if script is not deferred', async () => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        writable: true,
        value: 'production',
      })
      Object.defineProperty(process.env, 'NEXT_PUBLIC_UMAMI_URL', {
        writable: true,
        value: UMAMI_URL,
      })
      Object.defineProperty(process.env, 'NEXT_PUBLIC_UMAMI_WEBSITE_ID', {
        writable: true,
        value: WEBSITE_ID,
      })

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
      Object.defineProperty(process.env, 'NODE_ENV', {
        writable: true,
        value: 'development',
      })
      Object.defineProperty(process.env, 'NEXT_PUBLIC_UMAMI_URL', {
        writable: true,
        value: UMAMI_URL,
      })
      Object.defineProperty(process.env, 'NEXT_PUBLIC_UMAMI_WEBSITE_ID', {
        writable: true,
        value: WEBSITE_ID,
      })

      render(
        <AnalyticsProvider>
          <div>Test</div>
        </AnalyticsProvider>
      )

      await new Promise((resolve) => setTimeout(resolve, 100))

      const wasScriptLoaded =
        (document.head.appendChild as jest.Mock).mock.calls.length > 0

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
      Object.defineProperty(process.env, 'NODE_ENV', {
        writable: true,
        value: 'production',
      })
      Object.defineProperty(process.env, 'NEXT_PUBLIC_UMAMI_URL', {
        writable: true,
        value: undefined,
      })

      render(
        <AnalyticsProvider>
          <div>Test</div>
        </AnalyticsProvider>
      )

      await new Promise((resolve) => setTimeout(resolve, 100))

      const wasScriptLoaded =
        (document.head.appendChild as jest.Mock).mock.calls.length > 0

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
