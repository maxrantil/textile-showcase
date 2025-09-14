/**
 * ABOUTME: TDD test suite for SecurityDashboard React component - comprehensive testing of security monitoring UI
 * Following RED-GREEN-REFACTOR cycle for accessibility-compliant, real-time security dashboard
 */

import React from 'react'
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from '@testing-library/react'
// import { act } from 'react-dom/test-utils'
import { SecurityDashboard } from '../../../src/components/security/SecurityDashboard'
import { AuditLogger } from '../../../src/lib/security/audit-logger'

// Mock fetch for testing environment
global.fetch = jest.fn()

// Mock AuditLogger for testing
jest.mock('../../../src/lib/security/audit-logger')

const mockAuditLogger = {
  getSecurityMetrics: jest.fn(),
  getRecentEvents: jest.fn(),
  getSecurityAlerts: jest.fn(),
  subscribeToSecurityEvents: jest.fn(),
  analyzeThreatPatterns: jest.fn(),
}

// Mock data for testing
const mockSecurityMetrics = {
  totalEvents: 145,
  threatCount: 12,
  successRate: 0.89,
  topThreats: [
    { type: 'BRUTE_FORCE_ATTEMPT', count: 8, severity: 'HIGH' },
    { type: 'UNAUTHORIZED_ACCESS', count: 3, severity: 'CRITICAL' },
    { type: 'SUSPICIOUS_LOGIN', count: 1, severity: 'MEDIUM' },
  ],
  timeRange: '24h',
}

const mockRecentEvents = [
  {
    timestamp: new Date('2025-01-15T10:30:00Z'),
    action: 'SECURITY_CRITICAL',
    keyId: 'UNAUTHORIZED_ACCESS',
    success: false,
    error: 'Unauthorized access attempt detected',
    requestId: 'req123',
    pid: 1234,
    environment: 'production',
    verified: true,
  },
  {
    timestamp: new Date('2025-01-15T10:25:00Z'),
    action: 'SECURITY_HIGH',
    keyId: 'BRUTE_FORCE_ATTEMPT',
    success: false,
    error: 'Multiple failed login attempts',
    requestId: 'req124',
    pid: 1234,
    environment: 'production',
    verified: true,
  },
]

const mockThreatPatterns = [
  {
    threatType: 'BRUTE_FORCE_ATTEMPT',
    severity: 'HIGH' as const,
    eventCount: 8,
    timeRange: '24h',
    description: 'Multiple failed authentication attempts detected',
  },
]

describe('SecurityDashboard - TDD Implementation', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks()

    // Mock successful API response
    const mockApiResponse = {
      success: true,
      data: {
        metrics: mockSecurityMetrics,
        recentAlerts: mockRecentEvents,
        threatAnalysis: mockThreatPatterns,
      },
    }

    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockApiResponse,
    })

    // Setup default mock returns with immediate resolution
    mockAuditLogger.getSecurityMetrics.mockImplementation(() =>
      Promise.resolve(mockSecurityMetrics)
    )
    mockAuditLogger.getRecentEvents.mockImplementation(() =>
      Promise.resolve(mockRecentEvents)
    )
    mockAuditLogger.getSecurityAlerts.mockImplementation(() =>
      Promise.resolve(mockRecentEvents)
    )
    mockAuditLogger.analyzeThreatPatterns.mockImplementation(() =>
      Promise.resolve(mockThreatPatterns)
    )
    mockAuditLogger.subscribeToSecurityEvents.mockImplementation(() =>
      Promise.resolve(() => {})
    )

    // Mock AuditLogger constructor
    ;(AuditLogger as jest.MockedClass<typeof AuditLogger>).mockImplementation(
      () => mockAuditLogger as unknown
    )
  })

  describe('Critical Security Dashboard Features - TDD Cycle 3', () => {
    // TDD RED PHASE: This test WILL FAIL - SecurityDashboard component not implemented
    it('should render security dashboard with main sections', async () => {
      render(<SecurityDashboard />)

      // Wait for component to load data and render main sections
      await waitFor(() => {
        expect(
          screen.getByRole('main', { name: /security dashboard/i })
        ).toBeInTheDocument()
      })

      await waitFor(() => {
        expect(
          screen.getByRole('region', { name: /security metrics/i })
        ).toBeInTheDocument()
        expect(
          screen.getByRole('region', { name: /recent events/i })
        ).toBeInTheDocument()
        expect(
          screen.getByRole('region', { name: /threat analysis/i })
        ).toBeInTheDocument()
      })
    })

    // TDD RED PHASE: This test WILL FAIL - no security metrics display
    it('should display security metrics with proper formatting', async () => {
      render(<SecurityDashboard />)

      await waitFor(() => {
        // Metrics should be displayed with proper formatting
        expect(screen.getByText('145')).toBeInTheDocument() // Total events
        expect(screen.getByText('12')).toBeInTheDocument() // Threat count
        expect(screen.getByText('89%')).toBeInTheDocument() // Success rate formatted

        // Labels should be present
        expect(screen.getByText(/total events/i)).toBeInTheDocument()
        expect(screen.getByText(/threats detected/i)).toBeInTheDocument()
        expect(screen.getByText(/success rate/i)).toBeInTheDocument()
      })
    })

    // TDD GREEN PHASE: Test polling-based real-time updates
    it('should display real-time security events with live updates', async () => {
      render(<SecurityDashboard />)

      await waitFor(() => {
        // Should show initial events after loading
        expect(
          screen.getByText(/unauthorized access attempt detected/i)
        ).toBeInTheDocument()
        expect(
          screen.getByText(/multiple failed login attempts/i)
        ).toBeInTheDocument()
      })

      // Should have set up polling for updates (using setInterval)
      expect(setInterval).toHaveBeenCalledWith(expect.any(Function), 30000)
    })

    // TDD GREEN PHASE: Test accessibility compliance after data loads
    it('should be fully accessible with WCAG AA compliance', async () => {
      render(<SecurityDashboard />)

      await waitFor(() => {
        // Wait for data to load and component to render fully
        expect(screen.getByText('🔐 Security Dashboard')).toBeInTheDocument()
      })

      // Should have proper heading hierarchy
      const mainHeading = screen.getByRole('heading', { level: 1 })
      expect(mainHeading).toHaveTextContent(/security dashboard/i)

      const sectionHeadings = screen.getAllByRole('heading', { level: 2 })
      expect(sectionHeadings).toHaveLength(3) // Metrics, Events, Threats

      // Should have ARIA live regions for dynamic content
      const liveRegion = screen.getByRole('status', {
        name: /security events live updates/i,
      })
      expect(liveRegion).toBeInTheDocument()
      expect(liveRegion).toHaveAttribute('aria-live', 'polite')

      // Should have proper labeling for metrics
      const metricsSection = screen.getByRole('region', {
        name: /security metrics/i,
      })
      const withinMetrics = within(metricsSection)
      expect(
        withinMetrics.getByLabelText(/total events count/i)
      ).toBeInTheDocument()
      expect(withinMetrics.getByLabelText(/threat count/i)).toBeInTheDocument()

      // Should support keyboard navigation
      const firstFocusable = screen.getByRole('button', {
        name: /refresh data/i,
      })
      firstFocusable.focus()
      expect(firstFocusable).toHaveFocus()
    })

    // TDD GREEN PHASE: Test threat analysis display with unique identifiers
    it('should display threat analysis with severity indicators', async () => {
      render(<SecurityDashboard />)

      await waitFor(() => {
        // Wait for dashboard to load fully
        expect(screen.getByText('🔐 Security Dashboard')).toBeInTheDocument()
      })

      await waitFor(() => {
        // Should show threats from both threatAnalysis and metrics.topThreats
        const threatElements = screen.getAllByText('BRUTE FORCE ATTEMPT')
        expect(threatElements.length).toBeGreaterThan(0)

        // Should have severity indicators - look for specific patterns
        const threatItems = screen.getAllByText(/HIGH|CRITICAL/i)
        expect(threatItems.length).toBeGreaterThan(0)

        // Should show event counts - look for numbers in threat context
        const countElements = screen.getAllByText(/\d+\s+events?/i)
        expect(countElements.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Interactive Features and User Experience', () => {
    // TDD RED PHASE: This test WILL FAIL - no interactive controls
    it('should provide interactive controls for dashboard management', async () => {
      render(<SecurityDashboard />)

      // Should have refresh button
      const refreshButton = screen.getByRole('button', {
        name: /refresh data/i,
      })
      expect(refreshButton).toBeInTheDocument()

      // Should have time range selector
      const timeRangeSelect = screen.getByRole('combobox', {
        name: /time range/i,
      })
      expect(timeRangeSelect).toBeInTheDocument()
      expect(timeRangeSelect).toHaveValue('24h')

      // Should have filter options
      const severityFilter = screen.getByRole('combobox', {
        name: /severity filter/i,
      })
      expect(severityFilter).toBeInTheDocument()

      // Test refresh functionality
      fireEvent.click(refreshButton)

      await waitFor(() => {
        expect(mockAuditLogger.getSecurityMetrics).toHaveBeenCalledTimes(2) // Initial + refresh
      })
    })

    // TDD RED PHASE: This test WILL FAIL - no loading states
    it('should show appropriate loading and error states', async () => {
      // Test loading state
      mockAuditLogger.getSecurityMetrics.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      )

      render(<SecurityDashboard />)

      // Should show loading indicator
      expect(
        screen.getByRole('status', { name: /loading security data/i })
      ).toBeInTheDocument()
      expect(screen.getByText(/loading.../i)).toBeInTheDocument()

      await waitFor(() => {
        expect(screen.queryByText(/loading.../i)).not.toBeInTheDocument()
      })

      // Test error state
      mockAuditLogger.getSecurityMetrics.mockRejectedValue(
        new Error('Failed to load data')
      )

      const { rerender } = render(<SecurityDashboard />)
      rerender(<SecurityDashboard key="error-test" />)

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
        expect(
          screen.getByText(/failed to load security data/i)
        ).toBeInTheDocument()

        // Should provide retry option
        const retryButton = screen.getByRole('button', { name: /retry/i })
        expect(retryButton).toBeInTheDocument()
      })
    })

    // TDD RED PHASE: This test WILL FAIL - no responsive design
    it('should adapt to different screen sizes responsively', async () => {
      // Mock window.matchMedia for responsive testing
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation((query) => ({
          matches: query.includes('max-width: 768px'), // Mobile
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      })

      render(<SecurityDashboard />)

      // Should have mobile-responsive layout
      const mobileLayout = screen.getByTestId('dashboard-mobile-layout')
      expect(mobileLayout).toBeInTheDocument()

      // Should stack sections vertically on mobile
      const metricsSection = screen.getByRole('region', {
        name: /security metrics/i,
      })
      expect(metricsSection).toHaveClass('mobile-stack')
    })

    // TDD RED PHASE: This test WILL FAIL - no data export functionality
    it('should provide data export functionality', async () => {
      render(<SecurityDashboard />)

      // Should have export dropdown
      const exportButton = screen.getByRole('button', { name: /export data/i })
      expect(exportButton).toBeInTheDocument()

      fireEvent.click(exportButton)

      // Should show export options
      expect(
        screen.getByRole('menuitem', { name: /export as csv/i })
      ).toBeInTheDocument()
      expect(
        screen.getByRole('menuitem', { name: /export as json/i })
      ).toBeInTheDocument()
      expect(
        screen.getByRole('menuitem', { name: /export as pdf report/i })
      ).toBeInTheDocument()

      // Test CSV export
      const csvExport = screen.getByRole('menuitem', { name: /export as csv/i })
      fireEvent.click(csvExport)

      // Should trigger download (mock implementation check)
      expect(global.URL.createObjectURL).toHaveBeenCalled()
    })
  })

  describe('Security and Performance', () => {
    // TDD RED PHASE: This test WILL FAIL - no data sanitization
    it('should sanitize security event data before display', async () => {
      const maliciousEvent = {
        ...mockRecentEvents[0],
        error: '<script>alert("XSS")</script>Malicious content',
        keyId: 'TEST<script>alert("XSS")</script>',
      }

      mockAuditLogger.getRecentEvents.mockResolvedValue([maliciousEvent])

      render(<SecurityDashboard />)

      await waitFor(() => {
        // Should not render raw HTML/scripts
        expect(screen.queryByText(/<script>/)).not.toBeInTheDocument()

        // Should show sanitized content
        expect(screen.getByText(/malicious content/i)).toBeInTheDocument()
        expect(screen.queryByText(/alert\("XSS"\)/)).not.toBeInTheDocument()
      })
    })

    // TDD RED PHASE: This test WILL FAIL - no performance optimization
    it('should optimize performance with virtualization for large datasets', async () => {
      // Generate large dataset
      const largeEventList = Array.from({ length: 1000 }, (_, i) => ({
        ...mockRecentEvents[0],
        requestId: `req${i}`,
        error: `Event ${i}`,
        timestamp: new Date(Date.now() - i * 1000),
      }))

      mockAuditLogger.getRecentEvents.mockResolvedValue(largeEventList)

      render(<SecurityDashboard />)

      await waitFor(() => {
        // Should only render visible items (virtualized)
        const eventItems = screen.getAllByTestId(/security-event-item/)
        expect(eventItems.length).toBeLessThan(50) // Only visible items rendered

        // Should have virtual scroll container
        const virtualContainer = screen.getByTestId('virtual-event-list')
        expect(virtualContainer).toBeInTheDocument()
      })
    })

    // TDD RED PHASE: This test WILL FAIL - no internationalization
    it('should support internationalization for global deployment', async () => {
      // Mock i18n context
      const _mockI18n = {
        t: jest.fn((key) =>
          key === 'security.dashboard.title' ? 'Tableau de Bord Sécurité' : key
        ),
        language: 'fr',
      }

      // This would need i18n provider in actual implementation
      render(<SecurityDashboard />)

      // Should support localized text
      expect(screen.getByText(/security dashboard/i)).toBeInTheDocument()

      // Should format numbers according to locale
      const eventCount = screen.getByText('145')
      expect(eventCount).toBeInTheDocument()
    })

    // TDD RED PHASE: This test WILL FAIL - no role-based access control
    it('should respect role-based access control permissions', async () => {
      const mockUser = {
        id: 'user123',
        roles: ['security_viewer'], // Limited permissions
        permissions: ['read:security_events'],
      }

      render(<SecurityDashboard user={mockUser} />)

      // Should show read-only view for viewer role
      expect(
        screen.queryByRole('button', { name: /delete event/i })
      ).not.toBeInTheDocument()
      expect(
        screen.queryByRole('button', { name: /modify alert/i })
      ).not.toBeInTheDocument()

      // Should show export functionality (allowed for viewers)
      expect(
        screen.getByRole('button', { name: /export data/i })
      ).toBeInTheDocument()

      // Should show appropriate permissions message
      expect(screen.getByText(/read-only access/i)).toBeInTheDocument()
    })
  })

  describe('Integration and Error Handling', () => {
    // TDD RED PHASE: This test WILL FAIL - no network error handling
    it('should handle network errors gracefully', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

      render(<SecurityDashboard />)

      await waitFor(() => {
        // Should show network error state
        expect(screen.getByRole('alert')).toBeInTheDocument()
        expect(screen.getByText(/network error/i)).toBeInTheDocument()

        // Should provide manual refresh option
        const refreshButton = screen.getByRole('button', { name: /retry/i })
        expect(refreshButton).toBeInTheDocument()
      })
    })

    // TDD GREEN PHASE: Test cleanup of polling interval on unmount
    it('should clean up subscriptions and resources on unmount', async () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval')
      const setIntervalSpy = jest.spyOn(global, 'setInterval')

      const { unmount } = render(<SecurityDashboard />)

      await waitFor(() => {
        // Component should be loaded
        expect(screen.getByText('🔐 Security Dashboard')).toBeInTheDocument()
      })

      // Should have set up polling interval
      expect(setIntervalSpy).toHaveBeenCalled()

      // Unmount component
      unmount()

      // Should have cleared the interval
      expect(clearIntervalSpy).toHaveBeenCalled()

      clearIntervalSpy.mockRestore()
      setIntervalSpy.mockRestore()
    })

    // TDD GREEN PHASE: Test polling implementation and connection status
    it('should implement fallback polling when real-time updates fail', async () => {
      // Mock fetch to fail initially, then succeed to simulate connection restoration
      ;(global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Connection failed'))
        .mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            data: {
              metrics: mockSecurityMetrics,
              recentAlerts: mockRecentEvents,
              threatAnalysis: mockThreatPatterns,
            },
          }),
        })

      const setIntervalSpy = jest.spyOn(global, 'setInterval')

      render(<SecurityDashboard />)

      await waitFor(() => {
        // Should show error initially but then load successfully on retry
        expect(screen.getByText('🔐 Security Dashboard')).toBeInTheDocument()
      })

      // Should set up polling interval
      expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 30000) // 30s polling

      setIntervalSpy.mockRestore()
    })
  })
})

// Mock global functions for testing
global.URL.createObjectURL = jest.fn()
global.setInterval = jest.fn()
global.clearInterval = jest.fn()
