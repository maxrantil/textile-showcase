/**
 * ABOUTME: Input validation and sanitization utility for API endpoints
 * Provides comprehensive validation and sanitization for user inputs
 */

import { z } from 'zod'
import DOMPurify from 'isomorphic-dompurify'

/**
 * Common validation schemas
 */
export const validators = {
  // Email validation
  email: z.string().email().min(3).max(320),

  // URL validation
  url: z.string().url().max(2048),

  // Username validation (alphanumeric, underscore, dash, 3-30 chars)
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Username can only contain letters, numbers, underscore, and dash'
    ),

  // Strong password validation
  password: z
    .string()
    .min(8)
    .max(128)
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain uppercase, lowercase, number, and special character'
    ),

  // Phone number validation (international format)
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format'),

  // UUID validation
  uuid: z.string().uuid(),

  // Slug validation (URL-safe string)
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(
      /^[a-z0-9-]+$/,
      'Slug can only contain lowercase letters, numbers, and dashes'
    ),

  // Safe text input (no HTML/scripts)
  safeText: z
    .string()
    .min(1)
    .max(10000)
    .transform((val) => sanitizeText(val)),

  // Safe HTML input (sanitized)
  safeHtml: z
    .string()
    .min(1)
    .max(50000)
    .transform((val) => sanitizeHtml(val)),

  // Pagination parameters
  pagination: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sort: z.enum(['asc', 'desc']).optional(),
    sortBy: z.string().optional(),
  }),

  // Date range validation
  dateRange: z
    .object({
      from: z.coerce.date(),
      to: z.coerce.date(),
    })
    .refine((data) => data.to >= data.from, {
      message: 'End date must be after start date',
    }),

  // File upload validation
  fileUpload: z.object({
    filename: z.string().max(255),
    mimetype: z.string().regex(/^[\w-]+\/[\w-]+$/),
    size: z.number().max(10 * 1024 * 1024), // 10MB max
  }),
}

/**
 * Sanitize plain text (remove all HTML)
 */
export function sanitizeText(input: string): string {
  // Remove all HTML tags and entities
  const cleaned = DOMPurify.sanitize(input, { ALLOWED_TAGS: [] })
  // Additional cleanup for common injection attempts
  return cleaned
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim()
}

/**
 * Sanitize HTML (allow safe tags only)
 */
export function sanitizeHtml(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [
      'p',
      'br',
      'strong',
      'em',
      'u',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'ul',
      'ol',
      'li',
      'blockquote',
      'a',
      'code',
      'pre',
      'span',
      'div',
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'id'],
    ALLOWED_URI_REGEXP:
      /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
  })
}

/**
 * Validate and sanitize request body
 */
export async function validateRequestBody<T>(
  body: unknown,
  schema: z.ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; errors: string[] }> {
  try {
    const data = await schema.parseAsync(body)
    return { success: true, data }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map(
        (err) => `${err.path.join('.')}: ${err.message}`
      )
      return { success: false, errors }
    }
    return { success: false, errors: ['Invalid input'] }
  }
}

/**
 * SQL injection prevention helper
 */
export function escapeSql(input: string): string {
  if (typeof input !== 'string') {
    return ''
  }
  // Escape common SQL injection characters
  return input
    .replace(/'/g, "''")
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\x00/g, '\\x00')
    .replace(/\x1a/g, '\\x1a')
}

/**
 * Path traversal prevention
 */
export function sanitizePath(path: string): string {
  // Remove path traversal attempts
  return path
    .replace(/\.\./g, '')
    .replace(/~\//g, '')
    .replace(/^\/+/, '')
    .replace(/\\/g, '/')
    .replace(/\/+/g, '/')
}

/**
 * Check for common malicious patterns
 */
export function detectMaliciousPatterns(input: string): boolean {
  const maliciousPatterns = [
    // SQL injection patterns
    /(\bUNION\b.*\bSELECT\b|\bDROP\b.*\bTABLE\b|\bINSERT\b.*\bINTO\b)/i,
    // XSS patterns
    /<script|javascript:|on\w+\s*=/i,
    // Command injection patterns
    /(\||;|`|\$\(|\$\{|&&|\|\|)/,
    // Path traversal patterns
    /\.\.[\/\\]/,
    // LDAP injection patterns
    /[()&|*]/,
  ]

  return maliciousPatterns.some((pattern) => pattern.test(input))
}

/**
 * Create a validated API handler
 */
export function createValidatedHandler<T>(
  schema: z.ZodSchema<T>,
  handler: (data: T) => Promise<Response>
) {
  return async (request: Request): Promise<Response> => {
    try {
      const body = await request.json()
      const validation = await validateRequestBody(body, schema)

      if (!validation.success) {
        return new Response(
          JSON.stringify({
            error: 'Validation failed',
            details: validation.errors,
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      }

      return handler(validation.data)
    } catch {
      return new Response(
        JSON.stringify({
          error: 'Invalid request',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }
  }
}

/**
 * Validate environment variables
 */
export function validateEnvVar(
  name: string,
  required = true
): string | undefined {
  const value = process.env[name]

  if (required && !value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  // Check for placeholder values
  if (value && (value === 'your-value-here' || value.includes('PLACEHOLDER'))) {
    console.warn(
      `Environment variable ${name} appears to contain a placeholder value`
    )
  }

  return value
}

/**
 * Content type validation
 */
export function validateContentType(
  request: Request,
  expectedType: string
): boolean {
  const contentType = request.headers.get('content-type')
  return (
    contentType?.toLowerCase().includes(expectedType.toLowerCase()) ?? false
  )
}

/**
 * Request size validation
 */
export function validateRequestSize(
  request: Request,
  maxSizeBytes: number
): boolean {
  const contentLength = request.headers.get('content-length')
  if (!contentLength) {
    return true // Allow if no content-length header
  }

  const size = parseInt(contentLength, 10)
  return !isNaN(size) && size <= maxSizeBytes
}
