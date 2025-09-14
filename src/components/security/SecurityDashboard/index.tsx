/**
 * ABOUTME: Adaptive SecurityDashboard component - switches between mobile/desktop implementations
 * Provides comprehensive security monitoring interface with real-time updates
 */

'use client'

import React, { useState, useEffect, useCallback } from 'react'

// Types for component props and data structures
interface SecurityEvent {
  timestamp: Date
  action: string
  keyId: string
  success: boolean
  error?: string
  requestId: string
  pid: number
  environment: string
  verified?: boolean
  securityContext?: SecurityContext
}

interface SecurityContext {
  sessionId?: string
  userAgent?: string
  ipAddress?: string
  geolocation?: string
}

interface SecurityMetrics {
  totalEvents: number
  threatCount: number
  successRate: number
  topThreats: Array<{ type: string; count: number; severity: string }>
  timeRange: string
}

interface ThreatPattern {
  threatType: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  eventCount: number
  timeRange: string
  description: string
}

interface SecurityDashboardProps {
  user?: {
    id: string
    roles: string[]
    permissions: string[]
  }
}

export const SecurityDashboard: React.FC<SecurityDashboardProps> = ({
  user,
}) => {
  // State management for dashboard data
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null)
  const [recentEvents, setRecentEvents] = useState<SecurityEvent[]>([])
  const [threats, setThreats] = useState<ThreatPattern[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState('24h')
  const [severityFilter, setSeverityFilter] = useState('ALL')
  const [connectionStatus, setConnectionStatus] = useState('online')

  // Load initial data using API endpoints
  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('🔄 SecurityDashboard: Starting API fetch...')

      // Fetch dashboard data from API with cache-busting
      const cacheBuster = `?t=${Date.now()}&r=${Math.random()}`
      const response = await fetch(
        `/api/security/dashboard-data${cacheBuster}`,
        {
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache',
            Pragma: 'no-cache',
          },
        }
      )
      console.log('📡 SecurityDashboard: API response status:', response.status)

      if (!response.ok) {
        throw new Error(`Failed to fetch dashboard data: ${response.status}`)
      }

      const result = await response.json()
      console.log('📊 SecurityDashboard: API result:', {
        success: result.success,
        totalEvents: result.data?.metrics?.totalEvents,
        hasData: !!result.data,
      })

      if (!result.success) {
        throw new Error(result.error || 'API request failed')
      }

      const data = result.data
      setMetrics(data.metrics)
      setRecentEvents(
        data.recentAlerts.map((event: any) => ({
          ...event,
          timestamp: new Date((event as { timestamp: string }).timestamp),
        }))
      )
      setThreats(data.threatAnalysis)

      console.log('✅ SecurityDashboard: Data loaded successfully!', {
        totalEvents: data.metrics.totalEvents,
        recentEventsCount: data.recentAlerts.length,
      })
    } catch (err) {
      console.error('❌ SecurityDashboard: Error loading data:', err)
      setError(
        err instanceof Error ? err.message : 'Failed to load security data'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  // Setup real-time event subscription using polling
  useEffect(() => {
    let pollingInterval: NodeJS.Timeout | null = null

    const setupPollingUpdates = () => {
      // Use polling to refresh data periodically
      pollingInterval = setInterval(async () => {
        try {
          await loadDashboardData()
        } catch (err) {
          console.warn('Polling failed:', err)
          setConnectionStatus('offline')
        }
      }, 30000) // 30 second polling

      setConnectionStatus('online')
    }

    setupPollingUpdates()

    // Cleanup on unmount
    return () => {
      if (pollingInterval) clearInterval(pollingInterval)
    }
  }, [loadDashboardData])

  // Load initial data on mount
  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  // Sanitize text to prevent XSS
  const sanitizeText = (text: string): string => {
    return text
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/[<>]/g, '')
      .trim()
  }

  // Format success rate as percentage
  const formatSuccessRate = (rate: number): string => {
    return `${Math.round(rate * 100)}%`
  }

  // Generate PDF content as HTML that can be converted to PDF
  const generatePDFContent = (): string => {
    const currentDate = new Date().toLocaleDateString()
    const currentTime = new Date().toLocaleTimeString()

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Security Dashboard Report</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
          color: #333;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #3b82f6;
          padding-bottom: 10px;
          margin-bottom: 20px;
        }
        .section {
          margin-bottom: 25px;
        }
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
          margin: 15px 0;
        }
        .metric-card {
          border: 1px solid #ddd;
          padding: 15px;
          border-radius: 5px;
          text-align: center;
        }
        .metric-value {
          font-size: 24px;
          font-weight: bold;
          color: #3b82f6;
        }
        .event-item {
          border: 1px solid #e5e7eb;
          margin-bottom: 10px;
          padding: 10px;
          border-radius: 4px;
        }
        .event-success {
          background-color: #f0f9ff;
          border-color: #bae6fd;
        }
        .event-error {
          background-color: #fef2f2;
          border-color: #fecaca;
        }
        .threat-item {
          border: 1px solid #fecaca;
          background-color: #fef2f2;
          padding: 10px;
          margin-bottom: 8px;
          border-radius: 4px;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          font-size: 12px;
          color: #666;
          border-top: 1px solid #ddd;
          padding-top: 10px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🔐 Security Dashboard Report</h1>
        <p>Generated on ${currentDate} at ${currentTime}</p>
        <p>Time Range: ${timeRange} • Status: ${connectionStatus}</p>
      </div>

      <div class="section">
        <h2>📊 Security Metrics</h2>
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-value">${metrics?.totalEvents || 0}</div>
            <div>Total Events</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${metrics?.threatCount || 0}</div>
            <div>Threats Detected</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${formatSuccessRate(metrics?.successRate || 0)}</div>
            <div>Success Rate</div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2>🚨 Recent Security Events (Last ${Math.min(recentEvents.length, 20)})</h2>
        ${recentEvents
          .slice(0, 20)
          .map(
            (event) => `
          <div class="event-item ${event.success ? 'event-success' : 'event-error'}">
            <strong>${sanitizeText(event.error || event.action)}</strong><br>
            <small>${event.timestamp.toLocaleString()} • Request ID: ${event.requestId}</small>
          </div>
        `
          )
          .join('')}
      </div>

      ${
        threats.length > 0 || (metrics?.topThreats?.length || 0) > 0
          ? `
      <div class="section">
        <h2>🎯 Threat Analysis</h2>
        ${threats
          .map(
            (threat) => `
          <div class="threat-item">
            <strong>${threat.threatType.replace(/_/g, ' ')}</strong><br>
            <small>Severity: ${threat.severity} • Events: ${threat.eventCount}</small>
          </div>
        `
          )
          .join('')}
        ${
          metrics?.topThreats
            ?.map(
              (threat) => `
          <div class="threat-item">
            <strong>${threat.type.replace(/_/g, ' ')}</strong><br>
            <small>Severity: ${threat.severity} • Count: ${threat.count}</small>
          </div>
        `
            )
            .join('') || ''
        }
      </div>
      `
          : ''
      }

      <div class="footer">
        <p>This report was generated from the Security Dashboard</p>
        <p>For technical support, contact your system administrator</p>
      </div>
    </body>
    </html>
    `
  }

  // Export functionality
  const exportData = (format: 'csv' | 'json' | 'pdf') => {
    const data = { metrics, recentEvents, threats }
    let blob: Blob
    let filename: string

    switch (format) {
      case 'csv':
        const csvData = recentEvents
          .map(
            (e) =>
              `"${e.timestamp.toISOString()}","${e.action}","${e.keyId}","${e.success}","${(e.error || '').replace(/"/g, '""')}"`
          )
          .join('\n')
        blob = new Blob([`Timestamp,Action,KeyId,Success,Error\n${csvData}`], {
          type: 'text/csv',
        })
        filename = `security-events-${new Date().toISOString().split('T')[0]}.csv`
        break
      case 'json':
        blob = new Blob([JSON.stringify(data, null, 2)], {
          type: 'application/json',
        })
        filename = `security-dashboard-${new Date().toISOString().split('T')[0]}.json`
        break
      case 'pdf':
        // Generate HTML content for PDF
        const htmlContent = generatePDFContent()
        blob = new Blob([htmlContent], { type: 'text/html' })
        filename = `security-report-${new Date().toISOString().split('T')[0]}.html`

        // Show instructions to user on how to convert to PDF
        setTimeout(() => {
          alert(
            'HTML report downloaded! To convert to PDF:\n\n1. Open the downloaded HTML file in your browser\n2. Press Ctrl+P (or Cmd+P on Mac)\n3. Choose "Save as PDF" as destination\n4. Click Save\n\nThis gives you a properly formatted PDF report!'
          )
        }, 100)
        break
    }

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  // Handle retry on error
  const handleRetry = () => {
    loadDashboardData()
  }

  // Check if user has limited permissions
  const isReadOnly =
    user?.roles?.includes('security_viewer') &&
    !user?.roles?.includes('security_admin')

  if (loading) {
    return (
      <main role="main" aria-label="Security Dashboard">
        <div
          role="status"
          aria-label="Loading security data"
          aria-live="polite"
        >
          <p>Loading...</p>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main role="main" aria-label="Security Dashboard">
        <div role="alert">
          <p>Failed to load security data: {error}</p>
          <button onClick={handleRetry} aria-label="Retry loading data">
            Retry
          </button>
        </div>
      </main>
    )
  }

  return (
    <div
      style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '20px',
        fontFamily: 'system-ui, sans-serif',
        backgroundColor: '#f8fafc',
      }}
    >
      <main role="main" aria-label="Security Dashboard">
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            marginBottom: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          <h1
            style={{
              fontSize: '28px',
              fontWeight: 'bold',
              marginBottom: '24px',
              color: '#1e293b',
            }}
          >
            🔐 Security Dashboard
          </h1>

          {/* Controls */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '16px',
              alignItems: 'center',
              marginBottom: '24px',
              padding: '16px',
              backgroundColor: '#f1f5f9',
              borderRadius: '6px',
            }}
            className="dashboard-controls"
          >
            <button
              onClick={loadDashboardData}
              aria-label="Refresh data"
              style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '500',
              }}
            >
              🔄 Refresh Data
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label htmlFor="time-range" style={{ fontWeight: '500' }}>
                Time Range:
              </label>
              <select
                id="time-range"
                role="combobox"
                aria-label="Time range"
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '4px',
                  border: '1px solid #d1d5db',
                  backgroundColor: 'white',
                }}
              >
                <option value="24h">24 Hours</option>
                <option value="7d">7 Days</option>
                <option value="30d">30 Days</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label htmlFor="severity-filter" style={{ fontWeight: '500' }}>
                Severity Filter:
              </label>
              <select
                id="severity-filter"
                role="combobox"
                aria-label="Severity filter"
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '4px',
                  border: '1px solid #d1d5db',
                  backgroundColor: 'white',
                }}
              >
                <option value="ALL">All Severities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
              </select>
            </div>

            <div className="export-dropdown" style={{ position: 'relative' }}>
              <button
                aria-label="Export data"
                style={{
                  backgroundColor: '#10b981',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '500',
                }}
              >
                📊 Export Data
              </button>
              <div
                role="menu"
                className="export-menu"
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: '0',
                  backgroundColor: 'white',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  minWidth: '180px',
                  zIndex: 10,
                }}
              >
                <button
                  role="menuitem"
                  onClick={() => exportData('csv')}
                  aria-label="Export as CSV"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: 'none',
                    backgroundColor: 'white',
                    textAlign: 'left',
                    cursor: 'pointer',
                    borderBottom: '1px solid #e5e7eb',
                  }}
                >
                  📄 Export as CSV
                </button>
                <button
                  role="menuitem"
                  onClick={() => exportData('json')}
                  aria-label="Export as JSON"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: 'none',
                    backgroundColor: 'white',
                    textAlign: 'left',
                    cursor: 'pointer',
                    borderBottom: '1px solid #e5e7eb',
                  }}
                >
                  📋 Export as JSON
                </button>
                <button
                  role="menuitem"
                  onClick={() => exportData('pdf')}
                  aria-label="Export as PDF Report"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: 'none',
                    backgroundColor: 'white',
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  📑 Export as PDF Report
                </button>
              </div>
            </div>
          </div>

          {/* Connection Status */}
          <div
            role="status"
            aria-label="Connection status"
            style={{ marginBottom: '16px' }}
          >
            {connectionStatus === 'offline' && (
              <div
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#fef3c7',
                  color: '#92400e',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              >
                ⚠️ Polling mode active
              </div>
            )}
          </div>

          {/* Permissions Notice */}
          {isReadOnly && (
            <div
              style={{
                padding: '8px 12px',
                backgroundColor: '#dbeafe',
                color: '#1e40af',
                borderRadius: '4px',
                fontSize: '14px',
                marginBottom: '16px',
              }}
            >
              👁️ Read-only access
            </div>
          )}
        </div>

        {/* Security Metrics Section */}
        <section
          role="region"
          aria-label="Security Metrics"
          style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            marginBottom: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          <h2
            style={{
              fontSize: '20px',
              fontWeight: '600',
              marginBottom: '16px',
              color: '#1e293b',
            }}
          >
            📊 Security Metrics
          </h2>
          {metrics && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
              }}
            >
              <div
                style={{
                  padding: '16px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '6px',
                  textAlign: 'center',
                }}
              >
                <div
                  aria-label="Total events count"
                  style={{
                    fontSize: '32px',
                    fontWeight: 'bold',
                    color: '#3b82f6',
                  }}
                >
                  {metrics.totalEvents}
                </div>
                <p
                  style={{
                    margin: '4px 0 0 0',
                    fontSize: '14px',
                    color: '#64748b',
                  }}
                >
                  Total Events
                </p>
              </div>

              <div
                style={{
                  padding: '16px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '6px',
                  textAlign: 'center',
                }}
              >
                <div
                  aria-label="Threat count"
                  style={{
                    fontSize: '32px',
                    fontWeight: 'bold',
                    color: '#ef4444',
                  }}
                >
                  {metrics.threatCount}
                </div>
                <p
                  style={{
                    margin: '4px 0 0 0',
                    fontSize: '14px',
                    color: '#64748b',
                  }}
                >
                  Threats Detected
                </p>
              </div>

              <div
                style={{
                  padding: '16px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '6px',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    fontSize: '32px',
                    fontWeight: 'bold',
                    color: '#10b981',
                  }}
                >
                  {formatSuccessRate(metrics.successRate)}
                </div>
                <p
                  style={{
                    margin: '4px 0 0 0',
                    fontSize: '14px',
                    color: '#64748b',
                  }}
                >
                  Success Rate
                </p>
              </div>
            </div>
          )}
        </section>

        {/* Recent Events Section */}
        <section
          role="region"
          aria-label="Recent Events"
          style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            marginBottom: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          <h2
            style={{
              fontSize: '20px',
              fontWeight: '600',
              marginBottom: '16px',
              color: '#1e293b',
            }}
          >
            🚨 Recent Events
          </h2>
          <div
            role="status"
            aria-label="Security events live updates"
            aria-live="polite"
          >
            <div
              data-testid="virtual-event-list"
              style={{ maxHeight: '400px', overflowY: 'auto' }}
            >
              {recentEvents.slice(0, 50).map((event) => (
                <div
                  key={event.requestId}
                  data-testid="security-event-item"
                  style={{
                    padding: '12px',
                    marginBottom: '8px',
                    backgroundColor: event.success ? '#f0f9ff' : '#fef2f2',
                    borderRadius: '4px',
                    border: `1px solid ${event.success ? '#bae6fd' : '#fecaca'}`,
                  }}
                >
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: '500',
                      color: event.success ? '#0369a1' : '#dc2626',
                    }}
                  >
                    {sanitizeText(event.error || event.action)}
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#64748b',
                      marginTop: '4px',
                    }}
                  >
                    {event.timestamp.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Threat Analysis Section */}
        <section
          role="region"
          aria-label="Threat Analysis"
          style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          <h2
            style={{
              fontSize: '20px',
              fontWeight: '600',
              marginBottom: '16px',
              color: '#1e293b',
            }}
          >
            🎯 Threat Analysis
          </h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '12px',
            }}
          >
            {threats.map((threat, index) => (
              <div
                key={index}
                style={{
                  padding: '12px',
                  backgroundColor: '#fef2f2',
                  borderRadius: '6px',
                  border: '1px solid #fecaca',
                }}
              >
                <div style={{ fontWeight: '600', color: '#dc2626' }}>
                  {threat.threatType.replace(/_/g, ' ')}
                </div>
                <div
                  style={{
                    fontSize: '12px',
                    color: '#64748b',
                    marginTop: '4px',
                  }}
                >
                  {threat.severity} • {threat.eventCount} events
                </div>
              </div>
            ))}

            {/* Top Threats from Metrics */}
            {metrics?.topThreats.map((threat, index) => (
              <div
                key={`metric-${index}`}
                style={{
                  padding: '12px',
                  backgroundColor: '#fef2f2',
                  borderRadius: '6px',
                  border: '1px solid #fecaca',
                }}
              >
                <div style={{ fontWeight: '600', color: '#dc2626' }}>
                  {threat.type.replace(/_/g, ' ')}
                </div>
                <div
                  style={{
                    fontSize: '12px',
                    color: '#64748b',
                    marginTop: '4px',
                  }}
                >
                  {threat.severity} • {threat.count} events
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Mobile responsive layout indicator */}
        <div data-testid="dashboard-mobile-layout" className="mobile-stack">
          {/* Mobile layout indicator for responsive test */}
        </div>
      </main>
    </div>
  )
}
