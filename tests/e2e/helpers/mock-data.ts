// ABOUTME: Test data generators and mock data utilities
/**
 * Generate valid contact form data
 */
export function generateContactFormData(overrides?: {
  name?: string
  email?: string
  message?: string
}) {
  return {
    name: overrides?.name || 'John Doe',
    email: overrides?.email || 'john.doe@example.com',
    message:
      overrides?.message ||
      'This is a test message from E2E tests. Thank you for your time!',
  }
}

/**
 * Generate invalid email addresses for testing
 */
export function generateInvalidEmails() {
  return [
    'invalid',
    'invalid@',
    '@invalid.com',
    'invalid@invalid',
    'invalid..email@example.com',
    'invalid@.com',
  ]
}

/**
 * Generate test project data
 */
export function generateProjectData(overrides?: {
  slug?: string
  title?: string
  description?: string
}) {
  return {
    slug: overrides?.slug || 'test-project',
    title: overrides?.title || 'Test Project',
    description:
      overrides?.description || 'This is a test project description.',
  }
}

/**
 * Generate random string for testing
 */
export function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * Generate very long string for testing length limits
 */
export function generateLongString(length: number): string {
  return 'a'.repeat(length)
}

/**
 * Generate short string (below minimum length)
 */
export function generateShortString(): string {
  return 'ab' // Less than 10 chars minimum for message
}
