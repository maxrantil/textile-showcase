# Product Design Requirements: Critical Performance Optimization

**Document Version**: 1.0
**Created**: 2025-09-25
**PRD Reference**: PRD-lighthouse-performance-optimization-2025-09-25.md v2.0
**Status**: Ready for Implementation
**Priority**: 🚨 CRITICAL - Production Blocking

---

## Executive Summary

This PDR provides detailed technical specifications to resolve critical performance issues identified in fresh Lighthouse audit: **NULL performance score**, **3.65s LCP**, and **659KB unused JavaScript**. Based on comprehensive agent analysis, this document outlines a **low-risk, high-impact approach** achieving **55-70% LCP improvement** through proven webpack optimizations.

**Key Insight**: Current 97-chunk strategy is counterproductive. Solution focuses on **bundle consolidation + tree shaking** rather than aggressive splitting.

---

## Technical Architecture

### System Overview

```
Current State → Target State

Bundle Strategy:
- 97 chunks (over-fragmented) → 4 strategic chunks
- 4.27MB total → <2MB target
- 659KB unused JS → <150KB unused JS
- NULL performance → 95+ score

Loading Strategy:
- Synchronous Sanity Studio → Async route isolation
- Monolithic vendor chunks → Logical grouping
- No tree shaking optimization → Advanced elimination
```

### Component Architecture

```typescript
// Strategic Bundle Architecture
interface OptimizedBundleStrategy {
  framework: {
    content: ['react', 'react-dom', 'next']
    size: '<200KB'
    priority: 'critical'
  }

  sanity: {
    content: ['@sanity/*', 'sanity', 'next-sanity']
    size: '<300KB'
    loading: 'route-isolated'
  }

  vendor: {
    content: ['styled-components', 'other node_modules']
    size: '<250KB'
    priority: 'high'
  }

  application: {
    content: ['src/app/**', 'src/components/**']
    size: '<200KB'
    splitting: 'route-based'
  }
}
```

---

## Implementation Specifications

### Phase 1: Bundle Consolidation (Days 1-2)

#### 1.1 Webpack Configuration Enhancement

**File**: `next.config.ts`

```typescript
import type { NextConfig } from 'next'
import { bundleOptimizationConfig } from './config/webpack.optimization'

const nextConfig: NextConfig = {
  // ... existing config

  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      // Replace current aggressive splitting with strategic consolidation
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          maxInitialRequests: 4, // Reduced from current 8+
          maxAsyncRequests: 8, // Reduced from current 20+
          minSize: 30000, // 30KB minimum
          maxSize: 300000, // 300KB maximum per chunk

          cacheGroups: {
            // CRITICAL: Framework chunk (highest priority)
            framework: {
              test: /[\\/]node_modules[\\/](react|react-dom|next)[\\/]/,
              name: 'framework',
              priority: 50,
              chunks: 'all',
              enforce: true,
              maxSize: 200000, // 200KB limit
            },

            // Sanity CMS isolation (route-specific loading)
            sanity: {
              test: /[\\/]node_modules[\\/](sanity|@sanity|next-sanity)[\\/]/,
              name: 'sanity',
              priority: 40,
              chunks: 'async', // Only load when needed
              enforce: true,
              maxSize: 300000, // 300KB limit
            },

            // Styled Components (CSS-in-JS)
            styledComponents: {
              test: /[\\/]node_modules[\\/](styled-components|react-is)[\\/]/,
              name: 'styled-system',
              priority: 35,
              chunks: 'all',
              enforce: true,
              maxSize: 150000, // 150KB limit
            },

            // Other vendor libraries (consolidated)
            vendor: {
              test: /[\\/]node_modules[\\/](?!(react|react-dom|next|sanity|@sanity|styled-components)).*[\\/]/,
              name: 'vendor',
              priority: 20,
              chunks: 'all',
              maxSize: 250000, // 250KB limit
              minChunks: 1,
            },

            // Application code (route-based splitting)
            default: {
              name: 'application',
              priority: 10,
              minChunks: 2,
              maxSize: 200000, // 200KB limit
              reuseExistingChunk: true,
            },
          },
        },

        // Enhanced tree shaking
        usedExports: true,
        innerGraph: true, // Advanced tree shaking
        sideEffects: false,
        providedExports: true,

        // Module concatenation for better performance
        concatenateModules: true,
      }

      // Tree shaking for specific libraries
      config.resolve.alias = {
        ...config.resolve.alias,
        // Ensure tree-shakable imports
        '@sanity/client': '@sanity/client/dist/index.browser.js',
      }
    }

    return config
  },

  // Enhanced build optimization
  experimental: {
    optimizePackageImports: [
      '@sanity/client',
      'styled-components',
      'next-sanity',
    ],
  },
}

export default nextConfig
```

#### 1.2 Tree Shaking Enhancement

**File**: `config/webpack.optimization.ts` (new)

```typescript
// ABOUTME: Advanced tree shaking configuration for unused JavaScript elimination
import type { Configuration } from 'webpack'

export const treeShakingConfig: Partial<Configuration> = {
  // Eliminate unused exports
  optimization: {
    usedExports: true,
    innerGraph: true, // Enable advanced dependency analysis
    sideEffects: [
      '*.css', // CSS files have side effects
      '@sanity/ui/dist/**', // Sanity UI has styling side effects
      'sanity/dist/**', // Sanity has initialization side effects
    ],
    providedExports: true,
  },

  // Module resolution for tree shaking
  resolve: {
    mainFields: ['browser', 'module', 'main'],
    alias: {
      // Use ES modules for better tree shaking
      '@sanity/client$': '@sanity/client/dist/index.browser.js',
      'styled-components': 'styled-components/dist/styled-components.esm.js',
    },
  },

  // Define plugin for dead code elimination
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production'),
      'process.env.SANITY_STUDIO_ENABLED': JSON.stringify(false), // Remove studio code from public pages
    }),
  ],
}

// Bundle analysis configuration
export const bundleAnalysisConfig = {
  // Lighthouse CI integration
  performance: {
    maxAssetSize: 300000, // 300KB per asset
    maxEntrypointSize: 800000, // 800KB total initial
    hints: 'error',
  },

  // Bundle size validation
  validation: {
    totalSize: 2000000, // 2MB total limit
    initialJS: 500000, // 500KB initial JavaScript
    unusedThreshold: 150000, // 150KB unused code limit
  },
}
```

### Phase 2: Sanity Studio Isolation (Day 3)

#### 2.1 Studio Route Isolation

**File**: `src/app/studio/[[...index]]/page.tsx`

```typescript
// ABOUTME: Complete Sanity Studio isolation with async loading
import dynamic from 'next/dynamic'
import { Suspense } from 'react'

// Studio loading component
function StudioLoader() {
  return (
    <div className="studio-loader">
      <div className="loading-spinner" />
      <p>Loading Sanity Studio...</p>
      <style jsx>{`
        .studio-loader {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: #f1f3f6;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e1e5e9;
          border-top: 4px solid #2276fc;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

// Dynamic import with complete isolation
const StudioApp = dynamic(
  () => import('../../../components/studio/StudioApp').then(mod => ({
    default: mod.StudioApp
  })),
  {
    ssr: false,           // Disable SSR for studio
    loading: StudioLoader, // Show loading component
  }
)

// Studio page metadata
export const metadata = {
  title: 'Content Studio',
  robots: 'noindex, nofollow', // Prevent indexing
}

// Disable static generation for studio
export const dynamic = 'force-dynamic'

export default function StudioPage() {
  return (
    <Suspense fallback={<StudioLoader />}>
      <StudioApp />
    </Suspense>
  )
}
```

#### 2.2 Studio Component Refactor

**File**: `src/components/studio/StudioApp.tsx` (refactored)

```typescript
// ABOUTME: Isolated Sanity Studio application component
'use client'

import { lazy, Suspense } from 'react'
import { ErrorBoundary } from 'react-error-boundary'

// Lazy load Sanity Studio dependencies
const Studio = lazy(() =>
  import('sanity').then(sanityModule => {
    // Only import when actually used
    return import('../../../sanity/config').then(configModule => ({
      default: () => sanityModule.Studio({
        config: configModule.config,
        // Studio-specific configuration
        unstable_globalStyles: true,
        scheme: 'light',
      })
    }))
  })
)

function StudioErrorFallback({ error }: { error: Error }) {
  return (
    <div className="studio-error">
      <h2>Studio Loading Error</h2>
      <p>Failed to load Sanity Studio: {error.message}</p>
      <button onClick={() => window.location.reload()}>
        Reload Studio
      </button>
    </div>
  )
}

function StudioLoadingFallback() {
  return (
    <div className="studio-loading">
      <div>Loading Studio Components...</div>
    </div>
  )
}

export function StudioApp() {
  return (
    <ErrorBoundary FallbackComponent={StudioErrorFallback}>
      <Suspense fallback={<StudioLoadingFallback />}>
        <Studio />
      </Suspense>
    </ErrorBoundary>
  )
}
```

### Phase 3: Security Integration (Day 4)

#### 3.1 Enhanced CSP Configuration

**File**: `src/middleware.ts`

```typescript
// ABOUTME: Enhanced Content Security Policy for optimized bundles
import { NextRequest, NextResponse } from 'next/server'
import { generateSecureNonce } from './utils/security'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const nonce = generateSecureNonce()

  // Enhanced CSP for bundle splitting
  const cspDirectives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' https://cdn.sanity.io https://umami.is`,
    `script-src-elem 'self' 'nonce-${nonce}' https://cdn.sanity.io`, // Dynamic imports
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    `img-src 'self' https://cdn.sanity.io https://res.cloudinary.com data: blob:`,
    `font-src 'self' https://fonts.gstatic.com`,
    `connect-src 'self' https://api.resend.com https://cdn.sanity.io /api/performance`,
    `frame-ancestors 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `object-src 'none'`,
    `worker-src 'self'`,
    `manifest-src 'self'`,
  ]

  response.headers.set('Content-Security-Policy', cspDirectives.join('; '))
  response.headers.set('X-Performance-Script-Nonce', nonce)

  // Additional security headers for bundle integrity
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
```

#### 3.2 Bundle Integrity Validation

**File**: `src/utils/security.ts` (new)

```typescript
// ABOUTME: Security utilities for bundle optimization
import { createHash, randomBytes } from 'crypto'

// Generate cryptographically secure nonce
export function generateSecureNonce(): string {
  return randomBytes(16).toString('base64')
}

// Validate chunk integrity
export function validateChunkIntegrity(
  chunkContent: string,
  expectedHash?: string
): boolean {
  if (!expectedHash) return true

  const actualHash = createHash('sha384').update(chunkContent).digest('base64')

  return `sha384-${actualHash}` === expectedHash
}

// Monitor bundle loading performance
export function trackBundlePerformance(chunkName: string, loadTime: number) {
  // Integration with Phase 2C monitoring system
  if (typeof window !== 'undefined' && window.performanceMonitor) {
    window.performanceMonitor.trackCustomMetric({
      name: 'bundle_load_time',
      value: loadTime,
      labels: { chunk: chunkName },
      timestamp: Date.now(),
    })
  }
}
```

### Phase 4: Performance Monitoring Integration (Day 5)

#### 4.1 Performance Budget Validation

**File**: `scripts/bundle-performance-validation.js` (new)

```javascript
// ABOUTME: Automated performance budget validation for optimized bundles
const fs = require('fs')
const path = require('path')

// Performance budget thresholds
const PERFORMANCE_BUDGETS = {
  totalBundleSize: 2 * 1024 * 1024, // 2MB total
  initialJavaScript: 500 * 1024, // 500KB initial JS
  largestChunk: 300 * 1024, // 300KB per chunk
  unusedJavaScript: 150 * 1024, // 150KB unused threshold
  chunkCount: 8, // Maximum chunk count
}

async function validateBundlePerformance() {
  const buildDir = path.join(process.cwd(), '.next')
  const buildManifest = JSON.parse(
    fs.readFileSync(path.join(buildDir, 'build-manifest.json'), 'utf8')
  )

  let totalSize = 0
  let initialSize = 0
  let largestChunk = 0
  let chunkCount = 0

  // Analyze all JavaScript chunks
  for (const [page, chunks] of Object.entries(buildManifest.pages)) {
    for (const chunk of chunks) {
      if (chunk.endsWith('.js')) {
        const chunkPath = path.join(buildDir, 'static', 'chunks', chunk)
        if (fs.existsSync(chunkPath)) {
          const stats = fs.statSync(chunkPath)
          totalSize += stats.size
          chunkCount++

          if (stats.size > largestChunk) {
            largestChunk = stats.size
          }

          // Count initial chunks (non-async)
          if (page === '/_app' || page === '/') {
            initialSize += stats.size
          }
        }
      }
    }
  }

  // Validation results
  const results = {
    totalBundleSize: {
      actual: totalSize,
      budget: PERFORMANCE_BUDGETS.totalBundleSize,
      passed: totalSize <= PERFORMANCE_BUDGETS.totalBundleSize,
    },
    initialJavaScript: {
      actual: initialSize,
      budget: PERFORMANCE_BUDGETS.initialJavaScript,
      passed: initialSize <= PERFORMANCE_BUDGETS.initialJavaScript,
    },
    largestChunk: {
      actual: largestChunk,
      budget: PERFORMANCE_BUDGETS.largestChunk,
      passed: largestChunk <= PERFORMANCE_BUDGETS.largestChunk,
    },
    chunkCount: {
      actual: chunkCount,
      budget: PERFORMANCE_BUDGETS.chunkCount,
      passed: chunkCount <= PERFORMANCE_BUDGETS.chunkCount,
    },
  }

  // Report results
  console.log('Bundle Performance Validation Results:')
  console.log('=====================================')

  let allPassed = true
  for (const [metric, result] of Object.entries(results)) {
    const status = result.passed ? '✅ PASS' : '❌ FAIL'
    const actual = formatBytes(result.actual)
    const budget = formatBytes(result.budget)

    console.log(`${metric}: ${status} (${actual} / ${budget})`)
    if (!result.passed) allPassed = false
  }

  if (!allPassed) {
    console.error('\nBundle performance validation failed!')
    process.exit(1)
  }

  console.log('\n✅ All performance budgets passed!')
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Run validation
validateBundlePerformance().catch(console.error)
```

#### 4.2 Lighthouse CI Integration

**File**: `lighthouserc.advanced.js` (enhanced)

```javascript
// ABOUTME: Enhanced Lighthouse CI configuration for performance optimization validation
module.exports = {
  ci: {
    collect: {
      numberOfRuns: 3,
      startServerCommand: 'npm run build && npm start',
      startServerReadyPattern: 'Ready in',
      startServerReadyTimeout: 45000, // Increased for build optimization

      url: [
        'http://localhost:3000',
        'http://localhost:3000/project/what-if-the-future-is-made-of-salt',
        'http://localhost:3000/contact',
        'http://localhost:3000/about',
      ],

      settings: {
        chromeFlags: [
          '--no-sandbox',
          '--disable-gpu',
          '--disable-dev-shm-usage',
          '--disable-web-security',
        ],

        // Enhanced throttling for realistic testing
        throttling: {
          rttMs: 150,
          throughputKbps: 1600,
          cpuSlowdownMultiplier: 4,
        },

        formFactor: 'desktop',
        screenEmulation: {
          mobile: false,
          width: 1350,
          height: 940,
          deviceScaleFactor: 1,
          disabled: false,
        },
      },
    },

    assert: {
      assertions: {
        // Enhanced performance targets
        'categories:performance': ['error', { minScore: 0.95 }], // 95+ target
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],

        // Critical Web Vitals (optimized targets)
        'largest-contentful-paint': ['error', { maxNumericValue: 1200 }], // <1.2s
        'first-contentful-paint': ['error', { maxNumericValue: 800 }], // <800ms
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }], // <0.1
        'total-blocking-time': ['error', { maxNumericValue: 150 }], // <150ms
        'speed-index': ['error', { maxNumericValue: 1300 }], // <1.3s

        // Bundle optimization validation
        'total-byte-weight': ['error', { maxNumericValue: 2000000 }], // 2MB total
        'unused-javascript': ['error', { maxNumericValue: 150000 }], // 150KB unused
        'unused-css-rules': ['warn', { maxNumericValue: 20000 }], // 20KB unused CSS

        // Network efficiency
        'uses-text-compression': ['error', { maxNumericValue: 0 }],
        'uses-rel-preconnect': ['warn', { maxNumericValue: 500 }],

        // Security validation
        'uses-https': ['error', { minScore: 1 }],
        'no-vulnerable-libraries': ['error', { minScore: 1 }],
      },
    },

    upload: {
      target: 'filesystem',
      outputDir: './lighthouse-results',
    },
  },
}
```

---

## Implementation Timeline

### **Day 1-2: Bundle Consolidation** ⏱️

**Priority**: CRITICAL
**Risk**: LOW
**Expected Impact**: 40-60% LCP improvement

- [ ] Implement webpack bundle consolidation strategy
- [ ] Configure enhanced tree shaking
- [ ] Validate bundle size reduction
- [ ] Run performance regression tests

**Success Criteria**:

- Bundle size: 4.27MB → <2.5MB
- Chunk count: 97 → <8 chunks
- Unused JavaScript: 659KB → <300KB

### **Day 3: Sanity Studio Isolation** ⏱️

**Priority**: HIGH
**Risk**: MODERATE
**Expected Impact**: 20-30% additional LCP improvement

- [ ] Implement dynamic studio loading
- [ ] Create route-level isolation
- [ ] Test studio functionality
- [ ] Validate public page performance

**Success Criteria**:

- Studio code removed from public bundles
- Studio route loads independently
- No functionality regression

### **Day 4: Security Integration** ⏱️

**Priority**: HIGH
**Risk**: MODERATE
**Expected Impact**: Security compliance maintained

- [ ] Implement enhanced CSP configuration
- [ ] Add bundle integrity validation
- [ ] Test security headers
- [ ] Validate CSP compliance

**Success Criteria**:

- No CSP violations with new bundles
- Security headers functional
- Bundle loading secure

### **Day 5: Performance Monitoring** ⏱️

**Priority**: MEDIUM
**Risk**: LOW
**Expected Impact**: Monitoring and validation framework

- [ ] Integrate performance budget validation
- [ ] Enhance Lighthouse CI configuration
- [ ] Set up regression monitoring
- [ ] Document monitoring procedures

**Success Criteria**:

- Automated performance validation
- CI/CD integration complete
- Monitoring dashboard functional

---

## Success Criteria & Validation

### Performance Targets

| Metric                | Current | Target | Validation Method |
| --------------------- | ------- | ------ | ----------------- |
| **LCP**               | 3.65s   | <1.2s  | Lighthouse CI     |
| **FCP**               | 1.52s   | <0.8s  | Lighthouse CI     |
| **TBT**               | 204ms   | <150ms | Lighthouse CI     |
| **Performance Score** | NULL    | 95+    | Lighthouse CI     |
| **Bundle Size**       | 4.27MB  | <2MB   | Bundle analyzer   |
| **Unused JS**         | 659KB   | <150KB | Lighthouse audit  |

### Quality Gates

- [ ] **Bundle Performance**: All budgets pass validation
- [ ] **Security Compliance**: CSP violations = 0
- [ ] **Functionality**: All existing features work
- [ ] **Accessibility**: Score ≥95%
- [ ] **SEO**: Score ≥90%

### Rollback Criteria

**Immediate Rollback If**:

- Performance Score drops below current baseline
- Any security vulnerability introduced
- Critical functionality broken
- CSP violations >5% of requests

---

## Risk Management

### High-Risk Areas

1. **Bundle Splitting Complexity**

   - **Mitigation**: Conservative approach with 4 chunks max
   - **Validation**: Comprehensive testing before deployment
   - **Rollback**: Immediate revert capability

2. **Sanity Studio Isolation**

   - **Mitigation**: Thorough studio functionality testing
   - **Validation**: Admin workflow verification
   - **Rollback**: Route-level revert possible

3. **Security Policy Changes**
   - **Mitigation**: Staged CSP deployment with monitoring
   - **Validation**: Security header testing
   - **Rollback**: Previous middleware configuration preserved

### Monitoring & Alerting

**Real-time Alerts**:

- Performance regression >10%
- Bundle size increase >20%
- CSP violation rate >1%
- Error rate increase >5%

**Daily Monitoring**:

- Core Web Vitals trends
- Bundle size metrics
- Security compliance status
- User experience metrics

---

## Post-Implementation

### Maintenance Requirements

1. **Performance Budget Monitoring**

   - Weekly bundle size analysis
   - Monthly Lighthouse score reviews
   - Quarterly optimization reviews

2. **Security Maintenance**

   - CSP violation monitoring
   - Security header validation
   - Bundle integrity verification

3. **Dependency Management**
   - Regular tree shaking analysis
   - Unused code detection
   - Bundle optimization updates

### Future Enhancements

1. **React Server Components** (6 months)

   - Further bundle size reduction
   - Enhanced loading performance

2. **Edge Runtime Migration** (3 months)

   - Faster cold starts
   - Improved global performance

3. **Advanced Caching Strategy** (6 months)
   - Service worker implementation
   - Enhanced offline experience

---

**Document Approval**: ✅ Ready for Implementation
**Next Steps**: Create GitHub issue and begin Phase 1 implementation
**Estimated Completion**: 5 days from approval
**Success Probability**: HIGH (based on proven techniques and agent validation)
