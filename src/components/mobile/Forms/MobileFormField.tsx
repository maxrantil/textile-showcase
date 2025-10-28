// ABOUTME: Reusable mobile form field component with touch feedback and accessibility features
'use client'

import { forwardRef, ForwardedRef } from 'react'
import { useTouchFeedback } from '@/hooks/mobile/useTouchFeedback'

interface MobileFormFieldProps {
  label: string
  type: 'text' | 'email' | 'textarea'
  value: string
  onChange: (value: string) => void
  required?: boolean
  error?: string
  placeholder?: string
  rows?: number
  autoComplete?: string
  inputMode?: 'text' | 'email' | 'tel' | 'numeric' | 'url'
}

function MobileFormFieldComponent(
  props: MobileFormFieldProps,
  ref: ForwardedRef<HTMLInputElement | HTMLTextAreaElement>
) {
  const {
    label,
    type,
    value,
    onChange,
    required = false,
    error,
    placeholder = '',
    rows = 8,
    autoComplete = 'off',
    inputMode,
  } = props
  const fieldId = `field-${label.toLowerCase().replace(/\s+/g, '-')}`
  const { touchProps } = useTouchFeedback()
  return (
    <div className="mobile-form-field">
      <label htmlFor={fieldId} className="mobile-form-label">
        {label}
        {required && <span className="text-required"> *</span>}
      </label>

      {type === 'textarea' ? (
        <textarea
          ref={ref as React.Ref<HTMLTextAreaElement>}
          id={fieldId}
          className={`mobile-form-textarea ${error ? 'error' : ''}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          rows={rows}
          autoComplete={autoComplete}
          {...touchProps}
        />
      ) : (
        <input
          ref={ref as React.Ref<HTMLInputElement>}
          id={fieldId}
          type={type}
          className={`mobile-form-input ${error ? 'error' : ''}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          inputMode={inputMode || (type === 'email' ? 'email' : 'text')}
          {...touchProps}
        />
      )}

      {error && (
        <span className="mobile-form-error" role="alert">
          {error}
        </span>
      )}
    </div>
  )
}

export const MobileFormField = forwardRef(MobileFormFieldComponent)
