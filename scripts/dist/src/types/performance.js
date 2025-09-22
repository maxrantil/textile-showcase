'use strict'
// ABOUTME: TypeScript types for performance monitoring system with RUM and Core Web Vitals tracking
// Provides comprehensive type definitions for textile-showcase performance infrastructure
Object.defineProperty(exports, '__esModule', { value: true })
exports.DEFAULT_PERFORMANCE_BUDGET =
  exports.DEFAULT_CORE_WEB_VITALS_THRESHOLDS = void 0
/**
 * Default Core Web Vitals thresholds based on Google recommendations
 */
exports.DEFAULT_CORE_WEB_VITALS_THRESHOLDS = {
  LCP: {
    good: 2500,
    needsImprovement: 4000,
    poor: Infinity,
  },
  FID: {
    good: 100,
    needsImprovement: 300,
    poor: Infinity,
  },
  CLS: {
    good: 0.1,
    needsImprovement: 0.25,
    poor: Infinity,
  },
  FCP: {
    good: 1800,
    needsImprovement: 3000,
    poor: Infinity,
  },
  TTFB: {
    good: 800,
    needsImprovement: 1800,
    poor: Infinity,
  },
}
/**
 * Default performance budget for textile-showcase
 */
exports.DEFAULT_PERFORMANCE_BUDGET = {
  resourceSizes: {
    totalSize: 1500000, // 1.5MB
    chunkSize: 250000, // 250KB
    imageSize: 500000, // 500KB
    fontsize: 100000, // 100KB
  },
  metrics: {
    lighthouseScore: 98,
    firstContentfulPaint: 1200,
    largestContentfulPaint: 1200,
    timeToInteractive: 2000,
    cumulativeLayoutShift: 0.1,
    firstInputDelay: 100,
  },
  networkConditions: {
    type: '4g',
    downloadSpeed: 1600,
    uploadSpeed: 750,
    rtt: 150,
  },
}
