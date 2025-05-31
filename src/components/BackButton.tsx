// Create src/components/BackButton.tsx
'use client'

import { useRouter } from 'next/navigation'

export default function BackButton() {
  const router = useRouter()

  const handleBack = () => {
    // Simply use router.back() - the scroll position should now be restored by our gallery
    router.back()
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
