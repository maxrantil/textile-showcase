'use client'

import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation'

interface KeyboardScrollHandlerProps {
  scrollAmount?: number
}

export default function KeyboardScrollHandler({ 
  scrollAmount = 150 
}: KeyboardScrollHandlerProps) {
  useKeyboardNavigation({
    onScrollUp: () => {
      console.log('Scroll up triggered!')
      window.scrollBy({ top: -scrollAmount, behavior: 'smooth' })
    },
    onScrollDown: () => {
      console.log('Scroll down triggered!')
      window.scrollBy({ top: scrollAmount, behavior: 'smooth' })
    },
    enabled: true
  })

  // This component renders nothing, it just handles keyboard events
  return null
}
