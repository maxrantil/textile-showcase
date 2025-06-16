'use client'

import { useRouter } from 'next/navigation'
import { useKeyboardNavigation } from '@/hooks/desktop/useKeyboardNavigation'

interface KeyboardScrollHandlerProps {
  scrollAmount?: number
  enablePageNavigation?: boolean
}

export default function KeyboardScrollHandler({
  scrollAmount = 150,
  enablePageNavigation = true,
}: KeyboardScrollHandlerProps) {
  const router = useRouter()

  useKeyboardNavigation({
    onScrollUp: () => {
      window.scrollBy({ top: -scrollAmount, behavior: 'smooth' })
    },
    onScrollDown: () => {
      window.scrollBy({ top: scrollAmount, behavior: 'smooth' })
    },
    // Page navigation
    onAbout: enablePageNavigation ? () => router.push('/about') : undefined,
    onWork: enablePageNavigation ? () => router.push('/') : undefined,
    onContact: enablePageNavigation ? () => router.push('/contact') : undefined,
    enabled: true,
  })

  // This component renders nothing, it just handles keyboard events
  return null
}
