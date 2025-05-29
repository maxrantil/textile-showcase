import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { name, email, message } = await request.json()

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Send email using Resend
    const data = await resend.emails.send({
      from: 'contact@idaromme.dk', // Replace with your verified domain
      to: ['idaromme@gmail.com'], // Replace with your email
      subject: `New Contact Form Message from ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; font-weight: 300;">New Contact Form Message</h2>
          
          <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
          </div>
          
          <div style="background: #fff; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
            <h3 style="color: #333; font-weight: 300;">Message:</h3>
            <p style="line-height: 1.6; color: #666;">${message}</p>
          </div>
          
          <p style="color: #999; font-size: 14px; margin-top: 20px;">
            This message was sent from your idaromme.dk contact form.
          </p>
        </div>
      `,
    })

    return NextResponse.json({ success: true, id: data.id })
  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}
