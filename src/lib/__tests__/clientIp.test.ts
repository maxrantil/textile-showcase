// ABOUTME: Tests for trusted client IP extraction behind the nginx reverse proxy
// Ensures spoofed X-Forwarded-For prefixes cannot change the rate-limit key

import { clientRateLimitKey, getClientIp } from '../clientIp'

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

// One IPv6 host usually controls a whole /64, so it counts as one client (Issue #488)
describe('clientRateLimitKey', () => {
  it.each([
    ['203.0.113.9', '203.0.113.9'],
    ['2001:db8:1:2:aaaa:bbbb:cccc:dddd', '2001:db8:1:2::/64'],
    ['2001:db8:1:2::1', '2001:db8:1:2::/64'],
    ['2001:DB8:0001:0002:0:0:0:1', '2001:db8:1:2::/64'],
    ['2001:db8::1', '2001:db8:0:0::/64'],
    ['::1', '0:0:0:0::/64'],
    ['::ffff:198.51.100.7', '198.51.100.7'],
    ['fe80::1%eth0', 'fe80:0:0:0::/64'],
    ['unknown', 'unknown'],
  ])('maps %p to %p', (ip, key) => {
    expect(clientRateLimitKey(ip)).toBe(key)
  })

  it('gives two addresses in the same /64 the same key', () => {
    expect(clientRateLimitKey('2001:db8:5:6::a')).toBe(
      clientRateLimitKey('2001:db8:5:6:ffff:ffff:ffff:ffff')
    )
  })

  it('keeps a malformed IPv6 value as its own key', () => {
    expect(clientRateLimitKey('1:2:3:4:5:6:7:8:9')).toBe('1:2:3:4:5:6:7:8:9')
    expect(clientRateLimitKey('xyz::1')).toBe('xyz::1')
  })
})
