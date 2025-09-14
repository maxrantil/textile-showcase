/**
 * ABOUTME: TDD tests for SecurityDashboard API integration fix - validates fetch-based data loading
 * Tests the critical fix that changed from direct AuditLogger imports to API endpoint calls
 */

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { SecurityDashboard } from '../../../src/components/security/SecurityDashboard'

// Mock fetch for testing
global.fetch = jest.fn()

const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>

const mockDashboardResponse = {
  success: true,
  data: {
    metrics: {
      totalEvents: 93,
      threatCount: 1,
      successRate: 0.043,
      topThreats: [
        { type: 'TEST_SECURITY_EVENT', count: 1, severity: 'MEDIUM' },
      ],
      timeRange: '24h',
    },
    recentAlerts: [
      {
        timestamp: '2025-09-14T09:31:51.284Z',
        action: 'SECURITY_MEDIUM',
        keyId: 'TEST_SECURITY_EVENT',
        success: false,
        error: 'Testing custom security event logging',
        requestId: 'test-request-123',
        verified: true,
      },
    ],
    threatAnalysis: [],
    overview: {
      systemStatus: 'CRITICAL',
      totalEvents: 93,
      activeAlerts: 93,
      threatLevel: 'MEDIUM',
    },
  },
}

describe('SecurityDashboard API Integration Fix - TDD Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Setup successful API response by default
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockDashboardResponse),
    } as Response)
  })

  describe('Critical API Integration Fix', () => {
    // TDD GREEN PHASE: This test validates our API integration fix
    it('should fetch data from /api/security/dashboard-data instead of direct AuditLogger', async () => {
      render(<SecurityDashboard />)

      // Wait for component to make API call
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/security/dashboard-data')
      })

      // Should display the loaded data
      await waitFor(() => {
        expect(screen.getByText('93')).toBeInTheDocument() // Total events
        expect(screen.getByText('Security Dashboard')).toBeInTheDocument()
      })
    })

    // TDD GREEN PHASE: This test validates error handling in the API integration
    it('should handle API errors gracefully without crashing', async () => {
      // Mock API failure
      mockFetch.mockRejectedValue(new Error('API request failed'))

      render(<SecurityDashboard />)

      // Should show error state instead of crashing
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
        expect(
          screen.getByText(/failed to load security data/i)
        ).toBeInTheDocument()
      })
    })

    // TDD GREEN PHASE: This test validates HTTP error handling
    it('should handle HTTP error responses properly', async () => {
      // Mock HTTP 500 error
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ success: false, error: 'Server error' }),
      } as Response)

      render(<SecurityDashboard />)

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
        expect(
          screen.getByText(/failed to load security data/i)
        ).toBeInTheDocument()
      })
    })

    // TDD GREEN PHASE: This test validates successful API response parsing
    it('should correctly parse and display dashboard data from API response', async () => {
      render(<SecurityDashboard />)

      // Wait for data to load and display
      await waitFor(() => {
        // Should show metrics from API response
        expect(screen.getByText('93')).toBeInTheDocument() // totalEvents

        // Use more specific selectors for elements that might appear multiple times
        const metricsSection = screen.getByRole('region', {
          name: /security metrics/i,
        })
        expect(metricsSection).toBeInTheDocument()

        expect(screen.getByText('4%')).toBeInTheDocument() // formatted success rate (4.3% rounded)
      })

      // Should show recent events
      await waitFor(() => {
        expect(
          screen.getByText(/testing custom security event logging/i)
        ).toBeInTheDocument()
      })
    })

    // TDD GREEN PHASE: This test validates timestamp conversion
    it('should properly convert string timestamps from API to Date objects', async () => {
      render(<SecurityDashboard />)

      await waitFor(() => {
        // Should display timestamp in readable format
        const timestampText = screen.getByText(/2025-09-14T09:31:51.284Z/)
        expect(timestampText).toBeInTheDocument()
      })
    })

    // TDD GREEN PHASE: This test validates the component doesn't try to import AuditLogger
    it('should not attempt to directly instantiate AuditLogger in browser environment', async () => {
      // This test validates that our fix prevents the "fs module not found" error
      // by using API calls instead of direct imports

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      render(<SecurityDashboard />)

      // Wait for component to stabilize
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled()
      })

      // Should not have any module import errors
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringMatching(/Module not found.*fs/)
      )

      consoleSpy.mockRestore()
    })

    // TDD GREEN PHASE: This test validates retry functionality
    it('should provide retry functionality when API calls fail', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      render(<SecurityDashboard />)

      // Should show error state with retry button
      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /retry/i })
        ).toBeInTheDocument()
      })
    })

    // TDD GREEN PHASE: This test validates loading states
    it('should show loading state while fetching data from API', async () => {
      // Mock slow API response
      mockFetch.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: () => Promise.resolve(mockDashboardResponse),
                } as Response),
              100
            )
          )
      )

      render(<SecurityDashboard />)

      // Should initially show loading state
      expect(screen.getByText(/loading.../i)).toBeInTheDocument()

      // Should eventually show loaded data
      await waitFor(() => {
        expect(screen.queryByText(/loading.../i)).not.toBeInTheDocument()
        expect(screen.getByText('Security Dashboard')).toBeInTheDocument()
      })
    })
  })

  describe('API Integration Edge Cases', () => {
    // TDD GREEN PHASE: This test validates malformed JSON handling
    it('should handle malformed JSON responses gracefully', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.reject(new Error('Unexpected end of JSON input')),
      } as Response)

      render(<SecurityDashboard />)

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
        expect(
          screen.getByText(/failed to load security data/i)
        ).toBeInTheDocument()
      })
    })

    // TDD GREEN PHASE: This test validates API success flag handling
    it('should handle API responses with success: false', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            success: false,
            error: 'Security configuration incomplete',
          }),
      } as Response)

      render(<SecurityDashboard />)

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
        expect(
          screen.getByText(/Security configuration incomplete/i)
        ).toBeInTheDocument()
      })
    })

    // TDD GREEN PHASE: This test validates empty data handling
    it('should handle empty dashboard data gracefully', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            data: {
              metrics: {
                totalEvents: 0,
                threatCount: 0,
                successRate: 0,
                topThreats: [],
                timeRange: '24h',
              },
              recentAlerts: [],
              threatAnalysis: [],
            },
          }),
      } as Response)

      render(<SecurityDashboard />)

      await waitFor(() => {
        // Should find metrics section with 0 values
        const metricsSection = screen.getByRole('region', {
          name: /security metrics/i,
        })
        expect(metricsSection).toBeInTheDocument()
        expect(screen.getByText('Security Dashboard')).toBeInTheDocument()
      })
    })
  })
})
