// ABOUTME: Shared utilities and mocks for API route testing

import { NextRequest } from 'next/server'

/**
 * Creates a mock NextRequest object for testing
 * Compatible with Next.js 15 API route handlers
 */
export function createMockRequest(options: {
  method?: string
  body?: unknown
  headers?: Record<string, string>
  url?: string
}): NextRequest {
  const {
    method = 'POST',
    body = {},
    headers = {},
    url = 'http://localhost:3000/api/test',
  } = options

  // Create a proper Request with a readable body
  const request = new Request(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body:
      method !== 'GET' && method !== 'HEAD' ? JSON.stringify(body) : undefined,
  })

  // Cast to NextRequest for Next.js compatibility
  return request as unknown as NextRequest
}

/**
 * Mock Resend email service
 */
export const mockResend = {
  emails: {
    send: jest.fn(),
  },
}

/**
 * Mock Sanity client
 */
export const mockSanityClient = {
  fetch: jest.fn(),
}

/**
 * Creates a mock error for testing error handling
 */
export function createMockError(message: string): Error {
  return new Error(message)
}

/**
 * Extracts JSON from NextResponse for testing
 */
export async function extractResponseJson(
  response: Response
): Promise<unknown> {
  return response.json()
}
