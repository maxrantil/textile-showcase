// src/utils/mobileUtils.ts

// Define navigator extensions
interface NavigatorConnection {
  effectiveType?: '2g' | '3g' | '4g' | 'slow-2g'
  downlink?: number
  rtt?: number
}

interface NavigatorWithExtensions extends Navigator {
  connection?: NavigatorConnection
  deviceMemory?: number
}

// Viewport height fix for iOS Safari
export function setViewportHeight() {
    const vh = window.innerHeight * 0.01
    document.documentElement.style.setProperty('--vh', `${vh}px`)
  }
  
  // Detect iOS Safari and apply fixes
  export function detectIOSSafari() {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
    
    if (isIOS && isSafari) {
      document.body.classList.add('ios-safari')
      
      // Handle viewport changes
      window.addEventListener('resize', setViewportHeight)
      window.addEventListener('orientationchange', () => {
        setTimeout(setViewportHeight, 100)
      })
      
      setViewportHeight()
    }
  }
  
  // Touch device detection
  export function isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0
  }
  
  // Enhanced breakpoint detection
  export function getCurrentBreakpoint(): 'mobile' | 'tablet' | 'desktop' {
    const width = window.innerWidth
    if (width < 768) return 'mobile'
    if (width < 1024) return 'tablet'
    return 'desktop'
  }
  
  // Smooth scroll polyfill for older browsers
  export function smoothScrollTo(element: HTMLElement, offset: number = 0) {
    const targetPosition = element.offsetTop - offset
    
    if ('scrollBehavior' in document.documentElement.style) {
      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      })
    } else {
      // Polyfill for browsers without smooth scroll
      const startPosition = window.pageYOffset
      const distance = targetPosition - startPosition
      const duration = 500
      let start: number | null = null
  
      function animation(currentTime: number) {
        if (start === null) start = currentTime
        const timeElapsed = currentTime - start
        const run = easeInOutQuad(timeElapsed, startPosition, distance, duration)
        window.scrollTo(0, run)
        if (timeElapsed < duration) requestAnimationFrame(animation)
      }
  
      function easeInOutQuad(t: number, b: number, c: number, d: number) {
        t /= d / 2
        if (t < 1) return c / 2 * t * t + b
        t--
        return -c / 2 * (t * (t - 2) - 1) + b
      }
  
      requestAnimationFrame(animation)
    }
  }
  
  // Debounced resize handler
  export function createResizeHandler(callback: () => void, delay: number = 250) {
    let timeoutId: NodeJS.Timeout
    
    return function() {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(callback, delay)
    }
  }
  
  // Performance monitoring
  export class MobilePerformanceMonitor {
    private metrics: Map<string, number> = new Map()
    
    start(name: string) {
      this.metrics.set(name, performance.now())
    }
    
    end(name: string): number {
      const startTime = this.metrics.get(name)
      if (!startTime) return 0
      
      const duration = performance.now() - startTime
      this.metrics.delete(name)
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`📱 ${name}: ${duration.toFixed(2)}ms`)
      }
      
      return duration
    }
    
    // Check if device is low-end
    isLowEndDevice(): boolean {
      // Heuristics for low-end device detection
      const extendedNavigator = navigator as NavigatorWithExtensions
      const connection = extendedNavigator.connection
      const hardwareConcurrency = navigator.hardwareConcurrency || 1
      const deviceMemory = extendedNavigator.deviceMemory || 1
      
      return (
        hardwareConcurrency <= 2 ||
        deviceMemory <= 2 ||
        (connection?.effectiveType === 'slow-2g') ||
        (connection?.effectiveType === '2g')
      )
    }
  }
  
  // Image loading optimization
  export function optimizeImageLoading() {
    // Add intersection observer for lazy loading
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement
            if (img.dataset.src) {
              img.src = img.dataset.src
              img.removeAttribute('data-src')
              imageObserver.unobserve(img)
            }
          }
        })
      })
  
      document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img)
      })
    }
  }
  
  // Initialize all mobile enhancements
  export function initializeMobileEnhancements() {
    detectIOSSafari()
    optimizeImageLoading()
    
    // Add touch class for CSS
    if (isTouchDevice()) {
      document.body.classList.add('touch-device')
    }
    
    // Add breakpoint class for debugging
    if (process.env.NODE_ENV === 'development') {
      const updateBreakpoint = () => {
        const breakpoint = getCurrentBreakpoint()
        document.body.className = document.body.className.replace(/breakpoint-\w+/, '')
        document.body.classList.add(`breakpoint-${breakpoint}`)
        document.body.setAttribute('data-breakpoint', breakpoint)
      }
      
      updateBreakpoint()
      window.addEventListener('resize', createResizeHandler(updateBreakpoint))
    }
  }
