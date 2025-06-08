// src/components/forms/fields/FormTextarea.tsx
'use client'

import { forwardRef } from 'react'

interface FormTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
  helpText?: string
  containerClassName?: string
  required?: boolean
  minHeight?: string
  maxHeight?: string
}

export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  function FormTextarea(
    {
      label,
      error,
      helpText,
      containerClassName = '',
      className = '',
      required = false,
      minHeight = 'clamp(120px, 25vh, 200px)',
      maxHeight,
      id,
      style,
      ...props
    },
    ref
  ) {
    const fieldId = id || `field-${props.name || 'textarea'}`

    const textareaStyles: React.CSSProperties = {
      minHeight,
      maxHeight,
      ...style,
    }

    return (
      <div className={`form-field ${containerClassName}`}>
        <label htmlFor={fieldId} className="form-label-mobile">
          {label}
          {required && (
            <span className="text-required" aria-label="required">
              {' '}
              *
            </span>
          )}
        </label>

        <textarea
          ref={ref}
          id={fieldId}
          className={`form-textarea-mobile ${error ? 'form-input-error' : ''} ${className}`}
          style={textareaStyles}
          aria-invalid={!!error}
          aria-describedby={
            error
              ? `${fieldId}-error`
              : helpText
                ? `${fieldId}-help`
                : undefined
          }
          {...props}
        />

        {helpText && !error && (
          <p id={`${fieldId}-help`} className="form-help-text">
            {helpText}
          </p>
        )}

        {error && (
          <p id={`${fieldId}-error`} className="form-error-text" role="alert">
            {error}
          </p>
        )}
      </div>
    )
  }
)
