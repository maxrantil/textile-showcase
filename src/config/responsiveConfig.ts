// src/config/responsiveConfig.ts - Config only, no hooks
export const RESPONSIVE_CONFIG = {
  breakpoints: {
    sm: 640,   // Mobile
    md: 768,   // Tablet
    lg: 1024,  // Desktop
    xl: 1280,  // Large desktop
  },
  gallery: {
    mobile: {
      itemHeight: 85,  // vh - larger for better mobile viewing
      gap: 30,         // px - smaller gaps for mobile
      padding: '20px', // Consistent edge padding
      navigationSize: 'medium',
      showArrows: false, // Hide arrows on mobile, use swipe
    },
    tablet: {
      itemHeight: 75,
      gap: 50,
      padding: '40px',
      navigationSize: 'large',
      showArrows: true,
    },
    desktop: {
      itemHeight: 70,
      gap: 80,
      padding: '45vw',
      navigationSize: 'large',
      showArrows: true,
    }
  },
  header: {
    mobile: { height: 60 },
    tablet: { height: 70 },
    desktop: { height: 80 },
  },
  typography: {
    // Fluid typography scales
    headingLarge: 'clamp(28px, 6vw, 48px)',
    headingMedium: 'clamp(24px, 5vw, 32px)',
    headingSmall: 'clamp(20px, 4vw, 24px)',
    bodyLarge: 'clamp(18px, 3vw, 20px)',
    bodyMedium: 'clamp(16px, 2.5vw, 18px)',
    bodySmall: 'clamp(14px, 2vw, 16px)',
  }
} as const

// Get responsive gallery config
export function getGalleryConfig(breakpoint: 'mobile' | 'tablet' | 'desktop') {
  return RESPONSIVE_CONFIG.gallery[breakpoint]
}
