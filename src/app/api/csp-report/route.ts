// ABOUTME: CSP violation reporting endpoint for security monitoring
// Accepts legacy report-uri and Reporting API payloads with size limits and rate limiting

import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rateLimit'
import { getClientIp } from '@/lib/clientIp'

/** Real CSP reports are a few hundred bytes; anything larger is noise or abuse */
const MAX_REPORT_BYTES = 8 * 1024
const MAX_FIELD_LENGTH = 512
const MAX_REPORTS_PER_REQUEST = 10
const RATE_LIMIT = { limit: 20, windowMs: 60_000 }

type ReportFields = Record<string, unknown>

interface NormalizedViolation {
  documentUri?: string
  violatedDirective?: string
  effectiveDirective?: string
  blockedUri?: string
  sourceFile?: string
  lineNumber?: number
  columnNumber?: number
  statusCode?: number
}

function str(value: unknown): string | undefined {
  return typeof value === 'string'
    ? value.slice(0, MAX_FIELD_LENGTH)
    : undefined
}

function num(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

// Legacy `report-uri` format: { "csp-report": { "document-uri": ... } }
function fromLegacy(r: ReportFields): NormalizedViolation {
  return {
    documentUri: str(r['document-uri']),
    violatedDirective: str(r['violated-directive']),
    effectiveDirective: str(r['effective-directive']),
    blockedUri: str(r['blocked-uri']),
    sourceFile: str(r['source-file']),
    lineNumber: num(r['line-number']),
    columnNumber: num(r['column-number']),
    statusCode: num(r['status-code']),
  }
}

// Reporting API format: [{ type: "csp-violation", body: { documentURL: ... } }]
function fromReportingApi(r: ReportFields): NormalizedViolation {
  return {
    documentUri: str(r.documentURL),
    effectiveDirective: str(r.effectiveDirective),
    blockedUri: str(r.blockedURL),
    sourceFile: str(r.sourceFile),
    lineNumber: num(r.lineNumber),
    columnNumber: num(r.columnNumber),
    statusCode: num(r.statusCode),
  }
}

function isObject(value: unknown): value is ReportFields {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function normalize(payload: unknown): NormalizedViolation[] {
  if (Array.isArray(payload)) {
    return payload
      .slice(0, MAX_REPORTS_PER_REQUEST)
      .filter(
        (entry): entry is ReportFields =>
          isObject(entry) &&
          entry.type === 'csp-violation' &&
          isObject(entry.body)
      )
      .map((entry) => fromReportingApi(entry.body as ReportFields))
  }

  if (isObject(payload) && isObject(payload['csp-report'])) {
    return [fromLegacy(payload['csp-report'])]
  }

  return []
}

const noContent = () => new NextResponse(null, { status: 204 })

export async function POST(request: NextRequest) {
  if (!checkRateLimit(`csp:${getClientIp(request)}`, RATE_LIMIT)) {
    return new NextResponse(null, { status: 429 })
  }

  const declaredLength = Number(request.headers.get('content-length') || 0)
  if (declaredLength > MAX_REPORT_BYTES) {
    return new NextResponse(null, { status: 413 })
  }

  try {
    const raw = await request.text()
    if (raw.length > MAX_REPORT_BYTES) {
      return new NextResponse(null, { status: 413 })
    }

    for (const violation of normalize(JSON.parse(raw))) {
      // Log CSP violation for monitoring
      console.error('CSP Violation:', {
        timestamp: new Date().toISOString(),
        ...violation,
      })
    }
  } catch {
    // Malformed report: never expose internal errors to the browser
    console.warn('Discarded malformed CSP report')
  }

  return noContent()
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: { Allow: 'POST, OPTIONS' },
  })
}
