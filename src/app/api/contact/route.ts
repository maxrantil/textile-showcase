// ABOUTME: Simplified contact form API endpoint for textile portfolio
// Handles email submissions with validation, body limits, and per-IP + global rate limiting

import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { z } from 'zod'
import {
  checkRateLimit,
  GLOBAL_CONTACT_LIMIT,
  GLOBAL_CONTACT_WINDOW_MS,
  RESEND_TIMEOUT_MS,
} from '@/lib/rateLimit'
import { getClientIp } from '@/lib/clientIp'
import { HONEYPOT_FIELD } from '@/lib/honeypot'

/** Largest accepted request body; a max-length submission is well under this */
const MAX_BODY_BYTES = 16 * 1024

const GLOBAL_RATE_LIMIT_KEY = '__contact_global__'

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      timer = setTimeout(
        () => reject(new Error(`Resend did not answer within ${ms} ms`)),
        ms
      )
    }),
  ]).finally(() => clearTimeout(timer))
}

function filledHoneypot(body: unknown): boolean {
  if (typeof body !== 'object' || body === null) return false
  const value = (body as Record<string, unknown>)[HONEYPOT_FIELD]
  return typeof value === 'string' && value.trim() !== ''
}

const SUCCESS_BODY = {
  success: true,
  message: 'Your message has been sent successfully!',
}

// HTML-escape user input before interpolating into the email body
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

// Remove control characters (incl. CR/LF) so values are safe in single-line fields
function stripControlChars(str: string): string {
  return str.replace(/[\u0000-\u001F\u007F]+/g, ' ').trim()
}

// Validation schema for contact form (values stay raw; escaping happens at render)
const contactFormSchema = z.object({
  name: z
    .string()
    .transform((str) => str.trim())
    .pipe(z.string().min(1, 'Name is required').max(100, 'Name is too long')),
  email: z
    .string()
    .transform((str) => str.trim())
    .pipe(
      z.string().email('Invalid email address').max(254, 'Email is too long')
    ),
  message: z
    .string()
    .transform((str) => str.trim())
    .pipe(
      z
        .string()
        .min(10, 'Message must be at least 10 characters')
        .max(5000, 'Message is too long')
    ),
})

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status })
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)

  // Per-IP rate limit
  if (!checkRateLimit(ip)) {
    return jsonError('Too many requests. Please try again later.', 429)
  }

  // Compare the media type exactly: a substring match accepted
  // "text/plain; application/json", which browsers send cross-site without a
  // CORS preflight (Issue #490)
  const mediaType = (request.headers.get('content-type') ?? '')
    .split(';', 1)[0]
    .trim()
    .toLowerCase()
  if (mediaType !== 'application/json') {
    return jsonError('Unsupported content type', 415)
  }

  const declaredLength = Number(request.headers.get('content-length') || 0)
  if (declaredLength > MAX_BODY_BYTES) {
    return jsonError('Request body too large', 413)
  }

  try {
    const raw = await request.text()
    if (raw.length > MAX_BODY_BYTES) {
      return jsonError('Request body too large', 413)
    }

    let body: unknown
    try {
      body = JSON.parse(raw)
    } catch {
      return jsonError('Invalid JSON', 400)
    }

    // Answer like a real send so the bot learns nothing, and send no email
    if (filledHoneypot(body)) {
      console.warn('Contact form honeypot filled; message dropped')
      return NextResponse.json(SUCCESS_BODY)
    }

    // Validate with Zod schema
    const validation = contactFormSchema.safeParse(body)
    if (!validation.success) {
      const firstError = validation.error.issues[0]
      return jsonError(firstError.message, 400)
    }

    const { name, email, message } = validation.data
    // Values are raw (escaped at render), so `email` is the address as typed;
    // Reply-To uses it directly. An apostrophe is valid in an address.

    // Initialize Resend
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey || apiKey === 'dummy_key_for_build') {
      console.error('RESEND_API_KEY not configured')
      return jsonError(
        'Contact form is temporarily unavailable. Please try again later.',
        503
      )
    }

    // Global cap protects the mail quota against distributed spam
    if (
      !checkRateLimit(GLOBAL_RATE_LIMIT_KEY, {
        limit: GLOBAL_CONTACT_LIMIT,
        windowMs: GLOBAL_CONTACT_WINDOW_MS,
        pinned: true,
      })
    ) {
      console.warn('Contact form global rate limit reached')
      return jsonError('Too many requests. Please try again later.', 429)
    }

    const safeName = escapeHtml(name)
    const safeEmail = escapeHtml(email)
    const safeMessage = escapeHtml(message)

    const resend = new Resend(apiKey)

    // Send email
    const { error } = await withTimeout(
      resend.emails.send({
        from: 'contact@idaromme.dk',
        to: [process.env.CONTACT_EMAIL || 'idaromme@gmail.com'],
        replyTo: email,
        subject: `New Contact Form Message from ${stripControlChars(name)}`,
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">New Contact Form Message</h2>
          <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Name:</strong> ${safeName}</p>
            <p><strong>Email:</strong> ${safeEmail}</p>
          </div>
          <div style="background: #fff; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
            <h3 style="color: #333;">Message:</h3>
            <p style="line-height: 1.6; color: #666; white-space: pre-wrap;">${safeMessage}</p>
          </div>
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #999;">
            <p>Sent from idaromme.dk contact form on ${new Date().toLocaleString()}</p>
          </div>
        </div>
      `,
      }),
      RESEND_TIMEOUT_MS
    )

    if (error) {
      console.error('Resend error:', error)
      return jsonError('Failed to send message. Please try again.', 500)
    }

    return NextResponse.json(SUCCESS_BODY)
  } catch (error) {
    console.error('Contact form error:', error)
    return jsonError('An unexpected error occurred. Please try again.', 500)
  }
}
