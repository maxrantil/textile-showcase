// ABOUTME: IndexNow API endpoint for instant search engine indexing
// ABOUTME: Submits URLs to Bing, Yandex, and other IndexNow-supporting search engines

import { NextRequest, NextResponse } from 'next/server'

const INDEXNOW_KEY = process.env.INDEXNOW_KEY || 'indexnow-idaromme'
const ALLOWED_HOST = 'idaromme.dk'
const BASE_URL = `https://${ALLOWED_HOST}`

// IndexNow supports multiple search engines
const INDEXNOW_ENDPOINTS = [
  'https://api.indexnow.org/indexnow', // Bing, Yandex, and others
  'https://www.bing.com/indexnow', // Bing direct
]

interface IndexNowRequest {
  url?: string
  urls?: string[]
}

interface IndexNowResult {
  endpoint: string
  success: boolean
  status?: number
  error?: string
}

function validateUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.host === ALLOWED_HOST || parsed.host === `www.${ALLOWED_HOST}`
  } catch {
    return false
  }
}

async function submitToIndexNow(urls: string[]): Promise<IndexNowResult[]> {
  const results: IndexNowResult[] = []

  for (const endpoint of INDEXNOW_ENDPOINTS) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          host: ALLOWED_HOST,
          key: INDEXNOW_KEY,
          keyLocation: `${BASE_URL}/${INDEXNOW_KEY}.txt`,
          urlList: urls,
        }),
      })

      results.push({
        endpoint,
        success: response.ok,
        status: response.status,
      })
    } catch (error) {
      results.push({
        endpoint,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  return results
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: IndexNowRequest = await request.json()

    // Collect URLs from either single url or urls array
    let urls: string[] = []

    if (body.url) {
      urls.push(body.url)
    }

    if (body.urls && Array.isArray(body.urls)) {
      urls = urls.concat(body.urls)
    }

    // Validate that we have URLs
    if (urls.length === 0) {
      return NextResponse.json(
        { error: 'No URLs provided. Use "url" or "urls" in request body.' },
        { status: 400 }
      )
    }

    // Validate all URLs belong to our domain
    const invalidUrls = urls.filter((url) => !validateUrl(url))
    if (invalidUrls.length > 0) {
      return NextResponse.json(
        {
          error: `Invalid domain: URLs must be from ${ALLOWED_HOST}`,
          invalidUrls,
        },
        { status: 400 }
      )
    }

    // Remove duplicates
    urls = [...new Set(urls)]

    // Submit to IndexNow endpoints
    const results = await submitToIndexNow(urls)

    // Check if at least one submission succeeded
    const anySuccess = results.some((r) => r.success)

    return NextResponse.json({
      success: anySuccess,
      submitted: urls,
      results,
      message: anySuccess
        ? 'URLs submitted to IndexNow successfully'
        : 'Failed to submit to IndexNow endpoints, but request was processed',
    })
  } catch (error) {
    console.error('IndexNow API error:', error)
    return NextResponse.json(
      { error: 'Internal server error processing IndexNow request' },
      { status: 500 }
    )
  }
}

// GET endpoint for health check and info
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    service: 'IndexNow',
    key: INDEXNOW_KEY,
    keyLocation: `${BASE_URL}/${INDEXNOW_KEY}.txt`,
    endpoints: INDEXNOW_ENDPOINTS,
    usage: 'POST with { url: "..." } or { urls: [...] }',
  })
}
