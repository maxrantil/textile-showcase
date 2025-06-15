// src/utils/analytics.ts

// Define analytics data interface
interface AnalyticsData {
  [key: string]: string | number | boolean | undefined
}

declare global {
  interface Window {
    umami?: {
      track: (event: string, data?: AnalyticsData) => void
    }
  }
}

export function trackEvent(eventName: string, data?: AnalyticsData) {
  if (typeof window !== 'undefined' && window.umami) {
    window.umami.track(eventName, data)
  }
}

// Events specific to your textile website
export const UmamiEvents = {
  // Gallery interactions
  viewProject: (projectTitle: string, projectYear?: number) =>
    trackEvent('project-view', {
      title: projectTitle,
      year: projectYear,
    }),

  // Gallery navigation - enhanced with method tracking
  galleryNavigation: (method: string, fromIndex: number, toIndex: number) =>
    trackEvent('gallery-navigate', {
      method, // 'arrow-left', 'arrow-right', 'keyboard-left', 'keyboard-right', 'swipe-left', 'swipe-right', 'dot-click'
      from: fromIndex,
      to: toIndex,
    }),

  // Device-specific tracking
  trackEvent: (eventName: string, data?: AnalyticsData) => {
    const deviceType = window.innerWidth < 768 ? 'mobile' : 'desktop'
    trackEvent(eventName, { ...data, deviceType })
  },

  // Form field interactions
  formFieldFocus: (fieldName: string) =>
    trackEvent('form-field-focus', { field: fieldName }),

  formFieldBlur: (fieldName: string, hasValue: boolean) =>
    trackEvent('form-field-blur', { field: fieldName, hasValue }),

  // Image loading
  imageLoadSuccess: (imageName: string, loadTime: number) =>
    trackEvent('image-load-success', { image: imageName, loadTime }),

  imageLoadError: (imageName: string) =>
    trackEvent('image-load-error', { image: imageName }),

  // User engagement
  userScroll: (depth: number) => trackEvent('user-scroll', { depth }),

  timeOnPage: (seconds: number, page: string) =>
    trackEvent('time-on-page', { seconds, page }),

  // Contact form
  contactFormSubmit: () => trackEvent('contact-form-submit'),
  contactFormSuccess: () => trackEvent('contact-form-success'),
  contactFormError: () => trackEvent('contact-form-error'),

  // Page navigation
  navigateToAbout: () => trackEvent('navigate-about'),
  navigateToContact: () => trackEvent('navigate-contact'),
  navigateHome: () => trackEvent('navigate-home'),
  backToGallery: () => trackEvent('back-to-gallery'),

  // Project page interactions
  projectImageView: (projectTitle: string, imageNumber: number) =>
    trackEvent('project-image-view', {
      project: projectTitle,
      image: imageNumber,
    }),

  // Project page navigation
  projectNavigation: (direction: 'previous' | 'next', projectTitle: string) =>
    trackEvent('project-navigate', {
      direction,
      project: projectTitle,
    }),

  // Mobile menu interactions
  mobileMenuOpen: () => trackEvent('mobile-menu-open'),
  mobileMenuClose: (method: 'click' | 'backdrop' | 'keyboard') =>
    trackEvent('mobile-menu-close', { method }),
  mobileMenuToggle: (action: 'open' | 'close') =>
    trackEvent('mobile-menu-toggle', { action }),
}
