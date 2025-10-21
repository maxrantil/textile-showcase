// ABOUTME: Mobile environment simulation utilities for testing

/**
 * Sets up a mobile-like test environment with viewport, touch support, and APIs
 */
export const setupMobileEnvironment = () => {
  // Set mobile viewport dimensions (iPhone SE size)
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 375,
  })

  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: 667,
  })

  // Add touch support
  Object.defineProperty(window, 'ontouchstart', {
    writable: true,
    configurable: true,
    value: () => {},
  })

  // Mock matchMedia for mobile media queries
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches: query.includes('max-width: 768px'),
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  })

  // Mock navigator.vibrate for haptic feedback
  Object.defineProperty(navigator, 'vibrate', {
    writable: true,
    configurable: true,
    value: jest.fn((pattern?: number | number[]) => {
      // Returns true if vibration is supported
      return true
    }),
  })

  // Mock navigator.userAgent for mobile detection
  Object.defineProperty(navigator, 'userAgent', {
    writable: true,
    configurable: true,
    value:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
  })

  // Mock screen orientation API
  Object.defineProperty(screen, 'orientation', {
    writable: true,
    configurable: true,
    value: {
      type: 'portrait-primary',
      angle: 0,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    },
  })

  // Mock visualViewport for virtual keyboard detection
  Object.defineProperty(window, 'visualViewport', {
    writable: true,
    configurable: true,
    value: {
      width: 375,
      height: 667,
      scale: 1,
      offsetLeft: 0,
      offsetTop: 0,
      pageLeft: 0,
      pageTop: 0,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    },
  })
}

/**
 * Tears down mobile environment and resets to desktop
 */
export const teardownMobileEnvironment = () => {
  // Reset to desktop viewport
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 1024,
  })

  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: 768,
  })

  // Remove touch support
  Object.defineProperty(window, 'ontouchstart', {
    writable: true,
    configurable: true,
    value: undefined,
  })

  // Reset matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  })
}

/**
 * Simulates virtual keyboard opening (reduces viewport height)
 */
export const simulateKeyboardOpen = (keyboardHeight: number = 300) => {
  if (window.visualViewport) {
    Object.defineProperty(window.visualViewport, 'height', {
      writable: true,
      configurable: true,
      value: 667 - keyboardHeight,
    })

    // Trigger resize event
    window.dispatchEvent(new Event('resize'))
  }
}

/**
 * Simulates virtual keyboard closing (restores viewport height)
 */
export const simulateKeyboardClose = () => {
  if (window.visualViewport) {
    Object.defineProperty(window.visualViewport, 'height', {
      writable: true,
      configurable: true,
      value: 667,
    })

    // Trigger resize event
    window.dispatchEvent(new Event('resize'))
  }
}

/**
 * Sets device orientation
 */
export const setOrientation = (
  orientation: 'portrait' | 'landscape',
  angle: number = 0
) => {
  const orientationType =
    orientation === 'portrait' ? 'portrait-primary' : 'landscape-primary'

  Object.defineProperty(screen, 'orientation', {
    writable: true,
    configurable: true,
    value: {
      type: orientationType,
      angle,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    },
  })

  // Swap width/height for landscape
  if (orientation === 'landscape') {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 667,
    })
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 375,
    })
  }

  // Trigger orientationchange event
  window.dispatchEvent(new Event('orientationchange'))
}
