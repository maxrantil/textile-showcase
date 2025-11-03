// ABOUTME: CSP violation reporting endpoint for security monitoring
// Handles POST requests from browsers reporting Content Security Policy violations

import { NextRequest, NextResponse } from 'next/server'

interface CSPReport {
  'csp-report': {
    'document-uri'?: string
    'violated-directive'?: string
    'effective-directive'?: string
    'original-policy'?: string
    'blocked-uri'?: string
    'source-file'?: string
    'line-number'?: number
    'column-number'?: number
    'status-code'?: number
  }
}

export async function POST(request: NextRequest) {
  try {
    // Parse CSP report
    const report: CSPReport = await request.json()

    // Log CSP violation for monitoring
    // In production, you might want to send this to a logging service
    console.error('CSP Violation:', {
      timestamp: new Date().toISOString(),
      documentUri: report['csp-report']['document-uri'],
      violatedDirective: report['csp-report']['violated-directive'],
      effectiveDirective: report['csp-report']['effective-directive'],
      blockedUri: report['csp-report']['blocked-uri'],
      sourceFile: report['csp-report']['source-file'],
      lineNumber: report['csp-report']['line-number'],
      columnNumber: report['csp-report']['column-number'],
      statusCode: report['csp-report']['status-code'],
    })

    // Return success response
    return NextResponse.json(
      { received: true },
      {
        status: 204,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (error) {
    console.error('Error processing CSP report:', error)

    // Still return success to browser (don't expose internal errors)
    return NextResponse.json(
      { received: true },
      {
        status: 204,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  }
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      status: 204,
      headers: {
        Allow: 'POST, OPTIONS',
        'Content-Type': 'application/json',
      },
    }
  )
}
