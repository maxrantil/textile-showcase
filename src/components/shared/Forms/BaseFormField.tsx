// ABOUTME: Shared form field structure used by mobile and desktop variants via classPrefix
'use client'

import { forwardRef, ForwardedRef } from 'react'

interface BaseFormFieldProps {
  label: string
  type: 'text' | 'email' | 'textarea'
  value?: string
  onChange?: (value: string) => void
  required?: boolean
  error?: string
  placeholder?: string
  rows?: number
  classPrefix: 'mobile' | 'desktop'
  errorRole?: 'alert'
  extraInputProps?: React.InputHTMLAttributes<HTMLInputElement>
  extraTextareaProps?: React.TextareaHTMLAttributes<HTMLTextAreaElement>
}

function BaseFormFieldComponent(
  props: BaseFormFieldProps,
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
    classPrefix,
    errorRole,
    extraInputProps,
    extraTextareaProps,
  } = props

  const fieldId = `field-${label.toLowerCase().replace(/\s+/g, '-')}`

  return (
    <div className={`${classPrefix}-form-field`}>
      <label htmlFor={fieldId} className={`${classPrefix}-form-label`}>
        {label}
        {required && <span className="text-required"> *</span>}
      </label>

      {type === 'textarea' ? (
        <textarea
          ref={ref as React.Ref<HTMLTextAreaElement>}
          id={fieldId}
          className={`${classPrefix}-form-textarea ${error ? 'error' : ''}`}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          required={required}
          rows={rows}
          {...extraTextareaProps}
        />
      ) : (
        <input
          ref={ref as React.Ref<HTMLInputElement>}
          id={fieldId}
          type={type}
          className={`${classPrefix}-form-input ${error ? 'error' : ''}`}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          required={required}
          {...extraInputProps}
        />
      )}

      {error && (
        <span className={`${classPrefix}-form-error`} role={errorRole}>
          {error}
        </span>
      )}
    </div>
  )
}

export const BaseFormField = forwardRef(BaseFormFieldComponent)
