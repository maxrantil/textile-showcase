// src/components/forms/fields/FormInput.tsx
'use client'

import { forwardRef } from 'react'

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  helpText?: string
  containerClassName?: string
  required?: boolean
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  function FormInput({ 
    label, 
    error, 
    helpText, 
    containerClassName = '', 
    className = '',
    required = false,
    id,
    ...props 
  }, ref) {
    const fieldId = id || `field-${props.name || 'input'}`
    
    return (
      <div className={`form-field ${containerClassName}`}>
        <label 
          htmlFor={fieldId} 
          className="form-label-mobile"
        >
          {label}
          {required && <span className="text-required" aria-label="required"> *</span>}
        </label>
        
        <input
          ref={ref}
          id={fieldId}
          className={`form-input-mobile ${error ? 'form-input-error' : ''} ${className}`}
          aria-invalid={!!error}
          aria-describedby={error ? `${fieldId}-error` : helpText ? `${fieldId}-help` : undefined}
          {...props}
        />
        
        {helpText && !error && (
          <p id={`${fieldId}-help`} className="form-help-text">
            {helpText}
          </p>
        )}
        
        {error && (
          <p 
            id={`${fieldId}-error`} 
            className="form-error-text"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    )
  }
)
