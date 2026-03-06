// ABOUTME: Reusable mobile form field component with touch feedback and accessibility features
'use client'

import { forwardRef, ForwardedRef } from 'react'
import { useTouchFeedback } from '@/hooks/mobile/useTouchFeedback'
import { BaseFormField } from '@/components/shared/Forms/BaseFormField'

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

export const MobileFormField = forwardRef(function MobileFormFieldComponent(
  {
    autoComplete = 'off',
    inputMode,
    type,
    ...props
  }: MobileFormFieldProps,
  ref: ForwardedRef<HTMLInputElement | HTMLTextAreaElement>
) {
  const { touchProps } = useTouchFeedback()
  const resolvedInputMode = inputMode || (type === 'email' ? 'email' : 'text')

  return (
    <BaseFormField
      ref={ref}
      {...props}
      type={type}
      classPrefix="mobile"
      errorRole="alert"
      extraInputProps={{ ...touchProps, autoComplete, inputMode: resolvedInputMode }}
      extraTextareaProps={{ ...touchProps, autoComplete }}
    />
  )
})
