// src/components/mobile/Forms/MobileContactForm.tsx
'use client'

import { useState } from 'react'
import { MobileFormField } from './MobileFormField'
import { MobileButton } from '../UI/MobileButton'
import { FormValidator } from '@/utils/validation/formValidator'
import { commonValidationRules } from '@/utils/validation/validators'
import { UmamiEvents } from '@/utils/analytics'
import { useVirtualKeyboard } from '@/hooks/mobile/useVirtualKeyboard'

interface ContactFormData {
  name: string
  email: string
  message: string
  [key: string]: string // Add index signature
}

interface MobileContactFormProps {
  onSuccess?: () => void
  onError?: (error: string) => void
}

export function MobileContactForm({
  onSuccess,
  onError,
}: MobileContactFormProps) {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    message: '',
  })

  const [errors, setErrors] = useState<Partial<ContactFormData>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const { isKeyboardOpen } = useVirtualKeyboard()
  const validator = new FormValidator<ContactFormData>(commonValidationRules)

  const handleFieldChange = (field: keyof ContactFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))

    // Clear success message when user starts typing again
    if (showSuccess) {
      setShowSuccess(false)
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

    // Validate all fields
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
        setErrors({})
        setShowSuccess(true)
        onSuccess?.()

        // Hide success message after 5 seconds
        setTimeout(() => setShowSuccess(false), 5000)
      } else {
        throw new Error('Failed to send message')
      }
    } catch (error) {
      UmamiEvents.contactFormError()
      onError?.(
        error instanceof Error ? error.message : 'Failed to send message'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form
      className={`mobile-contact-form ${isKeyboardOpen ? 'keyboard-open' : ''}`}
      onSubmit={handleSubmit}
      noValidate
    >
      {showSuccess && (
        <div className="mobile-form-success">
          <p>✓ Message sent successfully!</p>
        </div>
      )}

      <div className="mobile-form-stack">
        <MobileFormField
          label="Name"
          type="text"
          value={formData.name}
          onChange={(value) => handleFieldChange('name', value)}
          error={errors.name}
          placeholder="Your full name"
          autoComplete="name"
          required
        />

        <MobileFormField
          label="Email"
          type="email"
          value={formData.email}
          onChange={(value) => handleFieldChange('email', value)}
          error={errors.email}
          placeholder="your.email@example.com"
          autoComplete="email"
          inputMode="email"
          required
        />

        <MobileFormField
          label="Message"
          type="textarea"
          value={formData.message}
          onChange={(value) => handleFieldChange('message', value)}
          error={errors.message}
          placeholder="Tell me about your project..."
          rows={6}
          required
        />
      </div>

      <div className="mobile-form-submit">
        <MobileButton
          type="submit"
          variant="primary"
          fullWidth
          disabled={isSubmitting || !validator.isFormValid()}
          loading={isSubmitting}
        >
          Send Message
        </MobileButton>
      </div>
    </form>
  )
}
