'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus('idle')

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setSubmitStatus('success')
        setFormData({ name: '', email: '', message: '' })
      } else {
        setSubmitStatus('error')
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '16px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '16px',
    fontFamily: 'inherit',
    transition: 'border-color 0.3s ease',
    outline: 'none'
  }

  const focusStyle = {
    borderColor: '#333'
  }

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa' }}>
      <div style={{ height: '100px' }} />
      
      <div style={{ 
        maxWidth: '800px', 
        margin: '0 auto', 
        padding: '60px 40px' 
      }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h1 style={{ 
            fontSize: '48px', 
            fontWeight: 300, 
            margin: '0 0 24px 0',
            color: '#333',
            letterSpacing: '-1px'
          }}>
            Contact
          </h1>
          
          <p style={{ 
            fontSize: '18px', 
            color: '#666', 
            lineHeight: '1.6'
          }}>
            Interested in collaborating or learning more about my work? 
            I'd love to hear from you.
          </p>
        </div>

        {/* Contact Form */}
        <form onSubmit={handleSubmit} style={{ marginBottom: '48px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '14px', 
                fontWeight: 400, 
                marginBottom: '8px',
                color: '#333',
                letterSpacing: '1px',
                textTransform: 'uppercase'
              }}>
                Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = '#333'}
                onBlur={(e) => e.target.style.borderColor = '#ddd'}
              />
            </div>
            
            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '14px', 
                fontWeight: 400, 
                marginBottom: '8px',
                color: '#333',
                letterSpacing: '1px',
                textTransform: 'uppercase'
              }}>
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = '#333'}
                onBlur={(e) => e.target.style.borderColor = '#ddd'}
              />
            </div>
          </div>
          
          <div style={{ marginBottom: '32px' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '14px', 
              fontWeight: 400, 
              marginBottom: '8px',
              color: '#333',
              letterSpacing: '1px',
              textTransform: 'uppercase'
            }}>
              Message *
            </label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
              rows={6}
              style={{
                ...inputStyle,
                resize: 'vertical',
                minHeight: '120px'
              }}
              onFocus={(e) => e.target.style.borderColor = '#333'}
              onBlur={(e) => e.target.style.borderColor = '#ddd'}
            />
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                fontSize: '14px',
                color: isSubmitting ? '#999' : '#333',
                background: isSubmitting ? '#f5f5f5' : 'transparent',
                border: `1px solid ${isSubmitting ? '#ddd' : '#333'}`,
                padding: '16px 32px',
                borderRadius: '6px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                letterSpacing: '1px',
                textTransform: 'uppercase',
                transition: 'all 0.3s ease'
              }}
            >
              {isSubmitting ? 'Sending...' : 'Send Message'}
            </button>
          </div>
        </form>

        {/* Status Messages */}
        {submitStatus === 'success' && (
          <div style={{
            background: '#d4edda',
            color: '#155724',
            padding: '16px',
            borderRadius: '6px',
            textAlign: 'center',
            marginBottom: '32px'
          }}>
            Thank you! Your message has been sent successfully.
          </div>
        )}

        {submitStatus === 'error' && (
          <div style={{
            background: '#f8d7da',
            color: '#721c24',
            padding: '16px',
            borderRadius: '6px',
            textAlign: 'center',
            marginBottom: '32px'
          }}>
            Sorry, there was an error sending your message. Please try again.
          </div>
        )}

        {/* Back Link */}
        <div style={{ textAlign: 'center' }}>
          <Link 
            href="/"
            style={{
              fontSize: '14px',
              color: '#333',
              textDecoration: 'none',
              letterSpacing: '1px',
              border: '1px solid #333',
              padding: '12px 24px',
              borderRadius: '6px'
            }}
          >
            ← Back to Gallery
          </Link>
        </div>
      </div>
    </div>
  )
}
