// ABOUTME: Simplified contact form API endpoint for textile portfolio
// Handles email submissions with basic validation and rate limiting

import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { z } from 'zod'

// Simple HTML sanitization function
function sanitizeHtml(str: string): string {
  return str
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

// Rate limiting - simple in-memory store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const limit = rateLimitStore.get(ip)

  if (!limit || now > limit.resetTime) {
    // Reset or initialize
    rateLimitStore.set(ip, {
      count: 1,
      resetTime: now + 60000, // 1 minute window
    })
    return true
  }

  if (limit.count >= 5) {
    return false // Rate limit exceeded
  }

  limit.count++
  return true
}

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [ip, limit] of rateLimitStore.entries()) {
    if (now > limit.resetTime) {
      rateLimitStore.delete(ip)
    }
  }
}, 60000) // Clean up every minute

// Validation schema for contact form
const contactFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name is too long')
    .transform((str) => sanitizeHtml(str.trim())),
  email: z
    .string()
    .email('Invalid email address')
    .max(254, 'Email is too long')
    .transform((str) => sanitizeHtml(str.trim())),
  message: z
    .string()
    .min(10, 'Message must be at least 10 characters')
    .max(5000, 'Message is too long')
    .transform((str) => sanitizeHtml(str.trim())),
})

export async function POST(request: NextRequest) {
  // Get client IP for rate limiting
  const ip =
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    'unknown'

  // Check rate limit
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    )
  }

  try {
    const body = await request.json()

    // Validate with Zod schema
    const validation = contactFormSchema.safeParse(body)
    if (!validation.success) {
      const firstError = validation.error.issues[0]
      return NextResponse.json({ error: firstError.message }, { status: 400 })
    }

    const { name, email, message } = validation.data

    // Initialize Resend
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey || apiKey === 'dummy_key_for_build') {
      console.error('RESEND_API_KEY not configured')
      return NextResponse.json(
        {
          error:
            'Contact form is temporarily unavailable. Please try again later.',
        },
        { status: 503 }
      )
    }

    const resend = new Resend(apiKey)

    // Send email
    const { error } = await resend.emails.send({
      from: 'contact@idaromme.dk',
      to: [process.env.CONTACT_EMAIL || 'idaromme@gmail.com'],
      subject: `New Contact Form Message from ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">New Contact Form Message</h2>
          <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
          </div>
          <div style="background: #fff; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
            <h3 style="color: #333;">Message:</h3>
            <p style="line-height: 1.6; color: #666; white-space: pre-wrap;">${message}</p>
          </div>
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #999;">
            <p>Sent from idaromme.dk contact form on ${new Date().toLocaleString()}</p>
          </div>
        </div>
      `,
    })

    if (error) {
      console.error('Resend error:', error)
      return NextResponse.json(
        { error: 'Failed to send message. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Your message has been sent successfully!',
    })
  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
