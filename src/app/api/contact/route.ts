import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import DOMPurify from 'isomorphic-dompurify'

// Simple Resend initialization without GPG complexity
function getResendInstance(): Resend {
  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey || apiKey === 'dummy_key_for_build') {
    throw new Error('RESEND_API_KEY is not configured properly')
  }

  return new Resend(apiKey)
}

export async function POST(request: NextRequest) {
  // Initialize Resend instance
  let resend: Resend
  try {
    resend = getResendInstance()
  } catch {
    return NextResponse.json(
      {
        error:
          'Contact form is temporarily unavailable due to configuration issues. Please try again later.',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    )
  }

  try {
    const body = await request.json()
    const { name, email, message } = body

    // Validate request size (prevent large payloads)
    const requestSize = JSON.stringify(body).length
    if (requestSize > 10000) {
      // 10KB limit
      return NextResponse.json({ error: 'Request too large' }, { status: 413 })
    }

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Validate field lengths
    if (name.length > 100 || email.length > 254 || message.length > 5000) {
      return NextResponse.json(
        { error: 'One or more fields exceed maximum length' },
        { status: 400 }
      )
    }

    // Enhanced email validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Sanitize inputs to prevent HTML injection
    const sanitizedName = DOMPurify.sanitize(name, { ALLOWED_TAGS: [] })
    const sanitizedEmail = DOMPurify.sanitize(email, { ALLOWED_TAGS: [] })
    const sanitizedMessage = DOMPurify.sanitize(message, { ALLOWED_TAGS: [] })

    // Check for email header injection patterns
    const headerInjectionPattern = /[\r\n]|(Content-Type|Bcc|Cc|From|Subject):/i
    if (
      headerInjectionPattern.test(sanitizedName) ||
      headerInjectionPattern.test(sanitizedEmail) ||
      headerInjectionPattern.test(sanitizedMessage)
    ) {
      return NextResponse.json(
        { error: 'Invalid characters detected' },
        { status: 400 }
      )
    }

    // Send email using Resend with sanitized inputs
    const data = await resend.emails.send({
      from: 'contact@idaromme.dk',
      to: [process.env.CONTACT_EMAIL || 'idaromme@gmail.com'],
      subject: `New Contact Form Message from ${sanitizedName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; font-weight: 300;">New Contact Form Message</h2>
          <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Name:</strong> ${DOMPurify.sanitize(sanitizedName)}</p>
            <p><strong>Email:</strong> ${DOMPurify.sanitize(sanitizedEmail)}</p>
          </div>
          <div style="background: #fff; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
            <h3 style="color: #333; font-weight: 300;">Message:</h3>
            <p style="line-height: 1.6; color: #666; white-space: pre-wrap;">${DOMPurify.sanitize(sanitizedMessage)}</p>
          </div>
          <div style="background: #f0f0f0; padding: 15px; border-radius: 8px; margin-top: 20px; font-size: 12px; color: #666;">
            <p><strong>Security Information:</strong></p>
            <p>Sent: ${new Date().toISOString()}</p>
            <p>User Agent: ${request.headers.get('user-agent')?.slice(0, 100) || 'Unknown'}</p>
            <p>This message was sent from your idaromme.dk contact form and has been sanitized for security.</p>
          </div>
        </div>
      `,
    })

    // Return success with the actual response data
    return NextResponse.json({
      success: true,
      data: data.data,
      error: data.error,
    })
  } catch (error) {
    // Log error for monitoring (but don't expose sensitive details)
    console.error('Contact form error:', {
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get('user-agent'),
      error: error instanceof Error ? error.message : 'Unknown error',
    })

    // Return generic error response to prevent information disclosure
    return NextResponse.json(
      {
        error:
          'Unable to process your message at this time. Please try again later.',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
