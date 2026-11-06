// ABOUTME: Tests for trusted client IP extraction behind the nginx reverse proxy
// Ensures spoofed X-Forwarded-For prefixes cannot change the rate-limit key

import { getClientIp } from '../clientIp'

const req = (headers: Record<string, string>) =>
  ({ headers: new Headers(headers) }) as unknown as Request

describe('getClientIp', () => {
  it('uses the rightmost x-forwarded-for entry (appended by nginx)', () => {
    expect(
      getClientIp(req({ 'x-forwarded-for': '1.1.1.1, 2.2.2.2, 203.0.113.9' }))
    ).toBe('203.0.113.9')
  })

  it('handles a single x-forwarded-for value', () => {
    expect(getClientIp(req({ 'x-forwarded-for': '203.0.113.9' }))).toBe(
      '203.0.113.9'
    )
  })

  it('falls back to x-real-ip', () => {
    expect(getClientIp(req({ 'x-real-ip': '203.0.113.10' }))).toBe(
      '203.0.113.10'
    )
  })

  it('returns "unknown" when no header is present', () => {
    expect(getClientIp(req({}))).toBe('unknown')
  })

  it('ignores empty and oversized values', () => {
    expect(getClientIp(req({ 'x-forwarded-for': ' , ' }))).toBe('unknown')
    expect(getClientIp(req({ 'x-forwarded-for': 'a'.repeat(200) }))).toBe(
      'unknown'
    )
  })
})
