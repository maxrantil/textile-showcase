// src/components/forms/ContactForm.tsx - Fixed FormField component
'use client'

import { useState, useCallback } from 'react'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

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

interface ContactFormProps {
  onSuccess?: () => void
  onError?: (error: string) => void
}

export default function ContactForm({ onSuccess, onError }: ContactFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    message: ''
  })
  
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')

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
    
    setFormData(prev => ({ ...prev, [name]: value }))
    
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }, [errors])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        setSubmitStatus('success')
        setFormData({ name: '', email: '', message: '' })
        onSuccess?.()
      } else {
        setSubmitStatus('error')
        const errorMessage = data.error || 'Failed to send message'
        setErrors({ general: errorMessage })
        onError?.(errorMessage)
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      setSubmitStatus('error')
      const errorMessage = 'Network error. Please check your connection and try again.'
      setErrors({ general: errorMessage })
      onError?.(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }, [formData, validateForm, onSuccess, onError])

  // Shared input styles
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
    <form onSubmit={handleSubmit} noValidate>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '24px', 
        marginBottom: '24px' 
      }}>
        <FormField
          label="Name *"
          name="name"
          type="text"
          value={formData.name}
          onChange={handleChange}
          error={errors.name}
          style={errors.name ? errorInputStyle : inputStyle}
          focusStyle={focusStyle}
        />
        
        <FormField
          label="Email *"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
          style={errors.email ? errorInputStyle : inputStyle}
          focusStyle={focusStyle}
        />
      </div>
      
      <FormField
        label="Message *"
        name="message"
        type="textarea"
        value={formData.message}
        onChange={handleChange}
        error={errors.message}
        style={errors.message ? errorInputStyle : inputStyle}
        focusStyle={focusStyle}
        rows={6}
      />
      
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
          <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 500 }}>
            Message sent successfully!
          </h3>
          <p style={{ margin: 0, fontSize: '16px' }}>
            Thank you for your message. I'll get back to you as soon as possible.
          </p>
        </div>
      )}
    </form>
  )
}

// FIXED: Helper component for form fields with proper label association
interface FormFieldProps {
  label: string
  name: string
  type: 'text' | 'email' | 'textarea'
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  error?: string
  style: React.CSSProperties
  focusStyle: React.CSSProperties
  rows?: number
}

function FormField({ 
  label, 
  name, 
  type, 
  value, 
  onChange, 
  error, 
  style, 
  focusStyle, 
  rows 
}: FormFieldProps) {
  const fieldId = `field-${name}` // Create unique ID for each field
  
  const labelStyle = {
    display: 'block',
    fontSize: '14px',
    fontWeight: 500,
    marginBottom: '8px',
    color: '#333',
    letterSpacing: '0.5px',
    textTransform: 'uppercase' as const
  }

  const errorStyle = {
    color: '#ef4444',
    fontSize: '14px',
    marginTop: '4px',
    margin: '4px 0 0 0'
  }

  const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    Object.assign(e.target.style, focusStyle)
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = error ? '#ef4444' : '#e5e5e5'
    e.target.style.boxShadow = 'none'
  }

  return (
    <div style={{ marginBottom: '24px' }}>
      <label htmlFor={fieldId} style={labelStyle}>
        {label}
      </label>
      
      {type === 'textarea' ? (
        <textarea
          id={fieldId}
          name={name}
          value={value}
          onChange={onChange}
          required
          rows={rows}
          style={{
            ...style,
            resize: 'vertical' as const,
            minHeight: '120px'
          }}
          onFocus={handleFocus}
          onBlur={handleBlur}
          aria-invalid={!!error}
          aria-describedby={error ? `${name}-error` : undefined}
        />
      ) : (
        <input
          id={fieldId}
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          required
          style={style}
          onFocus={handleFocus}
          onBlur={handleBlur}
          aria-invalid={!!error}
          aria-describedby={error ? `${name}-error` : undefined}
        />
      )}
      
      {error && (
        <p id={`${name}-error`} style={errorStyle}>
          {error}
        </p>
      )}
    </div>
  )
}
