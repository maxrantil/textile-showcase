'use client'
import { useState } from 'react'
import { DesktopFormField } from './DesktopFormField'
import { DesktopButton } from '../UI/DesktopButton'
import { FormValidator } from '@/utils/validation/formValidator'
import { commonValidationRules } from '@/utils/validation/validators'
import { UmamiEvents } from '@/utils/analytics'
import { EmailRevealButton } from '@/components/shared/EmailReveal/EmailRevealButton'

interface ContactFormData {
  name: string
  email: string
  message: string
  [key: string]: string // Add index signature
}

interface DesktopContactFormProps {
  onSuccess?: () => void
  onError?: (error: string) => void
}

export function DesktopContactForm({
  onSuccess,
  onError,
}: DesktopContactFormProps) {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    message: '',
  })
  const [errors, setErrors] = useState<Partial<ContactFormData>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasSubmissionError, setHasSubmissionError] = useState(false)

  const validator = new FormValidator<ContactFormData>(commonValidationRules)

  const handleFieldChange = (field: keyof ContactFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))

    // Clear error state when user starts typing again
    if (hasSubmissionError) {
      setHasSubmissionError(false)
    }

    // Validate field
    const result = validator.validateField(field as string, value)
    setErrors((prev) => ({
      ...prev,
      [field]: result.error,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const validation = validator.validateForm(formData)
    if (!validation.isValid) {
      setErrors(validation.errors)
      return
    }

    setIsSubmitting(true)
    UmamiEvents.contactFormSubmit()

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        UmamiEvents.contactFormSuccess()
        setFormData({ name: '', email: '', message: '' })
        setHasSubmissionError(false)
        onSuccess?.()
      } else {
        throw new Error('Failed to send message')
      }
    } catch (error) {
      UmamiEvents.contactFormError()
      setHasSubmissionError(true)
      onError?.(
        error instanceof Error ? error.message : 'Failed to send message'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="desktop-contact-form" onSubmit={handleSubmit}>
      <div className="desktop-form-grid">
        <DesktopFormField
          label="Name"
          type="text"
          value={formData.name}
          onChange={(value) => handleFieldChange('name', value)}
          error={errors.name}
          required
        />
        <DesktopFormField
          label="Email"
          type="email"
          value={formData.email}
          onChange={(value) => handleFieldChange('email', value)}
          error={errors.email}
          required
        />
      </div>
      <DesktopFormField
        label="Message"
        type="textarea"
        value={formData.message}
        onChange={(value) => handleFieldChange('message', value)}
        error={errors.message}
        required
        rows={8}
      />
      <div className="desktop-form-submit">
        <DesktopButton
          type="submit"
          variant="secondary"
          size="small"
          loading={isSubmitting}
          disabled={isSubmitting || !validator.isFormValid()}
        >
          Send Message
        </DesktopButton>
      </div>

      <EmailRevealButton hasError={hasSubmissionError} />
    </form>
  )
}
