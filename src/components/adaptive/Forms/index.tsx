// ABOUTME: Contact form that shows the desktop or the mobile layout over one shared form state,
// ABOUTME: so text, validation errors and focus survive the swap between the two after hydration
'use client'

import { useLayoutEffect, useRef } from 'react'
import { useDeviceType } from '@/hooks/shared/useDeviceType'
import { useContactForm } from '@/hooks/shared/useContactForm'
import { MobileContactFormView } from '@/components/mobile/Forms/MobileContactForm'
import { DesktopContactFormView } from '@/components/desktop/Forms/DesktopContactForm'

interface ContactFormProps {
  onSuccess?: () => void
  onError?: (error: string) => void
}

type Field = HTMLInputElement | HTMLTextAreaElement

// Both layouts give their fields these ids (see BaseFormField)
const FIELD_IDS = {
  name: 'field-name',
  email: 'field-email',
  message: 'field-message',
} as const

const isField = (node: unknown): node is Field =>
  node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement

export default function ContactForm(props: ContactFormProps) {
  const form = useContactForm(props)
  const deviceType = useDeviceType()
  const isMobile = deviceType === 'mobile'

  const containerRef = useRef<HTMLDivElement>(null)
  const focusedFieldRef = useRef<Field | null>(null)

  // The server HTML is usable before React hydrates it. Take over what the
  // visitor typed and where the focus is, which React does not do by itself.
  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return

    for (const [field, id] of Object.entries(FIELD_IDS)) {
      const value = container.querySelector<Field>(`#${id}`)?.value
      if (value) form.handleFieldChange(field, value)
    }

    const active = document.activeElement
    if (isField(active) && container.contains(active)) {
      focusedFieldRef.current = active
    }
    // Once, on mount: later renders have nothing left to take over
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // The two layouts are separate elements, so a swap removes the field the
  // visitor is typing into. Move focus and the caret to its replacement.
  useLayoutEffect(() => {
    const previous = focusedFieldRef.current
    if (!previous || previous.isConnected) return

    const replacement = containerRef.current?.querySelector<Field>(
      `#${previous.id}`
    )
    if (!replacement) return

    replacement.focus({ preventScroll: true })
    try {
      replacement.setSelectionRange(
        previous.selectionStart,
        previous.selectionEnd
      )
    } catch {
      // Email inputs have no caret API; the caret goes to the browser default
    }
  }, [isMobile])

  return (
    <div
      ref={containerRef}
      style={{ display: 'contents' }}
      onFocus={(event) => {
        if (isField(event.target)) focusedFieldRef.current = event.target
      }}
      onBlur={() => {
        focusedFieldRef.current = null
      }}
    >
      {isMobile ? (
        <MobileContactFormView form={form} />
      ) : (
        <DesktopContactFormView form={form} />
      )}
    </div>
  )
}
