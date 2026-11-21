// ABOUTME: Shared rule for project slugs, used by the Studio schema and the projects API
// ABOUTME: A slug is one URL path segment: letters, digits, "_", "." and "-", at most 200 characters

const SLUG_PATTERN = /^[\p{L}\p{N}_.-]{1,200}$/u

export const SLUG_RULE_MESSAGE =
  'Use only letters, digits, "-", "_" and "." (no spaces or slashes), at most 200 characters'

export function isValidSlug(slug: string): boolean {
  return SLUG_PATTERN.test(slug)
}
