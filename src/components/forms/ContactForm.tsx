// src/components/forms/ContactForm.tsx
'use client'

import { useState, useCallback } from 'react'
import { FormInput } from './fields/FormInput'
import { FormTextarea } from './fields/FormTextarea'
import { FormSuccess, FormError } from './FormMessages'
import { FormValidator } from '@/utils/validation/formValidator'
import { commonValidationRules } from '@/utils/validation/validators'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { UmamiEvents } from '@/utils/analytics'

interface ContactFormData {
  name: string
  email: string
  message: string
  [key: string]: string
}

interface ContactFormProps {
  onSuccess?: () => void
  onError?: (error: string) => void
  className?: string
}

// Form validation rules
const validationRules = {
  name: commonValidationRules.name,
  email: commonValidationRules.email,
  message: commonValidationRules.message,
}

export default function ContactForm({
  onSuccess,
  onError,
  className = '',
}: ContactFormProps) {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    message: '',
  })

  const [validator] = useState(
    () => new FormValidator<ContactFormData>(validationRules)
  )
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<
    'idle' | 'success' | 'error'
  >('idle')
  const [submitError, setSubmitError] = useState<string>('')

  const handleFieldChange = useCallback(
    (fieldName: string, value: string) => {
      // Update form data
      setFormData((prev) => ({ ...prev, [fieldName]: value }))

      // Clear submit status when user starts typing
      if (submitStatus !== 'idle') {
        setSubmitStatus('idle')
        setSubmitError('')
      }

      // Validate field
      const result = validator.validateField(fieldName, value)

      // Update field errors
      setFieldErrors((prev) => {
        const newErrors = { ...prev }
        if (result.error) {
          newErrors[fieldName] = result.error
        } else {
          delete newErrors[fieldName]
        }
        return newErrors
      })
    },
    [validator, submitStatus]
  )

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      // Validate entire form
      const validationResult = validator.validateForm(formData)

      if (!validationResult.isValid) {
        setFieldErrors(validationResult.errors)
        UmamiEvents.contactFormError()
        return
      }

      setIsSubmitting(true)
      setSubmitStatus('idle')
      setFieldErrors({})
      setSubmitError('')

      // Track form submission attempt
      UmamiEvents.contactFormSubmit()

      // Safari-compatible fetch with enhanced error handling
      const isWebKit = /WebKit/.test(navigator.userAgent)

      try {
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Safari sometimes needs explicit Accept header
            Accept: 'application/json',
          },
          body: JSON.stringify(formData),
          // Safari credentials handling
          credentials: 'same-origin',
        })

        const data = await response.json()

        if (response.ok) {
          setSubmitStatus('success')
          setFormData({ name: '', email: '', message: '' })
          validator.reset()

          // Track successful form submission
          UmamiEvents.contactFormSuccess()

          onSuccess?.()
        } else {
          const errorMessage = data.error || 'Failed to send message'
          setSubmitStatus('error')
          setSubmitError(errorMessage)

          // Track form submission error
          UmamiEvents.contactFormError()

          onError?.(errorMessage)
        }
      } catch (error) {
        console.error('Error submitting form:', error)

        // Safari-specific error detection and handling
        let errorMessage =
          'Network error. Please check your connection and try again.'

        if (isWebKit && error instanceof Error) {
          if (error.message.includes('AbortError')) {
            errorMessage = 'Request was cancelled. Please try again.'
          } else if (error.message.includes('NetworkError')) {
            errorMessage =
              'Network connection failed. Please check your internet connection.'
          } else if (error.message.includes('TypeError')) {
            errorMessage =
              'Unable to connect to server. Please try again later.'
          }
        }

        setSubmitStatus('error')
        setSubmitError(errorMessage)

        // Track network error
        UmamiEvents.contactFormError()

        onError?.(errorMessage)
      } finally {
        setIsSubmitting(false)
      }
    },
    [formData, validator, onSuccess, onError]
  )

  const handleRetry = useCallback(() => {
    setSubmitStatus('idle')
    setSubmitError('')
  }, [])

  return (
    <div className={`contact-form-container ${className}`}>
      <form onSubmit={handleSubmit} noValidate className="contact-form">
        {/* Name and Email Row */}
        <div className="form-row">
          <FormInput
            name="name"
            type="text"
            label="Name"
            value={formData.name}
            onChange={(e) => handleFieldChange('name', e.target.value)}
            error={fieldErrors.name}
            required
            placeholder="Your full name"
            autoComplete="name"
          />

          <FormInput
            name="email"
            type="email"
            label="Email"
            value={formData.email}
            onChange={(e) => handleFieldChange('email', e.target.value)}
            error={fieldErrors.email}
            required
            placeholder="your.email@example.com"
            autoComplete="email"
          />
        </div>

        {/* Message Field */}
        <FormTextarea
          name="message"
          label="Message"
          value={formData.message}
          onChange={(e) => handleFieldChange('message', e.target.value)}
          error={fieldErrors.message}
          required
          placeholder="Tell me about your project, ideas, or any questions you have..."
          helpText="Please include any relevant details about your project or inquiry."
        />

        {/* Submit Button */}
        <div className="form-submit">
          <button
            type="submit"
            disabled={isSubmitting || !validator.isFormValid()}
            className="btn-mobile btn-mobile-primary touch-feedback"
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

        {/* Status Messages */}
        {submitStatus === 'success' && (
          <FormSuccess
            title="Message sent successfully!"
            message="Thank you for your message. I'll get back to you as soon as possible."
          />
        )}

        {submitStatus === 'error' && (
          <FormError
            title="Failed to send message"
            message={submitError}
            onRetry={handleRetry}
          />
        )}
      </form>
    </div>
  )
}
