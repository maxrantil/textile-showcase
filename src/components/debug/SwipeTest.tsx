'use client'

import { useState } from 'react'
import { useHorizontalSwipe } from '@/hooks/useSwipeGesture'

export default function SwipeTest() {
  const [swipeHistory, setSwipeHistory] = useState<string[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  
  const addSwipeEvent = (direction: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setSwipeHistory(prev => [`${timestamp}: Swiped ${direction}`, ...prev.slice(0, 4)])
  }

  const swipeHandlers = useHorizontalSwipe({
    onSwipeLeft: () => {
      addSwipeEvent('LEFT')
      setCurrentIndex(prev => Math.min(prev + 1, 4)) // Max 5 items (0-4)
    },
    onSwipeRight: () => {
      addSwipeEvent('RIGHT')
      setCurrentIndex(prev => Math.max(prev - 1, 0))
    },
    enabled: true,
    minSwipeDistance: 50
  })

  return (
    <div style={{ 
      padding: '20px',
      maxWidth: '600px',
      margin: '0 auto',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>
        Swipe Gesture Test
      </h2>
      
      {/* Swipe Area */}
      <div
        {...swipeHandlers}
        style={{
          width: '100%',
          height: '300px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '24px',
          fontWeight: 'bold',
          marginBottom: '20px',
          cursor: 'grab',
          userSelect: 'none',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div>👆 Swipe Left or Right 👆</div>
          <div style={{ fontSize: '16px', marginTop: '10px', opacity: 0.8 }}>
            Current: {currentIndex + 1} / 5
          </div>
        </div>
        
        {/* Progress indicator */}
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '8px'
        }}>
          {[0, 1, 2, 3, 4].map(index => (
            <div
              key={index}
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: index === currentIndex ? 'white' : 'rgba(255, 255, 255, 0.3)',
                transition: 'all 0.3s ease'
              }}
            />
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div style={{
        background: '#f8f9fa',
        padding: '16px',
        borderRadius: '8px',
        marginBottom: '20px',
        fontSize: '14px',
        lineHeight: '1.5'
      }}>
        <strong>How to test:</strong>
        <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
          <li>On mobile: Swipe left/right with your finger on the colored area</li>
          <li>On desktop: You can simulate by dragging (though it&apos;s designed for touch)</li>
          <li>Watch the progress dots and swipe history below</li>
          <li>Check the browser console for detailed swipe logs</li>
        </ul>
      </div>

      {/* Swipe History */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '16px'
      }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>
          Recent Swipes:
        </h3>
        {swipeHistory.length === 0 ? (
          <p style={{ color: '#6b7280', margin: 0, fontStyle: 'italic' }}>
            No swipes detected yet...
          </p>
        ) : (
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {swipeHistory.map((event, index) => (
              <li 
                key={index}
                style={{
                  padding: '8px 0',
                  borderBottom: index < swipeHistory.length - 1 ? '1px solid #f3f4f6' : 'none',
                  fontSize: '14px',
                  color: '#374151'
                }}
              >
                {event}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Debug Info */}
      <div style={{
        marginTop: '20px',
        padding: '12px',
        background: '#fef3c7',
        borderRadius: '6px',
        fontSize: '12px',
        color: '#92400e'
      }}>
        <strong>Debug:</strong> Open browser console to see detailed swipe detection logs
      </div>
    </div>
  )
}

// Quick component to add to any page for testing
export function SwipeTestButton() {
  const [showTest, setShowTest] = useState(false)
  
  if (process.env.NODE_ENV !== 'development') return null
  
  return (
    <>
      <button
        onClick={() => setShowTest(!showTest)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          padding: '10px 15px',
          background: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontSize: '12px',
          cursor: 'pointer',
          zIndex: 1000
        }}
      >
        {showTest ? 'Hide' : 'Test'} Swipe
      </button>
      
      {showTest && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          zIndex: 999,
          overflow: 'auto'
        }}>
          <div style={{
            background: 'white',
            margin: '20px',
            borderRadius: '12px',
            padding: '20px'
          }}>
            <SwipeTest />
            <button
              onClick={() => setShowTest(false)}
              style={{
                width: '100%',
                padding: '12px',
                background: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                marginTop: '20px',
                cursor: 'pointer'
              }}
            >
              Close Test
            </button>
          </div>
        </div>
      )}
    </>
  )
}
