// ABOUTME: Mobile contact form with validation, API integration, virtual keyboard handling, and email reveal fallback
'use client'

import { MobileFormField } from './MobileFormField'
import { MobileButton } from '../UI/MobileButton'
import { useVirtualKeyboard } from '@/hooks/mobile/useVirtualKeyboard'
import { EmailRevealButton } from '@/components/shared/EmailReveal/EmailRevealButton'
import { useContactForm } from '@/hooks/shared/useContactForm'

interface MobileContactFormProps {
  onSuccess?: () => void
  onError?: (error: string) => void
}

export function MobileContactForm({
  onSuccess,
  onError,
}: MobileContactFormProps) {
  const {
    formData,
    errors,
    isSubmitting,
    showSuccess,
    handleFieldChange,
    handleSubmit,
    isFormValid,
  } = useContactForm({ onSuccess, onError })

  const { isKeyboardOpen } = useVirtualKeyboard()

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
          disabled={isSubmitting || !isFormValid()}
          loading={isSubmitting}
          loadingText="Sending..."
        >
          Send Message
        </MobileButton>
      </div>

      <EmailRevealButton />
    </form>
  )
}
