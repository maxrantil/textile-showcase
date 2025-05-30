'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { LoadingSpinner } from '@/components/LoadingSpinner'

interface FormData {
  name: string
  email: string
  message: string
}

interface FormErrors {
  name?: string
  email?: string
  message?: string
  general?: string
}

export default function ContactPage() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    message: ''
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')

  // Validate form data
  const validateForm = useCallback((data: FormData): FormErrors => {
    const errors: FormErrors = {}

    if (!data.name.trim()) {
      errors.name = 'Name is required'
    } else if (data.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters'
    }

    if (!data.email.trim()) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.email = 'Please enter a valid email address'
    }

    if (!data.message.trim()) {
      errors.message = 'Message is required'
    } else if (data.message.trim().length < 10) {
      errors.message = 'Message must be at least 10 characters'
    }

    return errors
  }, [])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // Clear errors when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }))
    }
  }, [errors])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form
    const formErrors = validateForm(formData)
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors)
      return
    }

    setIsSubmitting(true)
    setSubmitStatus('idle')
    setErrors({})

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        setSubmitStatus('success')
        setFormData({ name: '', email: '', message: '' })
      } else {
        setSubmitStatus('error')
        setErrors({ general: data.error || 'Failed to send message' })
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      setSubmitStatus('error')
      setErrors({ 
        general: 'Network error. Please check your connection and try again.' 
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [formData, validateForm])

  const inputStyle = {
    width: '100%',
    padding: '16px',
    border: '2px solid #e5e5e5',
    borderRadius: '6px',
    fontSize: '16px',
    fontFamily: 'inherit',
    transition: 'all 0.3s ease',
    outline: 'none',
    backgroundColor: '#fff'
  }

  const errorInputStyle = {
    ...inputStyle,
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2'
  }

  const focusStyle = {
    borderColor: '#333',
    boxShadow: '0 0 0 3px rgba(51, 51, 51, 0.1)'
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
            lineHeight: '1.6',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            Interested in collaborating or learning more about my work? 
            I'd love to hear from you.
          </p>
        </div>

        {/* Contact Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '24px', 
            marginBottom: '24px' 
          }}>
            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '14px', 
                fontWeight: 500, 
                marginBottom: '8px',
                color: '#333',
                letterSpacing: '0.5px',
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
                style={errors.name ? errorInputStyle : inputStyle}
                onFocus={(e) => Object.assign(e.target.style, focusStyle)}
                onBlur={(e) => {
                  e.target.style.borderColor = errors.name ? '#ef4444' : '#e5e5e5'
                  e.target.style.boxShadow = 'none'
                }}
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? 'name-error' : undefined}
              />
              {errors.name && (
                <p id="name-error" style={{
                  color: '#ef4444',
                  fontSize: '14px',
                  marginTop: '4px',
                  margin: '4px 0 0 0'
                }}>
                  {errors.name}
                </p>
              )}
            </div>
            
            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '14px', 
                fontWeight: 500, 
                marginBottom: '8px',
                color: '#333',
                letterSpacing: '0.5px',
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
                style={errors.email ? errorInputStyle : inputStyle}
                onFocus={(e) => Object.assign(e.target.style, focusStyle)}
                onBlur={(e) => {
                  e.target.style.borderColor = errors.email ? '#ef4444' : '#e5e5e5'
                  e.target.style.boxShadow = 'none'
                }}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
              />
              {errors.email && (
                <p id="email-error" style={{
                  color: '#ef4444',
                  fontSize: '14px',
                  marginTop: '4px',
                  margin: '4px 0 0 0'
                }}>
                  {errors.email}
                </p>
              )}
            </div>
          </div>
          
          <div style={{ marginBottom: '32px' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '14px', 
              fontWeight: 500, 
              marginBottom: '8px',
              color: '#333',
              letterSpacing: '0.5px',
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
                ...(errors.message ? errorInputStyle : inputStyle),
                resize: 'vertical',
                minHeight: '120px'
              }}
              onFocus={(e) => Object.assign(e.target.style, focusStyle)}
              onBlur={(e) => {
                e.target.style.borderColor = errors.message ? '#ef4444' : '#e5e5e5'
                e.target.style.boxShadow = 'none'
              }}
              aria-invalid={!!errors.message}
              aria-describedby={errors.message ? 'message-error' : undefined}
            />
            {errors.message && (
              <p id="message-error" style={{
                color: '#ef4444',
                fontSize: '14px',
                marginTop: '4px',
                margin: '4px 0 0 0'
              }}>
                {errors.message}
              </p>
            )}
          </div>
          
          {/* General error message */}
          {errors.general && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              padding: '16px',
              borderRadius: '6px',
              marginBottom: '24px',
              textAlign: 'center'
            }}>
              {errors.general}
            </div>
          )}
          
          <div style={{ textAlign: 'center' }}>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                fontSize: '14px',
                color: isSubmitting ? '#999' : '#fff',
                background: isSubmitting ? '#f5f5f5' : '#333',
                border: `2px solid ${isSubmitting ? '#ddd' : '#333'}`,
                padding: '16px 32px',
                borderRadius: '6px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                letterSpacing: '1px',
                textTransform: 'uppercase',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                margin: '0 auto',
                minWidth: '160px'
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.background = '#000'
                }
              }}
              onMouseLeave={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.background = '#333'
                }
              }}
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="small" />
                  Sending...
                </>
              ) : (
                'Send Message'
              )}
            </button>
          </div>
        </form>

        {/* Status Messages */}
        {submitStatus === 'success' && (
          <div style={{
            background: '#f0f9ff',
            border: '1px solid #bae6fd',
            color: '#0369a1',
            padding: '20px',
            borderRadius: '8px',
            textAlign: 'center',
            marginTop: '32px'
          }}>
            <h3 style={{ 
              margin: '0 0 8px 0', 
              fontSize: '18px', 
              fontWeight: 500 
            }}>
              Message sent successfully!
            </h3>
            <p style={{ margin: 0, fontSize: '16px' }}>
              Thank you for your message. I'll get back to you as soon as possible.
            </p>
          </div>
        )}

        {/* Additional Contact Information */}
        <div style={{ 
          marginTop: '60px', 
          padding: '40px', 
          background: '#fff',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.08)'
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: 300,
            margin: '0 0 24px 0',
            color: '#333',
            textAlign: 'center'
          }}>
            Other Ways to Connect
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '32px',
            textAlign: 'center'
          }}>
            <div>
              <h3 style={{
                fontSize: '16px',
                fontWeight: 500,
                margin: '0 0 8px 0',
                color: '#333',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>
                Studio Location
              </h3>
              <p style={{ fontSize: '16px', color: '#666', margin: 0 }}>
                Stockholm, Sweden
              </p>
            </div>
            
            <div>
              <h3 style={{
                fontSize: '16px',
                fontWeight: 500,
                margin: '0 0 8px 0',
                color: '#333',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>
                Response Time
              </h3>
              <p style={{ fontSize: '16px', color: '#666', margin: 0 }}>
                Usually within 48 hours
              </p>
            </div>
          </div>
        </div>

        {/* Back Link */}
        <div style={{ textAlign: 'center', marginTop: '60px' }}>
          <Link 
            href="/"
            style={{
              fontSize: '14px',
              color: '#333',
              textDecoration: 'none',
              letterSpacing: '1px',
              border: '2px solid #333',
              padding: '12px 24px',
              borderRadius: '6px',
              transition: 'all 0.3s ease',
              display: 'inline-block'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#333'
              e.currentTarget.style.color = '#fff'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.color = '#333'
            }}
          >
            ← Back to Gallery
          </Link>
        </div>
      </div>
    </div>
  )
}
