// src/components/adaptive/Forms/index.tsx
'use client'

import { useDeviceType } from '@/hooks/shared/useDeviceType'
import { MobileContactForm } from '@/components/mobile/Forms/MobileContactForm'
import { DesktopContactForm } from '@/components/desktop/Forms/DesktopContactForm'

interface ContactFormProps {
  onSuccess?: () => void
  onError?: (error: string) => void
}

export default function ContactForm(props: ContactFormProps) {
  const deviceType = useDeviceType()

  return deviceType === 'mobile' ? (
    <MobileContactForm {...props} />
  ) : (
    <DesktopContactForm {...props} />
  )
}
