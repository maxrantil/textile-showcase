// ABOUTME: Simplified contact form API endpoint for textile portfolio
// Handles email submissions with validation, body limits, and per-IP + global rate limiting

import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { z } from 'zod'
import {
  checkRateLimit,
  GLOBAL_CONTACT_LIMIT,
  GLOBAL_CONTACT_WINDOW_MS,
} from '@/lib/rateLimit'
import { getClientIp } from '@/lib/clientIp'

/** Largest accepted request body; a max-length submission is well under this */
const MAX_BODY_BYTES = 16 * 1024

const GLOBAL_RATE_LIMIT_KEY = '__contact_global__'

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

  const contentType = request.headers.get('content-type') || ''
  if (!contentType.toLowerCase().includes('application/json')) {
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

    // Validate with Zod schema
    const validation = contactFormSchema.safeParse(body)
    if (!validation.success) {
      const firstError = validation.error.issues[0]
      return jsonError(firstError.message, 400)
    }

    const { name, email, message } = validation.data

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
    const { error } = await resend.emails.send({
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
    })

    if (error) {
      console.error('Resend error:', error)
      return jsonError('Failed to send message. Please try again.', 500)
    }

    return NextResponse.json({
      success: true,
      message: 'Your message has been sent successfully!',
    })
  } catch (error) {
    console.error('Contact form error:', error)
    return jsonError('An unexpected error occurred. Please try again.', 500)
  }
}
