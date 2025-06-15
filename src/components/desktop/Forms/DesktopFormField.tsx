// src/components/desktop/Forms/DesktopFormField.tsx
'use client'

import { forwardRef, ForwardedRef } from 'react'

type DesktopFormFieldProps = {
  label: string
  type: 'text' | 'email' | 'textarea'
  value?: string
  onChange?: (value: string) => void
  required?: boolean
  error?: string
  rows?: number
  placeholder?: string
}

function DesktopFormFieldComponent(
  props: DesktopFormFieldProps,
  ref: ForwardedRef<HTMLInputElement | HTMLTextAreaElement>
) {
  const {
    label,
    type,
    value,
    onChange,
    required,
    error,
    rows = 8,
    placeholder,
  } = props
  const fieldId = `field-${label.toLowerCase().replace(/\s+/g, '-')}`

  return (
    <div className="desktop-form-field">
      <label htmlFor={fieldId} className="desktop-form-label">
        {label}
        {required && <span className="text-required"> *</span>}
      </label>

      {type === 'textarea' ? (
        <textarea
          ref={ref as React.Ref<HTMLTextAreaElement>}
          id={fieldId}
          className={`desktop-form-textarea ${error ? 'error' : ''}`}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          rows={rows}
          placeholder={placeholder}
          required={required}
        />
      ) : (
        <input
          ref={ref as React.Ref<HTMLInputElement>}
          id={fieldId}
          type={type}
          className={`desktop-form-input ${error ? 'error' : ''}`}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          required={required}
        />
      )}

      {error && <span className="desktop-form-error">{error}</span>}
    </div>
  )
}

export const DesktopFormField = forwardRef(DesktopFormFieldComponent)
