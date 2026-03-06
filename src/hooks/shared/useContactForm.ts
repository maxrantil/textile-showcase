// ABOUTME: Shared contact form logic — state management, validation, API submission, analytics
'use client'

import { useState } from 'react'
import { FormValidator } from '@/utils/validation/formValidator'
import { commonValidationRules } from '@/utils/validation/validators'
import { UmamiEvents } from '@/utils/analytics'

interface ContactFormData {
  name: string
  email: string
  message: string
  [key: string]: string
}

interface UseContactFormOptions {
  onSuccess?: () => void
  onError?: (error: string) => void
}

export function useContactForm({
  onSuccess,
  onError,
}: UseContactFormOptions = {}) {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    message: '',
  })
  const [errors, setErrors] = useState<Partial<ContactFormData>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const validator = new FormValidator<ContactFormData>(commonValidationRules)

  const handleFieldChange = (field: keyof ContactFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))

    // Clear success state when user starts typing again
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

  return {
    formData,
    errors,
    isSubmitting,
    showSuccess,
    handleFieldChange,
    handleSubmit,
    isFormValid: () => validator.isFormValid(),
  }
}
