// ABOUTME: Desktop contact form — the fields and submit button as a view over contact form state,
// ABOUTME: plus a standalone form that owns that state through the useContactForm hook
'use client'
import { DesktopFormField } from './DesktopFormField'
import { DesktopButton } from '../UI/DesktopButton'
import {
  useContactForm,
  type ContactFormState,
} from '@/hooks/shared/useContactForm'

interface DesktopContactFormProps {
  onSuccess?: () => void
  onError?: (error: string) => void
}

export function DesktopContactForm({
  onSuccess,
  onError,
}: DesktopContactFormProps) {
  const form = useContactForm({ onSuccess, onError })

  return <DesktopContactFormView form={form} />
}

// Renders state owned by the caller, so the state outlives this component
export function DesktopContactFormView({ form }: { form: ContactFormState }) {
  const {
    formData,
    errors,
    isSubmitting,
    handleFieldChange,
    handleSubmit,
    isFormValid,
  } = form

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
    </form>
  )
}
