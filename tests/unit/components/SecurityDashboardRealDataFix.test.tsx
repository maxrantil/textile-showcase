/**
 * ABOUTME: TDD tests for fixing SecurityDashboard real data loading bug
 * These tests will FAIL until the component properly loads real API data instead of demo data
 */

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { SecurityDashboard } from '../../../src/components/security/SecurityDashboard'

// Mock fetch for testing
global.fetch = jest.fn()
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>

describe('SecurityDashboard Real Data Loading Fix - TDD', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'log').mockImplementation()
    jest.spyOn(console, 'error').mockImplementation()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('🔴 RED PHASE - These tests WILL FAIL until bug is fixed', () => {
    // TDD RED PHASE: This test WILL FAIL - component shows demo data (63) instead of real API data
    it('should display REAL API data (78+ events) not demo data (63 events)', async () => {
      // Mock real API response with current live data
      const realApiResponse = {
        success: true,
        data: {
          metrics: {
            totalEvents: 78, // Real data, not demo 63
            threatCount: 2,
            successRate: 0.3,
            topThreats: [
              { type: 'CREDENTIAL_ERROR', count: 5, severity: 'HIGH' },
            ],
            timeRange: '24h',
          },
          recentAlerts: [
            {
              timestamp: '2025-09-14T11:52:00.000Z',
              action: 'SECURITY_LOW',
              keyId: 'DASHBOARD_DATA_ACCESS',
              success: true,
              error: 'Dashboard data retrieved (78 events, 70 alerts)',
              requestId: 'real-request-123',
              verified: true,
            },
          ],
          threatAnalysis: [],
        },
      }

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(realApiResponse),
      } as Response)

      render(<SecurityDashboard />)

      // Should NOT show demo data (63 events)
      await waitFor(
        () => {
          expect(screen.queryByText('63')).not.toBeInTheDocument()
        },
        { timeout: 5000 }
      )

      // Should show REAL API data (78 events)
      await waitFor(
        () => {
          expect(screen.getByText('78')).toBeInTheDocument()
        },
        { timeout: 5000 }
      )

      // Should show real success rate
      expect(screen.getByText('30%')).toBeInTheDocument()

      // Should show real recent events
      expect(
        screen.getByText(/Dashboard data retrieved \(78 events, 70 alerts\)/i)
      ).toBeInTheDocument()
    })

    // TDD RED PHASE: This test WILL FAIL - component doesn't properly call API
    it('should successfully fetch data from API without getting stuck in loading state', async () => {
      const realApiResponse = {
        success: true,
        data: {
          metrics: {
            totalEvents: 78,
            threatCount: 2,
            successRate: 0.3,
            topThreats: [],
            timeRange: '24h',
          },
          recentAlerts: [],
          threatAnalysis: [],
        },
      }

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(realApiResponse),
      } as Response)

      render(<SecurityDashboard />)

      // Should NOT stay in loading state forever
      await waitFor(
        () => {
          expect(screen.queryByText(/loading\.\.\./i)).not.toBeInTheDocument()
        },
        { timeout: 5000 }
      )

      // Should have called the API (may include cache-busting parameters)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringMatching(/^\/api\/security\/dashboard-data(\?.*)?$/),
        expect.any(Object)
      )

      // Should show the dashboard content
      expect(screen.getByText('🔐 Security Dashboard')).toBeInTheDocument()
      expect(screen.getByText('78')).toBeInTheDocument()
    })

    // TDD RED PHASE: This test WILL FAIL - component doesn't handle API responses correctly
    it('should parse API response data structure correctly', async () => {
      const realApiResponse = {
        success: true,
        data: {
          metrics: {
            totalEvents: 80,
            threatCount: 3,
            successRate: 0.25,
            topThreats: [
              { type: 'CREDENTIAL_ERROR', count: 10, severity: 'HIGH' },
              { type: 'FAILED_LOGIN', count: 5, severity: 'MEDIUM' },
            ],
            timeRange: '24h',
          },
          recentAlerts: [
            {
              timestamp: '2025-09-14T11:52:00.000Z',
              action: 'CREDENTIAL_ERROR',
              keyId: 'unknown',
              success: false,
              error: 'Failed to load credentials',
              requestId: 'test-123',
              verified: true,
            },
          ],
          threatAnalysis: [
            {
              threatType: 'CREDENTIAL_ERROR',
              severity: 'HIGH' as const,
              eventCount: 10,
              timeRange: '24h',
              description: 'Multiple credential errors detected',
            },
          ],
        },
      }

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(realApiResponse),
      } as Response)

      render(<SecurityDashboard />)

      // Should parse and display all metrics correctly
      await waitFor(() => {
        expect(screen.getByText('80')).toBeInTheDocument() // totalEvents
        expect(screen.getByText('3')).toBeInTheDocument() // threatCount
        expect(screen.getByText('25%')).toBeInTheDocument() // successRate formatted
      })

      // Should parse and display recent events
      await waitFor(() => {
        expect(
          screen.getByText(/Failed to load credentials/i)
        ).toBeInTheDocument()
      })

      // Should parse and display threat analysis (may have duplicates)
      await waitFor(() => {
        const credentialErrors = screen.getAllByText(/CREDENTIAL ERROR/i)
        expect(credentialErrors.length).toBeGreaterThanOrEqual(1)
      })
    })

    // TDD RED PHASE: This test WILL FAIL - component doesn't update on data changes
    it('should update display when API returns different data', async () => {
      // First API call returns 78 events
      const firstResponse = {
        success: true,
        data: {
          metrics: {
            totalEvents: 78,
            threatCount: 2,
            successRate: 0.3,
            topThreats: [],
            timeRange: '24h',
          },
          recentAlerts: [],
          threatAnalysis: [],
        },
      }

      // Second API call returns 82 events (simulating refresh)
      const secondResponse = {
        success: true,
        data: {
          metrics: {
            totalEvents: 82,
            threatCount: 3,
            successRate: 0.32,
            topThreats: [],
            timeRange: '24h',
          },
          recentAlerts: [],
          threatAnalysis: [],
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(firstResponse),
      } as Response)

      const { rerender } = render(<SecurityDashboard />)

      // Should show first set of data
      await waitFor(() => {
        expect(screen.getByText('78')).toBeInTheDocument()
        expect(screen.getByText('30%')).toBeInTheDocument()
      })

      // Mock second API call
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(secondResponse),
      } as Response)

      // Trigger re-render (simulating refresh button click or auto-refresh)
      rerender(<SecurityDashboard key="refresh" />)

      // Should show updated data
      await waitFor(() => {
        expect(screen.getByText('82')).toBeInTheDocument()
        expect(screen.getByText('32%')).toBeInTheDocument()
      })
    })

    // TDD RED PHASE: This test WILL FAIL - component shows cached/demo data instead of real data
    it('should never show hardcoded demo values when API is working', async () => {
      const realApiResponse = {
        success: true,
        data: {
          metrics: {
            totalEvents: 85,
            threatCount: 4,
            successRate: 0.35,
            topThreats: [],
            timeRange: '24h',
          },
          recentAlerts: [],
          threatAnalysis: [],
        },
      }

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(realApiResponse),
      } as Response)

      render(<SecurityDashboard />)

      await waitFor(() => {
        expect(screen.getByText('85')).toBeInTheDocument()
      })

      // Should NEVER show these common demo values when API is working
      expect(screen.queryByText('63')).not.toBeInTheDocument() // Old demo total events
      expect(screen.queryByText('93')).not.toBeInTheDocument() // Another demo value
      expect(screen.queryByText('145')).not.toBeInTheDocument() // Test mock value
      expect(screen.queryByText('12')).not.toBeInTheDocument() // Demo threat count

      // Should show real API data
      expect(screen.getByText('85')).toBeInTheDocument() // Real total events
      expect(screen.getByText('4')).toBeInTheDocument() // Real threat count
      expect(screen.getByText('35%')).toBeInTheDocument() // Real success rate
    })
  })
})
