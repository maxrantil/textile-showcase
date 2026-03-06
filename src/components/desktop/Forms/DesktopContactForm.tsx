'use client'
import { DesktopFormField } from './DesktopFormField'
import { DesktopButton } from '../UI/DesktopButton'
import { EmailRevealButton } from '@/components/shared/EmailReveal/EmailRevealButton'
import { useContactForm } from '@/hooks/shared/useContactForm'

interface DesktopContactFormProps {
  onSuccess?: () => void
  onError?: (error: string) => void
}

export function DesktopContactForm({
  onSuccess,
  onError,
}: DesktopContactFormProps) {
  const {
    formData,
    errors,
    isSubmitting,
    handleFieldChange,
    handleSubmit,
    isFormValid,
  } = useContactForm({ onSuccess, onError })

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
          disabled={isSubmitting || !isFormValid()}
        >
          Send Message
        </DesktopButton>
      </div>

      <EmailRevealButton />
    </form>
  )
}
