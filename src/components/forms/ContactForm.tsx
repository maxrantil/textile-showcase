'use client'

import { useState, useCallback, useMemo } from 'react'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { UmamiEvents } from '@/utils/analytics'
import { debounce } from '@/utils/performance'

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

  // Create debounced validation
  const debouncedValidation = useMemo(() => 
    debounce((data: FormData) => {
      const validationErrors = validateForm(data)
      setErrors(prev => {
        // Only update if there are actual changes to prevent unnecessary re-renders
        const hasChanges = Object.keys(validationErrors).some(
          key => validationErrors[key as keyof FormErrors] !== prev[key as keyof FormErrors]
        )
        return hasChanges ? validationErrors : prev
      })
    }, 500),
    [validateForm]
  )

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    
    const newFormData = { ...formData, [name]: value }
    setFormData(newFormData)
    
    // Clear immediate error for this field
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
    
    // Debounced validation for all fields
    debouncedValidation(newFormData)
  }, [formData, errors, debouncedValidation])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    const formErrors = validateForm(formData)
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors)
      // Track form validation errors
      UmamiEvents.contactFormError()
      return
    }

    setIsSubmitting(true)
    setSubmitStatus('idle')
    setErrors({})

    // Track form submission attempt
    UmamiEvents.contactFormSubmit()

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
        
        // Track successful form submission
        UmamiEvents.contactFormSuccess()
        
        onSuccess?.()
      } else {
        setSubmitStatus('error')
        const errorMessage = data.error || 'Failed to send message'
        setErrors({ general: errorMessage })
        
        // Track form submission error
        UmamiEvents.contactFormError()
        
        onError?.(errorMessage)
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      setSubmitStatus('error')
      const errorMessage = 'Network error. Please check your connection and try again.'
      setErrors({ general: errorMessage })
      
      // Track network error
      UmamiEvents.contactFormError()
      
      onError?.(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }, [formData, validateForm, onSuccess, onError])

  return (
    <div style={{ 
      width: '100%',
      display: 'flex',
      justifyContent: 'center',
      padding: '0'
    }}>
      <div style={{ 
        width: '100%', 
        maxWidth: '600px'
      }}>
        <form onSubmit={handleSubmit} noValidate style={{ 
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch'
        }}>
          {/* Name and Email Row - Centered */}
          <div style={{
            width: '100%',
            marginBottom: 'clamp(16px, 4vw, 24px)'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: 'clamp(16px, 4vw, 24px)',
              width: '100%'
            }} className="responsive-form-grid">
              <FormField
                label="Name *"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                error={errors.name}
              />
              
              <FormField
                label="Email *"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
              />
            </div>
          </div>
          
          {/* Message Field - Full Width */}
          <FormField
            label="Message *"
            name="message"
            type="textarea"
            value={formData.message}
            onChange={handleChange}
            error={errors.message}
            responsiveHeight={true}
          />
          
          {errors.general && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              padding: '16px',
              borderRadius: '6px',
              marginBottom: '24px',
              textAlign: 'center',
              width: '100%'
            }}>
              <span className="text-body-mobile">{errors.general}</span>
            </div>
          )}
          
          <div style={{ 
            textAlign: 'center', 
            width: '100%',
            display: 'flex',
            justifyContent: 'center'
          }}>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-mobile btn-mobile-primary touch-feedback"
              style={{
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
            <div className="spacing-mobile-lg" style={{
              background: '#f0f9ff',
              border: '1px solid #bae6fd',
              color: '#0369a1',
              padding: '20px',
              borderRadius: '8px',
              textAlign: 'center',
              width: '100%'
            }}>
              <h3 className="text-body-mobile" style={{ margin: '0 0 8px 0', fontWeight: 500 }}>
                Message sent successfully!
              </h3>
              <p className="text-body-mobile" style={{ margin: 0 }}>
                Thank you for your message. I&apos;ll get back to you as soon as possible.
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}

// Enhanced Form Field Component
interface FormFieldProps {
  label: string
  name: string
  type: 'text' | 'email' | 'textarea'
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  error?: string
  responsiveHeight?: boolean
}

function FormField({ 
  label, 
  name, 
  type, 
  value, 
  onChange, 
  error,
  responsiveHeight = false
}: FormFieldProps) {
  const fieldId = `field-${name}`
  
  // Responsive textarea height based on device
  const getTextareaHeight = () => {
    if (!responsiveHeight) return '120px'
    return 'clamp(120px, 25vh, 200px)'
  }
  
  return (
    <div style={{
      marginBottom: 'clamp(16px, 4vw, 24px)',
      width: '100%'
    }}>
      <label htmlFor={fieldId} className="form-label-mobile">
        {label}
      </label>
      
      {type === 'textarea' ? (
        <textarea
          id={fieldId}
          name={name}
          value={value}
          onChange={onChange}
          required
          className={`form-textarea-mobile ${error ? 'form-input-error' : ''}`}
          style={{
            minHeight: getTextareaHeight(),
            resize: 'vertical',
            lineHeight: '1.6',
            fontSize: '16px',
            width: '100%'
          }}
          aria-invalid={!!error}
          aria-describedby={error ? `${name}-error` : undefined}
          placeholder="Tell me about your project, ideas, or any questions you have..."
        />
      ) : (
        <input
          id={fieldId}
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          required
          className={`form-input-mobile ${error ? 'form-input-error' : ''}`}
          style={{ width: '100%' }}
          aria-invalid={!!error}
          aria-describedby={error ? `${name}-error` : undefined}
        />
      )}
      
      {error && (
        <p id={`${name}-error`} className="text-caption-mobile" style={{
          color: '#ef4444',
          margin: '4px 0 0 0'
        }}>
          {error}
        </p>
      )}
    </div>
  )
}
