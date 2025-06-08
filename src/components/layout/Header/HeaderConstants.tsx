// src/components/layout/Header/HeaderConstants.tsx

export const HEADER_CONFIG = {
  SCROLL_THRESHOLD: 10,
  HIDE_THRESHOLD: 100,
  ANIMATION_DURATION: '0.3s',
  BACKDROP_BLUR: '12px',
  MAX_WIDTH: '1400px',
} as const

export const HEADER_Z_INDEX = {
  HEADER: 50,
  MOBILE_MENU_BACKDROP: 998,
  MOBILE_MENU: 999,
} as const

export const HEADER_COLORS = {
  BACKGROUND_DEFAULT: 'rgba(255, 255, 255, 0.9)',
  BACKGROUND_SCROLLED: 'rgba(255, 255, 255, 0.95)',
  BORDER_DEFAULT: 'rgba(0, 0, 0, 0.05)',
  BORDER_SCROLLED: 'rgba(0, 0, 0, 0.1)',
  TEXT_PRIMARY: '#333',
  TEXT_HOVER: '#666',
} as const
