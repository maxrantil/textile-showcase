// ABOUTME: Desktop form field component — thin wrapper around BaseFormField with desktop styling
'use client'

import { forwardRef, ForwardedRef } from 'react'
import { BaseFormField } from '@/components/shared/Forms/BaseFormField'

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

export const DesktopFormField = forwardRef(function DesktopFormFieldComponent(
  props: DesktopFormFieldProps,
  ref: ForwardedRef<HTMLInputElement | HTMLTextAreaElement>
) {
  return <BaseFormField ref={ref} {...props} classPrefix="desktop" />
})
