// src/components/project/ImageCarousel/CarouselConstants.tsx

export const CAROUSEL_CONFIG = {
  DEFAULT_BREAKPOINT: 768,
  LOADING_DELAY: 100,
  TRANSITION_DURATION: '0.3s',
  MAX_DESKTOP_WIDTH: '1400px',
  MOBILE_PADDING: '20px',
  DESKTOP_PADDING: '40px',
} as const

export const CAROUSEL_LAYOUT = {
  MOBILE: {
    paddingTop: '80px',
    paddingBottom: '60px',
    background: '#fafafa',
  },
  DESKTOP: {
    marginTop: '80px',
    maxWidth: CAROUSEL_CONFIG.MAX_DESKTOP_WIDTH,
  },
} as const

export const CAROUSEL_BREAKPOINTS = {
  MOBILE: 768,
  TABLET: 1024,
  DESKTOP: 1200,
} as const
