'use client'

import { useRouter } from 'next/navigation'
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
    
    // Debug current saved positions
    scrollManager.debug()
    
    scrollManager.triggerNavigationStart()
    router.back()
    scrollManager.triggerNavigationComplete()
  }

  return (
    <button
      onClick={handleBack}
      style={{
        fontSize: '14px',
        color: '#333',
        textDecoration: 'none',
        letterSpacing: '1px',
        border: '1px solid #333',
        padding: '12px 24px',
        borderRadius: '6px',
        display: 'inline-block',
        transition: 'all 0.3s ease',
        background: 'transparent',
        cursor: 'pointer'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#333'
        e.currentTarget.style.color = '#fff'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent'
        e.currentTarget.style.color = '#333'
      }}
    >
      ← Back to Gallery
    </button>
  )
}
