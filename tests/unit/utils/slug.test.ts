// ABOUTME: Tests for the shared project slug rule used by Studio and the projects API
// ABOUTME: Slugs are one URL path segment of letters, digits, "_", "." and "-" (Issue #492)

import { isValidSlug, SLUG_RULE_MESSAGE } from '@/lib/slug'

describe('isValidSlug', () => {
  it.each(['woven-light', 'blå-væv', 'series_2.v3', 'a'.repeat(200)])(
    'accepts %p',
    (slug) => {
      expect(isValidSlug(slug)).toBe(true)
    }
  )

  it.each([
    '',
    'a'.repeat(201),
    'two words',
    'a/b',
    'x</loc>',
    'a?b',
    'a#b',
    'a&b',
  ])('rejects %p', (slug) => {
    expect(isValidSlug(slug)).toBe(false)
  })

  it('explains the rule to editors', () => {
    expect(SLUG_RULE_MESSAGE).toMatch(/letters/i)
  })
})
