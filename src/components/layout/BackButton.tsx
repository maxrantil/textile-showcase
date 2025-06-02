'use client'

import { useRouter } from 'next/navigation'
import { BackButton as StyledBackButton } from '@/components/ui/Button'
import { scrollManager } from '@/lib/scrollManager'

export default function BackButton() {
  const router = useRouter()

  const handleBack = () => {
    console.log('🔙 Back button clicked')
    
    // Save current position before going back (if any)
    const container = document.querySelector('[data-scroll-container]') as HTMLElement
    if (container) {
      const currentIndex = parseInt(container.getAttribute('data-current-index') || '0', 10)
      scrollManager.saveImmediate(currentIndex, window.location.pathname)
      console.log(`💾 Saved current index ${currentIndex} before going back`)
    }
    
    scrollManager.debug()
    scrollManager.triggerNavigationStart()
    router.back()
    scrollManager.triggerNavigationComplete()
  }

  return (
    <StyledBackButton onClick={handleBack}>
      ← Back to Gallery
    </StyledBackButton>
  )
}
