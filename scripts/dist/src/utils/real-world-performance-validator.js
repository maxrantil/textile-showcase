'use strict'
// ABOUTME: Real-world performance validation suite for production-ready testing
// Tests performance under realistic conditions with various user scenarios and network conditions
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod }
  }
Object.defineProperty(exports, '__esModule', { value: true })
exports.RealWorldPerformanceValidator = void 0
const child_process_1 = require('child_process')
const fs_1 = __importDefault(require('fs'))
const path_1 = __importDefault(require('path'))
const e2e_performance_validator_1 = require('./e2e-performance-validator')
const performance_budget_1 = require('./performance-budget')
// Real-world network conditions based on actual global data
const NETWORK_CONDITIONS = {
  // Developed markets - fast connections
  'fiber-broadband': { name: 'Fiber Broadband', rtt: 20, throughput: 100000 }, // 100 Mbps
  'cable-broadband': { name: 'Cable Broadband', rtt: 30, throughput: 50000 }, // 50 Mbps
  '5g-mobile': { name: '5G Mobile', rtt: 25, throughput: 20000 }, // 20 Mbps
  // Mixed markets - moderate connections
  'adsl-broadband': { name: 'ADSL Broadband', rtt: 50, throughput: 8000 }, // 8 Mbps
  '4g-mobile': { name: '4G Mobile', rtt: 70, throughput: 4000 }, // 4 Mbps
  'wifi-shared': { name: 'Shared WiFi', rtt: 100, throughput: 2000 }, // 2 Mbps
  // Developing markets - slower connections
  '3g-mobile': { name: '3G Mobile', rtt: 200, throughput: 1000 }, // 1 Mbps
  'edge-mobile': { name: 'EDGE Mobile', rtt: 500, throughput: 200 }, // 200 Kbps
  satellite: { name: 'Satellite Internet', rtt: 800, throughput: 1500 }, // 1.5 Mbps high latency
  // Challenging conditions
  'congested-network': {
    name: 'Congested Network',
    rtt: 300,
    throughput: 500,
    packetLoss: 2,
  },
  'poor-mobile': {
    name: 'Poor Mobile Signal',
    rtt: 1000,
    throughput: 100,
    packetLoss: 5,
  },
}
const REAL_WORLD_SCENARIOS = [
  // Critical business flow - Home page first impression
  {
    name: 'First Time Visitor - Home Page',
    description: 'New visitor discovering the textile showcase on mobile',
    userStory:
      'As a potential client, I want to quickly understand what services are offered',
    url: 'http://localhost:3000',
    device: 'mobile',
    networkCondition: NETWORK_CONDITIONS['4g-mobile'],
    userFlow: [
      { action: 'navigate' },
      { action: 'wait', duration: 3000 },
      { action: 'scroll', target: 'main-content', duration: 2000 },
    ],
    expectations: {
      maxLCP: 1000, // Critical for first impression
      maxCLS: 0.05, // No layout shifts on landing
      maxINP: 200, // Responsive interaction
      maxTTFB: 600, // Fast initial response
      minPerformanceScore: 0.98, // Excellent performance
      maxBundleSize: 1500000, // 1.5MB
    },
    businessMetrics: {
      bounceRateImpact: 15, // 15% increase if failing
      conversionImpact: 25, // 25% decrease in conversions
      seoImpact: 'high',
      userExperienceImpact: 'critical',
    },
  },
  // Core business flow - Project showcase
  {
    name: 'Project Discovery - Sustainable Packaging',
    description: 'Client exploring specific project details',
    userStory:
      'As a client, I want to see detailed project information to assess capabilities',
    url: 'http://localhost:3000/project/sustainable-packaging-solutions',
    device: 'desktop',
    networkCondition: NETWORK_CONDITIONS['cable-broadband'],
    userFlow: [
      { action: 'navigate' },
      { action: 'wait', duration: 2000 },
      { action: 'scroll', target: 'project-details', duration: 3000 },
      { action: 'click', target: 'image-gallery' },
      { action: 'wait', duration: 1000 },
    ],
    expectations: {
      maxLCP: 800, // Fast for desktop
      maxCLS: 0.03, // Minimal layout shift
      maxINP: 150, // Quick interactions
      maxTTFB: 400, // Fast server response
      minPerformanceScore: 0.99, // Excellent on desktop
      maxBundleSize: 1500000,
    },
    businessMetrics: {
      bounceRateImpact: 10,
      conversionImpact: 20,
      seoImpact: 'medium',
      userExperienceImpact: 'high',
    },
  },
  // Challenging condition - Slow network
  {
    name: 'Emerging Market Access - Contact Page',
    description:
      'Client from emerging market trying to contact via slow connection',
    userStory:
      'As a client with limited internet, I want to quickly find contact information',
    url: 'http://localhost:3000/contact',
    device: 'mobile',
    networkCondition: NETWORK_CONDITIONS['3g-mobile'],
    userFlow: [
      { action: 'navigate' },
      { action: 'wait', duration: 5000 }, // Longer wait for slow connection
      { action: 'scroll', target: 'contact-form', duration: 2000 },
      {
        action: 'form-fill',
        data: { email: 'test@example.com', message: 'Test inquiry' },
      },
    ],
    expectations: {
      maxLCP: 2000, // More lenient for slow network
      maxCLS: 0.08, // Slightly more lenient
      maxINP: 300, // Account for slow connection
      maxTTFB: 1000, // Slower acceptable TTFB
      minPerformanceScore: 0.85, // Lower but acceptable
      maxBundleSize: 1500000,
    },
    businessMetrics: {
      bounceRateImpact: 30, // High impact on slow connections
      conversionImpact: 40, // Significant conversion loss
      seoImpact: 'medium',
      userExperienceImpact: 'critical',
    },
  },
  // Edge case - Very poor connection
  {
    name: 'Emergency Network - About Page',
    description: 'Accessing company information under poor network conditions',
    userStory:
      'As a user with poor connection, I still need to access basic company info',
    url: 'http://localhost:3000/about',
    device: 'mobile',
    networkCondition: NETWORK_CONDITIONS['poor-mobile'],
    userFlow: [
      { action: 'navigate' },
      { action: 'wait', duration: 8000 }, // Long wait for poor connection
      { action: 'scroll', target: 'company-info', duration: 3000 },
    ],
    expectations: {
      maxLCP: 4000, // Very lenient but must still load
      maxCLS: 0.15, // Allow for loading issues
      maxINP: 500, // Very slow but responsive
      maxTTFB: 2000, // Very slow TTFB acceptable
      minPerformanceScore: 0.7, // Minimum acceptable
      maxBundleSize: 1500000,
    },
    businessMetrics: {
      bounceRateImpact: 50, // Very high impact
      conversionImpact: 60, // Major conversion loss
      seoImpact: 'low', // SEO less critical for this scenario
      userExperienceImpact: 'critical',
    },
  },
  // High-performance expectation - Desktop fiber
  {
    name: 'Enterprise Client - Desktop Fiber',
    description: 'High-end enterprise client with excellent connection',
    userStory:
      'As an enterprise client, I expect exceptional performance to match service quality',
    url: 'http://localhost:3000',
    device: 'desktop',
    networkCondition: NETWORK_CONDITIONS['fiber-broadband'],
    userFlow: [
      { action: 'navigate' },
      { action: 'wait', duration: 1000 },
      { action: 'scroll', target: 'services', duration: 2000 },
      { action: 'click', target: 'portfolio' },
      { action: 'wait', duration: 1000 },
    ],
    expectations: {
      maxLCP: 600, // Excellent performance expected
      maxCLS: 0.02, // Minimal layout shift
      maxINP: 100, // Instant responsiveness
      maxTTFB: 200, // Very fast response
      minPerformanceScore: 0.995, // Near perfect
      maxBundleSize: 1500000,
    },
    businessMetrics: {
      bounceRateImpact: 5, // Low but important for perception
      conversionImpact: 15, // Important for high-value clients
      seoImpact: 'high',
      userExperienceImpact: 'high',
    },
  },
]
class RealWorldPerformanceValidator {
  constructor() {
    this.e2eValidator =
      new e2e_performance_validator_1.E2EPerformanceValidator()
    this.budgetValidator = new performance_budget_1.PerformanceBudgetValidator({
      coreWebVitals: { lcp: 1000, cls: 0.05, inp: 200, fcp: 1000, ttfb: 600 },
      lighthouse: {
        performance: 0.98,
        accessibility: 0.95,
        bestPractices: 0.95,
        seo: 0.95,
      },
      bundleSize: {
        total: 1500000,
        gzipped: 450000,
        javascript: 800000,
        css: 100000,
        images: 500000,
        fonts: 200000,
      },
      validation: {
        enableStrictMode: true,
        enableAutoRollback: false,
        alertThreshold: 'error',
        requireRumValidation: false,
      },
      realUserMetrics: {
        minimumSampleSize: 100,
        acceptablePerformancePercentile: 75,
        maxRegressionTolerance: 10,
      },
    })
  }
  /**
   * Run comprehensive real-world performance validation
   */
  async validateRealWorldPerformance() {
    console.log('🌍 Starting real-world performance validation...')
    console.log(
      `📊 Testing ${REAL_WORLD_SCENARIOS.length} real-world scenarios`
    )
    const startTime = Date.now()
    const results = []
    try {
      // Build application
      console.log('🏗️  Building application for real-world testing...')
      await this.buildApplication()
      // Start server
      console.log('🚀 Starting application server...')
      const serverProcess = await this.startServer()
      try {
        // Test each scenario
        for (const scenario of REAL_WORLD_SCENARIOS) {
          console.log(`\n🧪 Testing: ${scenario.name}`)
          console.log(`   📱 Device: ${scenario.device}`)
          console.log(`   🌐 Network: ${scenario.networkCondition.name}`)
          const result = await this.runRealWorldScenario(scenario)
          results.push(result)
          const status = result.passed ? '✅' : '❌'
          const risk = result.businessImpact.overallRisk
          console.log(
            `   ${status} Result: ${result.passed ? 'PASSED' : 'FAILED'} (Risk: ${risk})`
          )
          if (!result.passed) {
            console.log(`   🚨 Violations: ${result.violations.length}`)
            result.violations.slice(0, 2).forEach((v) => {
              console.log(
                `      • ${v.metric}: ${v.actual} > ${v.expected} (${v.severity})`
              )
            })
          }
        }
      } finally {
        // Stop server
        console.log('\n🛑 Stopping application server...')
        serverProcess.kill('SIGTERM')
        await this.waitForProcessExit(serverProcess)
      }
      // Generate comprehensive report
      const report = this.generateRealWorldReport(
        results,
        Date.now() - startTime
      )
      console.log('\n' + '='.repeat(60))
      console.log('🌍 REAL-WORLD PERFORMANCE VALIDATION RESULTS')
      console.log('='.repeat(60))
      this.logValidationSummary(report)
      await this.saveRealWorldReport(report)
      return report
    } catch (error) {
      console.error('❌ Real-world validation failed:', error)
      throw error
    }
  }
  /**
   * Run a single real-world scenario
   */
  async runRealWorldScenario(scenario) {
    var _a,
      _b,
      _c,
      _d,
      _e,
      _f,
      _g,
      _h,
      _j,
      _k,
      _l,
      _m,
      _o,
      _p,
      _q,
      _r,
      _s,
      _t,
      _u,
      _v
    const startTime = Date.now()
    try {
      // Run Lighthouse with network throttling
      const lighthouseResult = await this.runLighthouseWithNetworkCondition(
        scenario.url,
        scenario.device,
        scenario.networkCondition
      )
      // Extract performance metrics
      const lhResult = lighthouseResult
      const actualMetrics = {
        lcp:
          ((_b =
            (_a = lhResult.audits) === null || _a === void 0
              ? void 0
              : _a['largest-contentful-paint']) === null || _b === void 0
            ? void 0
            : _b.numericValue) || 0,
        cls:
          ((_d =
            (_c = lhResult.audits) === null || _c === void 0
              ? void 0
              : _c['cumulative-layout-shift']) === null || _d === void 0
            ? void 0
            : _d.numericValue) || 0,
        inp:
          ((_f =
            (_e = lhResult.audits) === null || _e === void 0
              ? void 0
              : _e['interaction-to-next-paint']) === null || _f === void 0
            ? void 0
            : _f.numericValue) ||
          ((_h =
            (_g = lhResult.audits) === null || _g === void 0
              ? void 0
              : _g['max-potential-fid']) === null || _h === void 0
            ? void 0
            : _h.numericValue) ||
          0,
        ttfb:
          ((_k =
            (_j = lhResult.audits) === null || _j === void 0
              ? void 0
              : _j['server-response-time']) === null || _k === void 0
            ? void 0
            : _k.numericValue) || 0,
        performanceScore:
          ((_m =
            (_l = lhResult.categories) === null || _l === void 0
              ? void 0
              : _l.performance) === null || _m === void 0
            ? void 0
            : _m.score) || 0,
        bundleSize: await this.getBundleSize(),
      }
      // Extract user experience metrics
      const userExperience = {
        timeToInteractive:
          ((_p =
            (_o = lhResult.audits) === null || _o === void 0
              ? void 0
              : _o['interactive']) === null || _p === void 0
            ? void 0
            : _p.numericValue) || 0,
        firstInputDelay:
          ((_r =
            (_q = lhResult.audits) === null || _q === void 0
              ? void 0
              : _q['max-potential-fid']) === null || _r === void 0
            ? void 0
            : _r.numericValue) || 0,
        visuallyComplete:
          ((_t =
            (_s = lhResult.audits) === null || _s === void 0
              ? void 0
              : _s['speed-index']) === null || _t === void 0
            ? void 0
            : _t.numericValue) || 0,
        speedIndex:
          ((_v =
            (_u = lhResult.audits) === null || _u === void 0
              ? void 0
              : _u['speed-index']) === null || _v === void 0
            ? void 0
            : _v.numericValue) || 0,
      }
      // Validate against expectations
      const violations = this.validateScenarioExpectations(
        scenario,
        actualMetrics
      )
      // Calculate business impact
      const businessImpact = this.calculateBusinessImpact(scenario, violations)
      // Generate recommendations
      const recommendations = this.generateScenarioRecommendations(
        scenario,
        violations
      )
      const result = {
        scenario,
        timestamp: new Date().toISOString(),
        passed:
          violations.filter(
            (v) => v.severity === 'error' || v.severity === 'critical'
          ).length === 0,
        actualMetrics,
        userExperience,
        businessImpact,
        violations,
        recommendations,
        duration: Date.now() - startTime,
      }
      return result
    } catch (error) {
      throw new Error(`Scenario "${scenario.name}" failed: ${error}`)
    }
  }
  /**
   * Run Lighthouse with specific network conditions
   */
  async runLighthouseWithNetworkCondition(url, device, networkCondition) {
    return new Promise((resolve, reject) => {
      const args = [
        url,
        '--output=json',
        '--quiet',
        `--preset=${device}`,
        '--only-categories=performance,accessibility,best-practices,seo',
        `--throttling.rttMs=${networkCondition.rtt}`,
        `--throttling.throughputKbps=${networkCondition.throughput}`,
        '--throttling-method=simulate',
      ]
      // Add device-specific configuration
      if (device === 'mobile') {
        args.push('--emulated-form-factor=mobile')
        args.push('--chrome-flags="--disable-dev-shm-usage"')
      } else {
        args.push('--emulated-form-factor=desktop')
      }
      let output = ''
      const lighthouse = (0, child_process_1.spawn)(
        'npx',
        ['lighthouse', ...args],
        {
          stdio: ['pipe', 'pipe', 'pipe'],
        }
      )
      lighthouse.stdout.on('data', (data) => {
        output += data.toString()
      })
      lighthouse.on('close', (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(output)
            resolve(result)
          } catch (error) {
            reject(new Error(`Failed to parse Lighthouse output: ${error}`))
          }
        } else {
          reject(new Error(`Lighthouse failed with exit code ${code}`))
        }
      })
      setTimeout(() => {
        lighthouse.kill('SIGTERM')
        reject(new Error('Lighthouse audit timed out'))
      }, 120000) // 2 minutes timeout
    })
  }
  /**
   * Validate scenario expectations
   */
  validateScenarioExpectations(scenario, actualMetrics) {
    const violations = []
    const { expectations } = scenario
    // LCP validation
    if (actualMetrics.lcp > expectations.maxLCP) {
      const severity =
        actualMetrics.lcp > expectations.maxLCP * 2
          ? 'critical'
          : actualMetrics.lcp > expectations.maxLCP * 1.5
            ? 'error'
            : 'warning'
      violations.push({
        metric: 'Largest Contentful Paint',
        expected: expectations.maxLCP,
        actual: actualMetrics.lcp,
        severity,
        businessImpact: `Users may abandon page (${scenario.businessMetrics.bounceRateImpact}% bounce rate increase)`,
      })
    }
    // CLS validation
    if (actualMetrics.cls > expectations.maxCLS) {
      const severity =
        actualMetrics.cls > expectations.maxCLS * 3
          ? 'critical'
          : actualMetrics.cls > expectations.maxCLS * 2
            ? 'error'
            : 'warning'
      violations.push({
        metric: 'Cumulative Layout Shift',
        expected: expectations.maxCLS,
        actual: actualMetrics.cls,
        severity,
        businessImpact: `Poor user experience with unexpected layout shifts`,
      })
    }
    // INP validation
    if (actualMetrics.inp > expectations.maxINP) {
      const severity =
        actualMetrics.inp > expectations.maxINP * 2
          ? 'critical'
          : actualMetrics.inp > expectations.maxINP * 1.5
            ? 'error'
            : 'warning'
      violations.push({
        metric: 'Interaction to Next Paint',
        expected: expectations.maxINP,
        actual: actualMetrics.inp,
        severity,
        businessImpact: `Sluggish interactions may frustrate users`,
      })
    }
    // Performance Score validation
    if (actualMetrics.performanceScore < expectations.minPerformanceScore) {
      const deficit =
        expectations.minPerformanceScore - actualMetrics.performanceScore
      const severity =
        deficit > 0.1 ? 'critical' : deficit > 0.05 ? 'error' : 'warning'
      violations.push({
        metric: 'Performance Score',
        expected: expectations.minPerformanceScore,
        actual: actualMetrics.performanceScore,
        severity,
        businessImpact: `SEO ranking may be affected (${scenario.businessMetrics.seoImpact} impact)`,
      })
    }
    // TTFB validation
    if (actualMetrics.ttfb > expectations.maxTTFB) {
      const severity =
        actualMetrics.ttfb > expectations.maxTTFB * 2
          ? 'critical'
          : actualMetrics.ttfb > expectations.maxTTFB * 1.5
            ? 'error'
            : 'warning'
      violations.push({
        metric: 'Time to First Byte',
        expected: expectations.maxTTFB,
        actual: actualMetrics.ttfb,
        severity,
        businessImpact: `Slow server response affects perceived performance`,
      })
    }
    return violations
  }
  /**
   * Calculate business impact
   */
  calculateBusinessImpact(scenario, violations) {
    const criticalViolations = violations.filter(
      (v) => v.severity === 'critical'
    ).length
    const errorViolations = violations.filter(
      (v) => v.severity === 'error'
    ).length
    let overallRisk
    let estimatedBounceRateIncrease = 0
    let estimatedConversionDecrease = 0
    if (criticalViolations > 0) {
      overallRisk = 'critical'
      estimatedBounceRateIncrease = scenario.businessMetrics.bounceRateImpact
      estimatedConversionDecrease = scenario.businessMetrics.conversionImpact
    } else if (errorViolations > 0) {
      overallRisk = 'high'
      estimatedBounceRateIncrease =
        scenario.businessMetrics.bounceRateImpact * 0.7
      estimatedConversionDecrease =
        scenario.businessMetrics.conversionImpact * 0.7
    } else if (violations.length > 0) {
      overallRisk = 'medium'
      estimatedBounceRateIncrease =
        scenario.businessMetrics.bounceRateImpact * 0.3
      estimatedConversionDecrease =
        scenario.businessMetrics.conversionImpact * 0.3
    } else {
      overallRisk = 'low'
    }
    return {
      estimatedBounceRateIncrease,
      estimatedConversionDecrease,
      seoScore:
        violations.filter((v) => v.metric === 'Performance Score').length === 0
          ? 95
          : 70,
      overallRisk,
    }
  }
  /**
   * Generate scenario-specific recommendations
   */
  generateScenarioRecommendations(scenario, violations) {
    const recommendations = []
    violations.forEach((violation) => {
      switch (violation.metric) {
        case 'Largest Contentful Paint':
          if (violation.severity === 'critical') {
            recommendations.push({
              priority: 'critical',
              category: 'performance',
              recommendation:
                'Implement aggressive image optimization and preloading for critical above-the-fold content',
              estimatedImpact: '40-60% LCP improvement',
              implementationEffort: 'medium',
            })
          } else {
            recommendations.push({
              priority: 'high',
              category: 'performance',
              recommendation:
                'Optimize image loading and implement resource hints',
              estimatedImpact: '20-30% LCP improvement',
              implementationEffort: 'low',
            })
          }
          break
        case 'Cumulative Layout Shift':
          recommendations.push({
            priority: violation.severity === 'critical' ? 'critical' : 'high',
            category: 'ux',
            recommendation:
              'Add explicit size attributes to all images and reserve space for dynamic content',
            estimatedImpact: '80-95% CLS reduction',
            implementationEffort: 'low',
          })
          break
        case 'Performance Score':
          recommendations.push({
            priority: 'medium',
            category: 'business',
            recommendation:
              'Address all performance violations to improve SEO ranking and user experience',
            estimatedImpact: 'Improved search visibility and conversion rates',
            implementationEffort: 'medium',
          })
          break
      }
    })
    // Network-specific recommendations
    if (scenario.networkCondition.rtt > 200) {
      recommendations.push({
        priority: 'high',
        category: 'technical',
        recommendation:
          'Implement aggressive caching and CDN optimization for high-latency connections',
        estimatedImpact: '30-50% improvement for slow connections',
        implementationEffort: 'medium',
      })
    }
    return recommendations
  }
  /**
   * Generate comprehensive real-world report
   */
  generateRealWorldReport(results, duration) {
    const summary = {
      totalScenarios: results.length,
      passed: results.filter((r) => r.passed).length,
      failed: results.filter((r) => !r.passed).length,
      criticalFailures: results.filter((r) =>
        r.violations.some((v) => v.severity === 'critical')
      ).length,
      timestamp: new Date().toISOString(),
      duration,
    }
    // Calculate overall business impact
    const businessImpact = this.calculateOverallBusinessImpact(results)
    // Assess production readiness
    const readinessAssessment = this.assessProductionReadiness(results)
    return {
      summary,
      results,
      businessImpact,
      readinessAssessment,
    }
  }
  /**
   * Calculate overall business impact
   */
  calculateOverallBusinessImpact(results) {
    const criticalResults = results.filter(
      (r) => r.businessImpact.overallRisk === 'critical'
    )
    const highRiskResults = results.filter(
      (r) => r.businessImpact.overallRisk === 'high'
    )
    let overallRisk
    if (criticalResults.length > 0) {
      overallRisk = 'critical'
    } else if (highRiskResults.length > 1) {
      overallRisk = 'high'
    } else if (highRiskResults.length > 0) {
      overallRisk = 'medium'
    } else {
      overallRisk = 'low'
    }
    // Generate priority recommendations
    const allRecommendations = results.flatMap((r) => r.recommendations)
    const criticalRecommendations = allRecommendations.filter(
      (r) => r.priority === 'critical'
    )
    const priorityRecommendations = criticalRecommendations
      .slice(0, 3)
      .map((rec) => ({
        category: rec.category,
        recommendation: rec.recommendation,
        businessJustification: rec.estimatedImpact,
        estimatedROI:
          rec.category === 'business'
            ? 'High - directly impacts conversion'
            : rec.category === 'ux'
              ? 'Medium - improves user satisfaction'
              : 'Medium - reduces bounce rate',
      }))
    return {
      overallRisk,
      estimatedRevenueImpact:
        overallRisk === 'critical'
          ? 'High - potential 20-40% revenue loss'
          : overallRisk === 'high'
            ? 'Medium - potential 10-20% revenue loss'
            : overallRisk === 'medium'
              ? 'Low - potential 5-10% revenue loss'
              : 'Minimal - less than 5% impact',
      priorityRecommendations,
    }
  }
  /**
   * Assess production readiness
   */
  assessProductionReadiness(results) {
    const criticalFailures = results.filter((r) =>
      r.violations.some((v) => v.severity === 'critical')
    )
    const highImpactFailures = results.filter(
      (r) =>
        r.businessImpact.overallRisk === 'critical' ||
        r.businessImpact.overallRisk === 'high'
    )
    const productionReady =
      criticalFailures.length === 0 && highImpactFailures.length <= 1
    const blockers = criticalFailures.map(
      (r) =>
        `${r.scenario.name}: ${r.violations
          .filter((v) => v.severity === 'critical')
          .map((v) => v.metric)
          .join(', ')}`
    )
    const recommendations = [
      ...(criticalFailures.length > 0
        ? [
            'Fix all critical performance violations before production deployment',
          ]
        : []),
      ...(highImpactFailures.length > 2
        ? ['Address high-impact scenarios to reduce business risk']
        : []),
      'Implement continuous performance monitoring in production',
      'Set up alerts for performance regressions',
    ]
    const nextSteps = productionReady
      ? [
          'Deploy to staging environment for final validation',
          'Configure production monitoring and alerting',
          'Plan performance optimization roadmap for continuous improvement',
        ]
      : [
          'Address critical performance issues identified in testing',
          'Re-run validation after fixes are implemented',
          'Consider phased rollout to limit business impact',
        ]
    return {
      productionReady,
      blockers,
      recommendations,
      nextSteps,
    }
  }
  /**
   * Log validation summary
   */
  logValidationSummary(report) {
    const { summary, businessImpact, readinessAssessment } = report
    console.log(
      `📊 Summary: ${summary.passed}/${summary.totalScenarios} scenarios passed`
    )
    console.log(`⏱️  Duration: ${Math.round(summary.duration / 1000)}s`)
    console.log(`🏢 Business Risk: ${businessImpact.overallRisk.toUpperCase()}`)
    console.log(
      `🚀 Production Ready: ${readinessAssessment.productionReady ? 'YES' : 'NO'}`
    )
    if (summary.criticalFailures > 0) {
      console.log(`\n🚨 Critical Failures: ${summary.criticalFailures}`)
    }
    if (!readinessAssessment.productionReady) {
      console.log(`\n🛑 Blockers:`)
      readinessAssessment.blockers.forEach((blocker) => {
        console.log(`   • ${blocker}`)
      })
    }
    if (businessImpact.priorityRecommendations.length > 0) {
      console.log(`\n💡 Priority Recommendations:`)
      businessImpact.priorityRecommendations.forEach((rec) => {
        console.log(`   • ${rec.recommendation}`)
      })
    }
    console.log(
      `\n📄 Detailed report saved to: ./real-world-performance-report.json`
    )
  }
  /**
   * Save real-world report
   */
  async saveRealWorldReport(report) {
    const reportPath = './real-world-performance-report.json'
    fs_1.default.writeFileSync(reportPath, JSON.stringify(report, null, 2))
    // Also generate markdown summary
    const markdownPath = './real-world-performance-summary.md'
    const markdown = this.generateMarkdownSummary(report)
    fs_1.default.writeFileSync(markdownPath, markdown)
  }
  /**
   * Generate markdown summary
   */
  generateMarkdownSummary(report) {
    const { summary, businessImpact, readinessAssessment } = report
    return `# Real-World Performance Validation Report

**Generated**: ${summary.timestamp}
**Duration**: ${Math.round(summary.duration / 1000)}s
**Production Ready**: ${readinessAssessment.productionReady ? '✅ YES' : '❌ NO'}

## Summary

- **Total Scenarios**: ${summary.totalScenarios}
- **Passed**: ${summary.passed}
- **Failed**: ${summary.failed}
- **Critical Failures**: ${summary.criticalFailures}

## Business Impact

**Overall Risk**: ${businessImpact.overallRisk.toUpperCase()}
**Revenue Impact**: ${businessImpact.estimatedRevenueImpact}

${
  businessImpact.priorityRecommendations.length > 0
    ? `
### Priority Recommendations

${businessImpact.priorityRecommendations
  .map(
    (rec) => `
- **${rec.category.toUpperCase()}**: ${rec.recommendation}
  - Business Justification: ${rec.businessJustification}
  - Estimated ROI: ${rec.estimatedROI}
`
  )
  .join('')}
`
    : ''
}

## Production Readiness

${
  readinessAssessment.blockers.length > 0
    ? `
### Blockers
${readinessAssessment.blockers.map((blocker) => `- ❌ ${blocker}`).join('\n')}
`
    : ''
}

### Recommendations
${readinessAssessment.recommendations.map((rec) => `- 💡 ${rec}`).join('\n')}

### Next Steps
${readinessAssessment.nextSteps.map((step) => `- 📋 ${step}`).join('\n')}

## Scenario Results

${report.results
  .map(
    (result) => `
### ${result.scenario.name} ${result.passed ? '✅' : '❌'}

**Device**: ${result.scenario.device} | **Network**: ${result.scenario.networkCondition.name}
**Business Risk**: ${result.businessImpact.overallRisk.toUpperCase()}

**Performance Metrics**:
- LCP: ${result.actualMetrics.lcp}ms (target: ${result.scenario.expectations.maxLCP}ms)
- CLS: ${result.actualMetrics.cls.toFixed(3)} (target: ${result.scenario.expectations.maxCLS})
- Performance Score: ${(result.actualMetrics.performanceScore * 100).toFixed(1)}%

${
  result.violations.length > 0
    ? `
**Violations**:
${result.violations.map((v) => `- ${v.severity.toUpperCase()}: ${v.metric} - ${v.businessImpact}`).join('\n')}
`
    : ''
}
`
  )
  .join('')}

---

*Generated by Real-World Performance Validator*
`
  }
  // Utility methods
  async buildApplication() {
    return new Promise((resolve, reject) => {
      const build = (0, child_process_1.spawn)('npm', ['run', 'build'], {
        stdio: 'inherit',
      })
      build.on('close', (code) => {
        if (code === 0) resolve()
        else reject(new Error(`Build failed with exit code ${code}`))
      })
    })
  }

  async startServer() {
    return new Promise((resolve, reject) => {
      const server = (0, child_process_1.spawn)('npm', ['start'], {
        stdio: ['pipe', 'pipe', 'pipe'],
      })
      let output = ''
      server.stdout.on('data', (data) => {
        output += data.toString()
        if (output.includes('Ready on')) {
          setTimeout(() => resolve(server), 2000)
        }
      })
      setTimeout(() => {
        server.kill('SIGTERM')
        reject(new Error('Server startup timed out'))
      }, 30000)
    })
  }
  async getBundleSize() {
    try {
      const buildManifest = JSON.parse(
        fs_1.default.readFileSync('.next/build-manifest.json', 'utf8')
      )
      return Object.values(buildManifest.pages)
        .flat()
        .reduce((size, file) => {
          const filePath = path_1.default.join('.next', file)
          if (fs_1.default.existsSync(filePath)) {
            return size + fs_1.default.statSync(filePath).size
          }
          return size
        }, 0)
    } catch (_a) {
      return 1500000 // Default assumption
    }
  }
  waitForProcessExit(process) {
    return new Promise((resolve) => {
      process.on('exit', () => resolve())
      setTimeout(() => {
        if (!process.killed) process.kill('SIGKILL')
        resolve()
      }, 5000)
    })
  }
}
exports.RealWorldPerformanceValidator = RealWorldPerformanceValidator
