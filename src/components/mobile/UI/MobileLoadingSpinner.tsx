// ABOUTME: Mobile loading spinner component with configurable size options
'use client'

interface MobileLoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large'
}

export function MobileLoadingSpinner({
  size = 'medium',
}: MobileLoadingSpinnerProps) {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-6 h-6',
    large: 'w-8 h-8',
  }

  return (
    <div className="mobile-spinner-container">
      <div className={`mobile-spinner ${sizeClasses[size]}`} />
    </div>
  )
}
