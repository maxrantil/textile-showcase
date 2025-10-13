// ABOUTME: Centralized constants and configuration for OptimizedImage component

import type React from 'react'

// Timeouts (milliseconds)
export const FALLBACK_TIMEOUT_MS = 3000

// Transition timing
export const FADE_IN_DURATION = '0.6s'
export const FADE_IN_TIMING = 'cubic-bezier(0.4, 0, 0.2, 1)'

// Size thresholds
export const LARGE_IMAGE_THRESHOLD = 600

// Image quality values
export const PRIMARY_IMAGE_QUALITY = 85
export const FALLBACK_IMAGE_QUALITY = 80
export const BLUR_PLACEHOLDER_QUALITY = 20

// Blur placeholder dimensions
export const BLUR_WIDTH = 20
export const BLUR_HEIGHT = 15

// Error UI styles
export const ERROR_CONTAINER_STYLE: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  backgroundColor: '#f5f5f5',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexDirection: 'column',
  color: '#666',
  padding: '16px',
  textAlign: 'center',
}

export const ERROR_ICON_STYLE: React.CSSProperties = {
  marginBottom: '8px',
  opacity: 0.5,
}

export const ERROR_TEXT_STYLE: React.CSSProperties = {
  fontSize: '12px',
  marginBottom: '8px',
}

export const RETRY_BUTTON_STYLE: React.CSSProperties = {
  padding: '4px 8px',
  fontSize: '10px',
  background: '#007bff',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
}

// Debug overlay styles
export const DEBUG_PRIORITY_BASE_STYLE: React.CSSProperties = {
  position: 'absolute',
  top: '4px',
  right: '4px',
  color: 'white',
  fontSize: '8px',
  padding: '1px 3px',
  borderRadius: '2px',
  zIndex: 10,
}

export const DEBUG_FALLBACK_STYLE: React.CSSProperties = {
  position: 'absolute',
  top: '4px',
  left: '4px',
  background: 'orange',
  color: 'white',
  fontSize: '10px',
  padding: '2px 4px',
  borderRadius: '2px',
  zIndex: 10,
}

// Debug overlay background colors
export const DEBUG_PRIORITY_COLORS = {
  high: 'red',
  low: 'blue',
  auto: 'green',
} as const

// Fade-in transition
export const getFadeInStyle = (isLoaded: boolean): React.CSSProperties => ({
  opacity: isLoaded ? 1 : 0,
  transition: `opacity ${FADE_IN_DURATION} ${FADE_IN_TIMING}`,
})
