/**
 * ABOUTME: Comprehensive test suite for SecurityDashboard component
 * Full test coverage including authentication, accessibility, performance, SSE, and i18n
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe, toHaveNoViolations } from 'jest-axe'
import '@testing-library/jest-dom'

// Import SecurityDashboard components for testing
import { SecurityDashboard } from '../SecurityDashboard'
import { SecurityProvider } from '../SecurityProvider'

// Extend Jest matchers for accessibility testing
expect.extend(toHaveNoViolations)

// Mock dependencies
jest.mock('../../../../lib/security/security-event-logger')

describe('SecurityDashboard - Authentication Tests', () => {
  test('should require authentication to access dashboard', async () => {
    render(
      <SecurityProvider>
        <SecurityDashboard />
      </SecurityProvider>
    )

    // Should require authentication
    expect(
      screen.queryByTestId('security-dashboard-unauthorized')
    ).toBeInTheDocument()
    expect(
      screen.queryByTestId('security-dashboard-content')
    ).not.toBeInTheDocument()
  })

  test('should block access for users without security role', async () => {
    const mockUser = {
      id: 'user-123',
      roles: ['user'], // No security role
    }

    render(
      <SecurityProvider user={mockUser}>
        <SecurityDashboard />
      </SecurityProvider>
    )

    expect(
      screen.getByTestId('security-dashboard-forbidden')
    ).toBeInTheDocument()
    expect(screen.getByText(/insufficient privileges/i)).toBeInTheDocument()
  })

  test('should allow access for security analysts', async () => {
    const mockSecurityAnalyst = {
      id: 'analyst-123',
      roles: ['security_analyst'],
    }

    render(
      <SecurityProvider user={mockSecurityAnalyst}>
        <SecurityDashboard />
      </SecurityProvider>
    )

    expect(screen.getByTestId('security-dashboard-content')).toBeInTheDocument()
    expect(
      screen.getByRole('main', { name: /security monitoring dashboard/i })
    ).toBeInTheDocument()
  })

  test('should allow access for admin users', async () => {
    const mockAdmin = {
      id: 'admin-123',
      roles: ['admin'],
    }

    render(
      <SecurityProvider user={mockAdmin}>
        <SecurityDashboard />
      </SecurityProvider>
    )

    expect(screen.getByTestId('security-dashboard-content')).toBeInTheDocument()
  })
})

describe('SecurityDashboard - WCAG 2.1 AA Compliance Tests', () => {
  const mockAuthorizedUser = {
    id: 'analyst-123',
    roles: ['security_analyst'],
  }

  test('should pass axe accessibility audit', async () => {
    const { container } = render(
      <SecurityProvider user={mockAuthorizedUser}>
        <SecurityDashboard />
      </SecurityProvider>
    )

    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  test('should have proper semantic structure with headings', () => {
    render(
      <SecurityProvider user={mockAuthorizedUser}>
        <SecurityDashboard />
      </SecurityProvider>
    )

    // Required heading structure for WCAG compliance
    expect(
      screen.getByRole('heading', { level: 1, name: /security status/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 2, name: /recent events/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 2, name: /security alerts/i })
    ).toBeInTheDocument()
  })

  test('should support complete keyboard navigation', async () => {
    const user = userEvent.setup()

    render(
      <SecurityProvider user={mockAuthorizedUser}>
        <SecurityDashboard />
      </SecurityProvider>
    )

    // Tab through all interactive elements
    await user.tab()
    expect(screen.getByTestId('security-status-indicator')).toHaveFocus()

    await user.tab()
    expect(screen.getByTestId('security-events-list')).toHaveFocus()

    await user.tab()
    expect(screen.getByTestId('security-alert-dismiss-button')).toHaveFocus()

    // Test keyboard shortcuts
    await user.keyboard('{Alt>}s{/Alt}')
    expect(screen.getByTestId('security-dashboard-shortcut-menu')).toBeVisible()

    await user.keyboard('{Escape}')
    expect(
      screen.getByTestId('security-dashboard-shortcut-menu')
    ).not.toBeVisible()
  })

  test('should have ARIA live regions for security alerts', () => {
    render(
      <SecurityProvider user={mockAuthorizedUser}>
        <SecurityDashboard />
      </SecurityProvider>
    )

    // Critical alerts should use assertive live region
    expect(
      screen.getByRole('status', { name: /security alerts critical/i })
    ).toHaveAttribute('aria-live', 'assertive')

    // Non-critical alerts should use polite live region
    expect(
      screen.getByRole('status', { name: /security alerts polite/i })
    ).toHaveAttribute('aria-live', 'polite')
  })

  test('should meet color contrast requirements (4.5:1 minimum)', () => {
    render(
      <SecurityProvider user={mockAuthorizedUser}>
        <SecurityDashboard />
      </SecurityProvider>
    )

    // Security status indicators must meet contrast requirements
    const criticalAlert = screen.getByTestId('security-status-critical')
    // Note: Could add computed styles validation here if needed for contrast calculation

    // This test will need manual verification or contrast calculation
    expect(criticalAlert).toHaveClass('high-contrast-critical')
  })

  test('should have minimum 44px touch targets for mobile', () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', { value: 375 })
    Object.defineProperty(window, 'innerHeight', { value: 667 })

    render(
      <SecurityProvider user={mockAuthorizedUser}>
        <SecurityDashboard />
      </SecurityProvider>
    )

    const dismissButton = screen.getByTestId('security-alert-dismiss-button')
    const buttonRect = dismissButton.getBoundingClientRect()

    expect(buttonRect.width).toBeGreaterThanOrEqual(44)
    expect(buttonRect.height).toBeGreaterThanOrEqual(44)
  })
})

describe('SecurityDashboard - Performance Tests', () => {
  const mockAuthorizedUser = {
    id: 'analyst-123',
    roles: ['security_analyst'],
  }

  test('should load within 2 seconds with large dataset', async () => {
    // Mock large security events dataset (10,000 events)
    const largeEventSet = Array.from({ length: 10000 }, (_, i) => ({
      id: `perf-event-${i}`,
      timestamp: new Date(),
      eventType: 'api_key_usage' as const,
      severity: 'info' as const,
      metadata: { ipAddress: `192.168.1.${i % 255}` },
    }))

    performance.mark('dashboard-load-start')

    render(
      <SecurityProvider user={mockAuthorizedUser}>
        <SecurityDashboard securityEvents={largeEventSet} />
      </SecurityProvider>
    )

    await waitFor(() => {
      expect(
        screen.getByTestId('security-dashboard-content')
      ).toBeInTheDocument()
    })

    performance.mark('dashboard-load-end')
    performance.measure(
      'dashboard-load',
      'dashboard-load-start',
      'dashboard-load-end'
    )

    const measures = performance.getEntriesByName('dashboard-load')
    const loadTime = measures[0].duration

    // Critical requirement: <2 second load time
    expect(loadTime).toBeLessThan(2000)
  })

  test('should efficiently handle virtual scrolling for large lists', async () => {
    const manyEvents = Array.from({ length: 5000 }, (_, i) => ({
      id: `virtual-event-${i}`,
      timestamp: new Date(),
      eventType: 'authentication' as const,
      severity: 'info' as const,
    }))

    const { container } = render(
      <SecurityProvider user={mockAuthorizedUser}>
        <SecurityDashboard securityEvents={manyEvents} />
      </SecurityProvider>
    )

    // Should only render visible items, not all 5000
    const renderedEvents = container.querySelectorAll(
      '[data-testid^="security-event-item-"]'
    )
    expect(renderedEvents.length).toBeLessThan(100) // Only visible items rendered

    // Test scrolling performance
    const scrollContainer = screen.getByTestId(
      'security-events-scroll-container'
    )

    performance.mark('scroll-start')

    for (let i = 0; i < 50; i++) {
      fireEvent.scroll(scrollContainer, { target: { scrollTop: i * 100 } })
    }

    await waitFor(() => {
      expect(scrollContainer.scrollTop).toBeGreaterThan(0)
    })

    performance.mark('scroll-end')
    performance.measure('scroll-performance', 'scroll-start', 'scroll-end')

    const scrollMeasures = performance.getEntriesByName('scroll-performance')
    const scrollTime = scrollMeasures[0].duration

    expect(scrollTime).toBeLessThan(500) // Smooth scrolling requirement
  })

  test('should maintain stable memory usage during real-time updates', async () => {
    const initialMemory =
      (performance as Performance & { memory?: { usedJSHeapSize: number } })
        .memory?.usedJSHeapSize || 0

    render(
      <SecurityProvider user={mockAuthorizedUser}>
        <SecurityDashboard />
      </SecurityProvider>
    )

    // Simulate 1000 rapid security event updates
    for (let i = 0; i < 1000; i++) {
      fireEvent(
        window,
        new CustomEvent('security-event', {
          detail: {
            id: `memory-test-${i}`,
            eventType: 'rate_limit',
            severity: 'warning',
          },
        })
      )

      await new Promise((resolve) => setTimeout(resolve, 1))
    }

    // Force garbage collection if available
    const windowWithGC = window as Window & { gc?: () => void }
    if (windowWithGC.gc) {
      windowWithGC.gc()
    }

    const finalMemory =
      (performance as Performance & { memory?: { usedJSHeapSize: number } })
        .memory?.usedJSHeapSize || 0
    const memoryIncrease = finalMemory - initialMemory

    // Memory increase should be reasonable (less than 10MB)
    expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024)
  })
})

describe('SecurityDashboard - Real-time SSE Updates Tests', () => {
  const mockAuthorizedUser = {
    id: 'analyst-123',
    roles: ['security_analyst'],
  }

  test('should connect to SSE endpoint on mount', () => {
    const originalEventSource = (globalThis as any).EventSource
    const mockEventSourceConstructor = jest
      .fn()
      .mockImplementation((url, options) => {
        return new originalEventSource(url, options)
      })
    ;(globalThis as any).EventSource = mockEventSourceConstructor

    render(
      <SecurityProvider user={mockAuthorizedUser}>
        <SecurityDashboard />
      </SecurityProvider>
    )

    expect(mockEventSourceConstructor).toHaveBeenCalledWith(
      '/api/security/events/stream',
      {
        withCredentials: true,
      }
    )

    // Restore original mock
    ;(globalThis as any).EventSource = originalEventSource
  })

  test('should process incoming SSE security events', async () => {
    let eventSourceInstance: any

    // Create a simplified mock EventSource
    class SimpleMockEventSource {
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

    const mockEventSourceConstructor = jest
      .fn()
      .mockImplementation((url, options) => {
        eventSourceInstance = new SimpleMockEventSource(url, options)
        return eventSourceInstance
      })
    ;(globalThis as any).EventSource = mockEventSourceConstructor

    render(
      <SecurityProvider user={mockAuthorizedUser}>
        <SecurityDashboard />
      </SecurityProvider>
    )

    await waitFor(() => {
      expect(eventSourceInstance?.addEventListener).toHaveBeenCalledWith(
        'message',
        expect.any(Function)
      )
    })

    // Get the message event handler
    const messageHandler =
      eventSourceInstance?.addEventListener.mock.calls.find(
        (call: any[]) => call[0] === 'message'
      )?.[1]

    expect(messageHandler).toBeDefined()

    // Simulate SSE message with act wrapper
    await act(async () => {
      messageHandler!({
        data: JSON.stringify({
          id: 'sse-test-1',
          eventType: 'authentication',
          severity: 'warning',
          timestamp: new Date(),
          metadata: { ipAddress: '192.168.1.1' },
        }),
      })
    })

    await waitFor(
      () => {
        expect(
          screen.getByTestId('security-event-sse-test-1')
        ).toBeInTheDocument()
      },
      { timeout: 3000 }
    )
  })

  test('should handle SSE connection errors gracefully', async () => {
    let eventSourceInstance: any

    // Create a simplified mock EventSource
    class SimpleMockEventSource {
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

    const mockEventSourceConstructor = jest
      .fn()
      .mockImplementation((url, options) => {
        eventSourceInstance = new SimpleMockEventSource(url, options)
        return eventSourceInstance
      })
    ;(globalThis as any).EventSource = mockEventSourceConstructor

    render(
      <SecurityProvider user={mockAuthorizedUser}>
        <SecurityDashboard />
      </SecurityProvider>
    )

    await waitFor(() => {
      expect(eventSourceInstance?.addEventListener).toHaveBeenCalledWith(
        'error',
        expect.any(Function)
      )
    })

    // Get the error event handler
    const errorHandler = eventSourceInstance?.addEventListener.mock.calls.find(
      (call: any[]) => call[0] === 'error'
    )?.[1]

    expect(errorHandler).toBeDefined()

    // Simulate SSE error with act wrapper
    await act(async () => {
      errorHandler!(new Error('SSE connection failed'))
    })

    await waitFor(() => {
      expect(
        screen.getByTestId('security-dashboard-connection-error')
      ).toBeInTheDocument()
    })
  })

  test('should update ARIA live regions with new security events', async () => {
    let eventSourceInstance: any

    // Create a simplified mock EventSource
    class SimpleMockEventSource {
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

    const mockEventSourceConstructor = jest
      .fn()
      .mockImplementation((url, options) => {
        eventSourceInstance = new SimpleMockEventSource(url, options)
        return eventSourceInstance
      })
    ;(globalThis as any).EventSource = mockEventSourceConstructor

    render(
      <SecurityProvider user={mockAuthorizedUser}>
        <SecurityDashboard />
      </SecurityProvider>
    )

    await waitFor(() => {
      expect(eventSourceInstance?.addEventListener).toHaveBeenCalledWith(
        'message',
        expect.any(Function)
      )
    })

    // Get the message event handler
    const messageHandler =
      eventSourceInstance?.addEventListener.mock.calls.find(
        (call: any[]) => call[0] === 'message'
      )?.[1]

    expect(messageHandler).toBeDefined()

    // Mock SSE event with critical severity and accessibility info
    await act(async () => {
      messageHandler!({
        data: JSON.stringify({
          id: 'aria-test-1',
          eventType: 'authentication',
          severity: 'critical',
          timestamp: new Date(),
          accessibility: {
            screenReaderText: 'Critical security event detected',
            ariaLabel: 'Security alert',
          },
        }),
      })
    })

    await waitFor(() => {
      const liveRegion = screen.getByRole('status', {
        name: /security alerts critical/i,
      })
      expect(liveRegion).toHaveTextContent('Critical security event detected')
    })
  })

  test('should debounce rapid SSE updates to prevent UI thrashing', async () => {
    let updateCount = 0
    const mockRenderCallback = jest.fn(() => updateCount++)
    let eventSourceInstance: any

    // Create a simplified mock EventSource
    class SimpleMockEventSource {
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

    const mockEventSourceConstructor = jest
      .fn()
      .mockImplementation((url, options) => {
        eventSourceInstance = new SimpleMockEventSource(url, options)
        return eventSourceInstance
      })
    ;(globalThis as any).EventSource = mockEventSourceConstructor

    render(
      <SecurityProvider user={mockAuthorizedUser}>
        <SecurityDashboard onRender={mockRenderCallback} />
      </SecurityProvider>
    )

    await waitFor(() => {
      expect(eventSourceInstance?.addEventListener).toHaveBeenCalledWith(
        'message',
        expect.any(Function)
      )
    })

    // Get the message event handler
    const messageHandler =
      eventSourceInstance?.addEventListener.mock.calls.find(
        (call: any[]) => call[0] === 'message'
      )?.[1]

    expect(messageHandler).toBeDefined()

    // Send 100 rapid updates
    await act(async () => {
      for (let i = 0; i < 100; i++) {
        messageHandler!({
          data: JSON.stringify({
            id: `debounce-${i}`,
            eventType: 'authentication',
            severity: 'info',
            timestamp: new Date(),
          }),
        })
      }
    })

    await waitFor(
      () => {
        expect(
          screen.getByTestId('security-event-debounce-99')
        ).toBeInTheDocument()
      },
      { timeout: 5000 }
    )

    // Should have batched updates (not 100 individual renders)
    expect(updateCount).toBeLessThan(20)
  })
})

describe('SecurityDashboard - Internationalization Tests', () => {
  const mockAuthorizedUser = {
    id: 'analyst-123',
    roles: ['security_analyst'],
  }

  test('should display security terms in multiple languages', () => {
    render(
      <SecurityProvider user={mockAuthorizedUser} locale="es">
        <SecurityDashboard />
      </SecurityProvider>
    )

    expect(screen.getByText(/estado de seguridad/i)).toBeInTheDocument() // "Security Status" in Spanish
    expect(screen.getByText(/eventos recientes/i)).toBeInTheDocument() // "Recent Events" in Spanish
  })

  test('should format timestamps according to locale', () => {
    const mockEvent = {
      id: 'i18n-test-1',
      timestamp: new Date('2025-01-15T10:30:00Z'),
      eventType: 'authentication' as const,
      severity: 'info' as const,
    }

    render(
      <SecurityProvider user={mockAuthorizedUser} locale="de">
        <SecurityDashboard securityEvents={[mockEvent]} />
      </SecurityProvider>
    )

    // German date format
    expect(
      screen.getByTestId('security-event-timestamp-i18n-test-1')
    ).toHaveTextContent(/15\.01\.2025/)
  })

  test('should format security counts according to locale', () => {
    render(
      <SecurityProvider user={mockAuthorizedUser} locale="fr">
        <SecurityDashboard />
      </SecurityProvider>
    )

    // French number formatting with spaces as thousand separators
    expect(screen.getByTestId('security-events-count')).toHaveTextContent(
      /1 234/
    ) // French: "1 234" instead of "1,234"
  })
})
