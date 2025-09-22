'use strict'
// ABOUTME: End-to-end performance validation system for comprehensive testing
// Orchestrates complete performance testing workflow with real-world scenarios
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod }
  }
Object.defineProperty(exports, '__esModule', { value: true })
exports.E2EPerformanceValidator = void 0
const child_process_1 = require('child_process')
const fs_1 = __importDefault(require('fs'))
const path_1 = __importDefault(require('path'))
const bundle_monitor_1 = require('./bundle-monitor')
const regression_detection_1 = require('./regression-detection')
const performance_budget_1 = require('./performance-budget')
const DEFAULT_E2E_CONFIG = {
  scenarios: [
    {
      name: 'Desktop - Home Page',
      url: 'http://localhost:3000',
      device: 'desktop',
      networkThrottling: 'no-throttling',
      viewport: { width: 1920, height: 1080 },
    },
    {
      name: 'Mobile - Home Page',
      url: 'http://localhost:3000',
      device: 'mobile',
      networkThrottling: 'fast-3g',
      viewport: { width: 375, height: 667 },
    },
    {
      name: 'Desktop - Project Page',
      url: 'http://localhost:3000/project/sustainable-packaging-solutions',
      device: 'desktop',
      networkThrottling: 'no-throttling',
      viewport: { width: 1920, height: 1080 },
    },
    {
      name: 'Mobile - Project Page',
      url: 'http://localhost:3000/project/sustainable-packaging-solutions',
      device: 'mobile',
      networkThrottling: 'fast-3g',
      viewport: { width: 375, height: 667 },
    },
    {
      name: 'Slow Network - Mobile',
      url: 'http://localhost:3000',
      device: 'mobile',
      networkThrottling: 'slow-3g',
      viewport: { width: 375, height: 667 },
    },
  ],
  thresholds: {
    lighthouse: {
      performance: 0.98, // 98%
      accessibility: 0.95, // 95%
      bestPractices: 0.95, // 95%
      seo: 0.95, // 95%
    },
    coreWebVitals: {
      lcp: 1000, // 1s - Phase 2C target
      cls: 0.05, // <0.05 - Phase 2C target
      inp: 200, // 200ms
      fcp: 1000, // 1s
      ttfb: 600, // 600ms
    },
    bundleSize: {
      total: 1500000, // 1.5MB
      gzipped: 450000, // 450KB
      javascript: 800000, // 800KB
      css: 100000, // 100KB
      images: 500000, // 500KB
      fonts: 200000, // 200KB
    },
  },
  testing: {
    iterations: 3,
    parallelRuns: 2,
    warmupRuns: 1,
    timeout: 60000,
    retryOnFailure: true,
    maxRetries: 2,
  },
  output: {
    reportDirectory: './e2e-performance-reports',
    formats: ['json', 'html', 'markdown'],
    includeRawData: true,
    screenshotOnFailure: true,
  },
}
class E2EPerformanceValidator {
  constructor(config = {}) {
    this.config = Object.assign(Object.assign({}, DEFAULT_E2E_CONFIG), config)
    // Initialize validation components
    this.bundleMonitor = new bundle_monitor_1.BundleMonitor(
      bundle_monitor_1.DEFAULT_BUNDLE_BUDGET
    )
    this.regressionDetector =
      new regression_detection_1.PerformanceRegressionDetector(
        regression_detection_1.DEFAULT_REGRESSION_THRESHOLDS
      )
    this.budgetValidator = new performance_budget_1.PerformanceBudgetValidator({
      coreWebVitals: this.config.thresholds.coreWebVitals,
      lighthouse: this.config.thresholds.lighthouse,
      bundleSize: Object.assign(
        Object.assign({}, this.config.thresholds.bundleSize),
        {
          images: this.config.thresholds.bundleSize.images,
          fonts: this.config.thresholds.bundleSize.fonts,
        }
      ),
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
   * Run complete end-to-end performance validation
   */
  async runE2EValidation() {
    const startTime = Date.now()
    console.log('🚀 Starting end-to-end performance validation...')
    // Ensure output directory exists
    this.ensureOutputDirectory()
    // Initialize report
    const report = {
      summary: {
        totalTests: 0,
        passed: 0,
        failed: 0,
        warnings: 0,
        duration: 0,
        timestamp: new Date().toISOString(),
      },
      scenarios: {},
      overall: {
        passed: false,
        score: 0,
        criticalIssues: [],
        recommendations: [],
      },
    }
    try {
      // 1. Build application for testing
      console.log('📦 Building application for performance testing...')
      await this.buildApplication()
      // 2. Start application server
      console.log('🌐 Starting application server...')
      const serverProcess = await this.startServer()
      try {
        // 3. Run tests for each scenario
        for (const scenario of this.config.scenarios) {
          console.log(`🧪 Testing scenario: ${scenario.name}`)
          const scenarioResults = await this.runScenarioTests(scenario)
          report.scenarios[scenario.name] = scenarioResults
          report.summary.totalTests += scenarioResults.results.length
          if (scenarioResults.passed) {
            report.summary.passed += scenarioResults.results.length
          } else {
            report.summary.failed += scenarioResults.results.filter(
              (r) => !r.passed
            ).length
            report.summary.passed += scenarioResults.results.filter(
              (r) => r.passed
            ).length
          }
          report.summary.warnings += scenarioResults.results.reduce(
            (sum, r) => sum + r.warnings.length,
            0
          )
        }
        // 4. Analyze overall results
        report.overall = this.analyzeOverallResults(report)
      } finally {
        // 5. Stop server
        console.log('🛑 Stopping application server...')
        serverProcess.kill('SIGTERM')
        await this.waitForProcessExit(serverProcess)
      }
      // 6. Generate reports
      report.summary.duration = Date.now() - startTime
      await this.generateReports(report)
      console.log(`✅ E2E validation completed in ${report.summary.duration}ms`)
      this.logSummary(report)
      return report
    } catch (error) {
      console.error('❌ E2E validation failed:', error)
      throw error
    }
  }
  /**
   * Run tests for a specific scenario
   */
  async runScenarioTests(scenario) {
    const results = []
    const failures = []
    // Run warmup iterations (not counted in results)
    for (let i = 0; i < this.config.testing.warmupRuns; i++) {
      console.log(`🔥 Warmup run ${i + 1}/${this.config.testing.warmupRuns}`)
      try {
        await this.runSingleTest(scenario, i, true)
      } catch (error) {
        console.warn(`Warmup run failed: ${error}`)
      }
    }
    // Run actual test iterations
    for (let i = 0; i < this.config.testing.iterations; i++) {
      let attempt = 0
      let testPassed = false
      while (attempt <= this.config.testing.maxRetries && !testPassed) {
        try {
          console.log(
            `📊 Test iteration ${i + 1}/${this.config.testing.iterations} (attempt ${attempt + 1})`
          )
          const result = await this.runSingleTest(scenario, i)
          results.push(result)
          testPassed = true
          if (!result.passed) {
            failures.push(
              `${scenario.name} iteration ${i + 1}: ${result.failures.join(', ')}`
            )
          }
        } catch (error) {
          attempt++
          const errorMessage = `Test failed (attempt ${attempt}): ${error}`
          if (
            attempt > this.config.testing.maxRetries ||
            !this.config.testing.retryOnFailure
          ) {
            failures.push(
              `${scenario.name} iteration ${i + 1}: ${errorMessage}`
            )
            // Create a failed result entry
            results.push({
              scenario: scenario.name,
              iteration: i,
              timestamp: new Date().toISOString(),
              lighthouse: {
                performance: 0,
                accessibility: 0,
                bestPractices: 0,
                seo: 0,
                audits: {},
              },
              coreWebVitals: { lcp: 0, cls: 0, inp: 0, fcp: 0, ttfb: 0 },
              bundleSize: {
                total: 0,
                gzipped: 0,
                javascript: 0,
                css: 0,
                assets: [],
              },
              device: scenario.device,
              networkThrottling: scenario.networkThrottling,
              passed: false,
              failures: [errorMessage],
              warnings: [],
              duration: 0,
            })
            testPassed = true // Stop retrying
          } else {
            console.warn(`Retrying test (attempt ${attempt + 1})...`)
            await this.sleep(2000) // Wait before retry
          }
        }
      }
    }
    // Calculate averages
    const validResults = results.filter((r) => r.passed)
    const averages =
      validResults.length > 0
        ? {
            lighthouse: {
              performance: this.average(
                validResults.map((r) => r.lighthouse.performance)
              ),
              accessibility: this.average(
                validResults.map((r) => r.lighthouse.accessibility)
              ),
              bestPractices: this.average(
                validResults.map((r) => r.lighthouse.bestPractices)
              ),
              seo: this.average(validResults.map((r) => r.lighthouse.seo)),
              audits: {},
            },
            coreWebVitals: {
              lcp: this.average(validResults.map((r) => r.coreWebVitals.lcp)),
              cls: this.average(validResults.map((r) => r.coreWebVitals.cls)),
              inp: this.average(validResults.map((r) => r.coreWebVitals.inp)),
              fcp: this.average(validResults.map((r) => r.coreWebVitals.fcp)),
              ttfb: this.average(validResults.map((r) => r.coreWebVitals.ttfb)),
            },
            bundleSize: {
              total: this.average(validResults.map((r) => r.bundleSize.total)),
            },
            duration: this.average(validResults.map((r) => r.duration)),
          }
        : {
            lighthouse: {
              performance: 0,
              accessibility: 0,
              bestPractices: 0,
              seo: 0,
              audits: {},
            },
            coreWebVitals: { lcp: 0, cls: 0, inp: 0, fcp: 0, ttfb: 0 },
            bundleSize: { total: 0 },
            duration: 0,
          }
    // Generate recommendations
    const recommendations = this.generateScenarioRecommendations(
      results,
      averages
    )
    return {
      passed: results.length > 0 && results.every((r) => r.passed),
      results,
      averages,
      failures,
      recommendations,
    }
  }
  /**
   * Run a single performance test
   */
  async runSingleTest(scenario, iteration, isWarmup = false) {
    const startTime = Date.now()
    try {
      // 1. Run Lighthouse audit
      const lighthouseResult = await this.runLighthouseAudit(scenario)
      // 2. Extract Core Web Vitals
      const coreWebVitals = this.extractCoreWebVitals(lighthouseResult)
      // 3. Get bundle size metrics
      const bundleSize = await this.getBundleMetrics()
      // 4. Validate against thresholds
      const validation = this.validateMetrics({
        lighthouse: lighthouseResult,
        coreWebVitals,
        bundleSize,
      })
      const result = {
        scenario: scenario.name,
        iteration,
        timestamp: new Date().toISOString(),
        lighthouse: lighthouseResult,
        coreWebVitals,
        bundleSize,
        device: scenario.device,
        networkThrottling: scenario.networkThrottling,
        passed: validation.passed,
        failures: validation.failures,
        warnings: validation.warnings,
        duration: Date.now() - startTime,
      }
      if (!isWarmup) {
        console.log(
          `  ${validation.passed ? '✅' : '❌'} Test ${validation.passed ? 'passed' : 'failed'} in ${result.duration}ms`
        )
        if (validation.failures.length > 0) {
          console.log(`    Failures: ${validation.failures.join(', ')}`)
        }
      }
      return result
    } catch (error) {
      throw new Error(`Single test execution failed: ${error}`)
    }
  }
  /**
   * Run Lighthouse audit for a scenario
   */
  async runLighthouseAudit(scenario) {
    return new Promise((resolve, reject) => {
      const args = [
        scenario.url,
        '--output=json',
        '--quiet',
        `--preset=${scenario.device}`,
        '--only-categories=performance,accessibility,best-practices,seo',
      ]
      // Add device-specific configuration
      if (scenario.device === 'mobile') {
        args.push('--emulated-form-factor=mobile')
        args.push('--throttling-method=simulate')
      } else {
        args.push('--emulated-form-factor=desktop')
        args.push('--throttling-method=provided')
      }
      // Add network throttling
      if (scenario.networkThrottling !== 'no-throttling') {
        args.push(
          `--throttling.rttMs=${this.getNetworkRTT(scenario.networkThrottling)}`
        )
        args.push(
          `--throttling.throughputKbps=${this.getNetworkThroughput(scenario.networkThrottling)}`
        )
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
      lighthouse.stderr.on('data', () => {
        // Lighthouse logs to stderr, ignore non-error output
      })
      lighthouse.on('close', (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(output)
            resolve({
              performance: result.categories.performance.score || 0,
              accessibility: result.categories.accessibility.score || 0,
              bestPractices: result.categories['best-practices'].score || 0,
              seo: result.categories.seo.score || 0,
              audits: result.audits,
            })
          } catch (error) {
            reject(new Error(`Failed to parse Lighthouse output: ${error}`))
          }
        } else {
          reject(new Error(`Lighthouse failed with exit code ${code}`))
        }
      })
      // Set timeout
      setTimeout(() => {
        lighthouse.kill('SIGTERM')
        reject(new Error('Lighthouse audit timed out'))
      }, this.config.testing.timeout)
    })
  }
  /**
   * Extract Core Web Vitals from Lighthouse result
   */
  extractCoreWebVitals(lighthouseResult) {
    var _a, _b, _c, _d, _e, _f
    const audits = lighthouseResult.audits
    return {
      lcp:
        ((_a = audits['largest-contentful-paint']) === null || _a === void 0
          ? void 0
          : _a.numericValue) || 0,
      cls:
        ((_b = audits['cumulative-layout-shift']) === null || _b === void 0
          ? void 0
          : _b.numericValue) || 0,
      inp:
        ((_c = audits['interaction-to-next-paint']) === null || _c === void 0
          ? void 0
          : _c.numericValue) ||
        ((_d = audits['max-potential-fid']) === null || _d === void 0
          ? void 0
          : _d.numericValue) ||
        0,
      fcp:
        ((_e = audits['first-contentful-paint']) === null || _e === void 0
          ? void 0
          : _e.numericValue) || 0,
      ttfb:
        ((_f = audits['server-response-time']) === null || _f === void 0
          ? void 0
          : _f.numericValue) || 0,
    }
  }
  /**
   * Get bundle size metrics
   */
  async getBundleMetrics() {
    try {
      const stats = await this.bundleMonitor.analyzeBuild('.next')
      return {
        total: stats.totalSize,
        gzipped: stats.gzippedSize,
        javascript: stats.assets
          .filter((a) => a.type === 'js')
          .reduce((sum, a) => sum + a.size, 0),
        css: stats.assets
          .filter((a) => a.type === 'css')
          .reduce((sum, a) => sum + a.size, 0),
        assets: stats.assets,
      }
    } catch (error) {
      console.warn('Could not get bundle metrics:', error)
      return {
        total: 0,
        gzipped: 0,
        javascript: 0,
        css: 0,
        assets: [],
      }
    }
  }
  /**
   * Validate metrics against thresholds
   */
  validateMetrics(metrics) {
    const failures = []
    const warnings = []
    // Lighthouse validation
    const { lighthouse: lhThresholds } = this.config.thresholds
    if (metrics.lighthouse.performance < lhThresholds.performance) {
      failures.push(
        `Performance score ${(metrics.lighthouse.performance * 100).toFixed(1)}% < ${lhThresholds.performance * 100}%`
      )
    }
    if (metrics.lighthouse.accessibility < lhThresholds.accessibility) {
      failures.push(
        `Accessibility score ${(metrics.lighthouse.accessibility * 100).toFixed(1)}% < ${lhThresholds.accessibility * 100}%`
      )
    }
    if (metrics.lighthouse.bestPractices < lhThresholds.bestPractices) {
      warnings.push(
        `Best Practices score ${(metrics.lighthouse.bestPractices * 100).toFixed(1)}% < ${lhThresholds.bestPractices * 100}%`
      )
    }
    if (metrics.lighthouse.seo < lhThresholds.seo) {
      warnings.push(
        `SEO score ${(metrics.lighthouse.seo * 100).toFixed(1)}% < ${lhThresholds.seo * 100}%`
      )
    }
    // Core Web Vitals validation
    const { coreWebVitals: cwvThresholds } = this.config.thresholds
    if (metrics.coreWebVitals.lcp > cwvThresholds.lcp) {
      failures.push(
        `LCP ${metrics.coreWebVitals.lcp}ms > ${cwvThresholds.lcp}ms`
      )
    }
    if (metrics.coreWebVitals.cls > cwvThresholds.cls) {
      failures.push(
        `CLS ${metrics.coreWebVitals.cls.toFixed(3)} > ${cwvThresholds.cls}`
      )
    }
    if (metrics.coreWebVitals.inp > cwvThresholds.inp) {
      warnings.push(
        `INP ${metrics.coreWebVitals.inp}ms > ${cwvThresholds.inp}ms`
      )
    }
    if (metrics.coreWebVitals.fcp > cwvThresholds.fcp) {
      warnings.push(
        `FCP ${metrics.coreWebVitals.fcp}ms > ${cwvThresholds.fcp}ms`
      )
    }
    if (metrics.coreWebVitals.ttfb > cwvThresholds.ttfb) {
      warnings.push(
        `TTFB ${metrics.coreWebVitals.ttfb}ms > ${cwvThresholds.ttfb}ms`
      )
    }
    // Bundle size validation
    const { bundleSize: bundleThresholds } = this.config.thresholds
    if (metrics.bundleSize.total > bundleThresholds.total) {
      failures.push(
        `Bundle size ${this.formatBytes(metrics.bundleSize.total)} > ${this.formatBytes(bundleThresholds.total)}`
      )
    }
    if (metrics.bundleSize.gzipped > bundleThresholds.gzipped) {
      failures.push(
        `Gzipped size ${this.formatBytes(metrics.bundleSize.gzipped)} > ${this.formatBytes(bundleThresholds.gzipped)}`
      )
    }
    if (metrics.bundleSize.javascript > bundleThresholds.javascript) {
      warnings.push(
        `JavaScript size ${this.formatBytes(metrics.bundleSize.javascript)} > ${this.formatBytes(bundleThresholds.javascript)}`
      )
    }
    if (metrics.bundleSize.css > bundleThresholds.css) {
      warnings.push(
        `CSS size ${this.formatBytes(metrics.bundleSize.css)} > ${this.formatBytes(bundleThresholds.css)}`
      )
    }
    return {
      passed: failures.length === 0,
      failures,
      warnings,
    }
  }
  /**
   * Build the application
   */
  async buildApplication() {
    return new Promise((resolve, reject) => {
      const build = (0, child_process_1.spawn)('npm', ['run', 'build'], {
        stdio: ['pipe', 'pipe', 'pipe'],
      })
      build.on('close', (code) => {
        if (code === 0) {
          resolve()
        } else {
          reject(new Error(`Build failed with exit code ${code}`))
        }
      })
      setTimeout(() => {
        build.kill('SIGTERM')
        reject(new Error('Build timed out'))
      }, 120000) // 2 minutes timeout
    })
  }
  /**
   * Start the application server
   */
  async startServer() {
    return new Promise((resolve, reject) => {
      const server = (0, child_process_1.spawn)('npm', ['start'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        detached: false,
      })
      let output = ''
      server.stdout.on('data', (data) => {
        output += data.toString()
        if (output.includes('Ready on') || output.includes('ready -')) {
          setTimeout(() => resolve(server), 2000) // Wait a bit more for full startup
        }
      })
      server.stderr.on('data', (data) => {
        output += data.toString()
        if (output.includes('Ready on') || output.includes('ready -')) {
          setTimeout(() => resolve(server), 2000)
        }
      })
      server.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Server failed to start with exit code ${code}`))
        }
      })
      setTimeout(() => {
        server.kill('SIGTERM')
        reject(new Error('Server startup timed out'))
      }, 30000) // 30 seconds timeout
    })
  }
  /**
   * Analyze overall results
   */
  analyzeOverallResults(report) {
    const allResults = Object.values(report.scenarios).flatMap((s) => s.results)
    const passedResults = allResults.filter((r) => r.passed)
    const overallPassed = report.summary.failed === 0
    const overallScore =
      (passedResults.length / Math.max(allResults.length, 1)) * 100
    const criticalIssues = []
    const recommendations = []
    // Identify critical issues
    if (report.summary.failed > 0) {
      criticalIssues.push(`${report.summary.failed} test(s) failed`)
    }
    // Analyze performance patterns
    const avgPerformance = this.average(
      passedResults.map((r) => r.lighthouse.performance)
    )
    const avgLCP = this.average(passedResults.map((r) => r.coreWebVitals.lcp))
    const avgCLS = this.average(passedResults.map((r) => r.coreWebVitals.cls))
    if (avgPerformance < 0.95) {
      criticalIssues.push(
        `Average Lighthouse performance score is ${(avgPerformance * 100).toFixed(1)}%`
      )
    }
    if (avgLCP > 1200) {
      criticalIssues.push(`Average LCP is ${avgLCP.toFixed(0)}ms`)
    }
    if (avgCLS > 0.1) {
      criticalIssues.push(`Average CLS is ${avgCLS.toFixed(3)}`)
    }
    // Generate recommendations
    Object.values(report.scenarios).forEach((scenario) => {
      recommendations.push(...scenario.recommendations)
    })
    return {
      passed: overallPassed,
      score: overallScore,
      criticalIssues,
      recommendations: [...new Set(recommendations)], // Remove duplicates
    }
  }
  /**
   * Generate scenario-specific recommendations
   */
  generateScenarioRecommendations(results, averages) {
    const recommendations = []
    if (averages.lighthouse.performance < 0.95) {
      recommendations.push(
        'Optimize Lighthouse performance score - consider image optimization, code splitting, and resource prioritization'
      )
    }
    if (averages.coreWebVitals.lcp > 1000) {
      recommendations.push(
        'Improve Largest Contentful Paint - optimize critical path, preload key resources, optimize server response time'
      )
    }
    if (averages.coreWebVitals.cls > 0.05) {
      recommendations.push(
        'Reduce Cumulative Layout Shift - add size attributes to images and videos, reserve space for ads'
      )
    }
    if (averages.coreWebVitals.inp > 200) {
      recommendations.push(
        'Optimize Interaction to Next Paint - reduce JavaScript execution time, avoid long tasks'
      )
    }
    return recommendations
  }
  /**
   * Generate test reports
   */
  async generateReports(report) {
    this.ensureOutputDirectory()
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    for (const format of this.config.output.formats) {
      const filename = `e2e-performance-report-${timestamp}.${format}`
      const filepath = path_1.default.join(
        this.config.output.reportDirectory,
        filename
      )
      switch (format) {
        case 'json':
          fs_1.default.writeFileSync(filepath, JSON.stringify(report, null, 2))
          break
        case 'markdown':
          const markdown = this.generateMarkdownReport(report)
          fs_1.default.writeFileSync(filepath, markdown)
          break
        case 'html':
          const html = this.generateHTMLReport(report)
          fs_1.default.writeFileSync(filepath, html)
          break
        case 'csv':
          const csv = this.generateCSVReport(report)
          fs_1.default.writeFileSync(filepath, csv)
          break
      }
      console.log(`📄 Report saved: ${filepath}`)
    }
  }
  /**
   * Generate markdown report
   */
  generateMarkdownReport(report) {
    const { summary, scenarios, overall } = report
    return `# End-to-End Performance Validation Report

**Generated**: ${summary.timestamp}
**Duration**: ${summary.duration}ms
**Overall Status**: ${overall.passed ? '✅ PASSED' : '❌ FAILED'}
**Overall Score**: ${overall.score.toFixed(1)}%

## Summary

- **Total Tests**: ${summary.totalTests}
- **Passed**: ${summary.passed}
- **Failed**: ${summary.failed}
- **Warnings**: ${summary.warnings}

## Overall Results

${
  overall.criticalIssues.length > 0
    ? `
### Critical Issues
${overall.criticalIssues.map((issue) => `- ❌ ${issue}`).join('\n')}
`
    : ''
}

${
  overall.recommendations.length > 0
    ? `
### Recommendations
${overall.recommendations.map((rec) => `- 💡 ${rec}`).join('\n')}
`
    : ''
}

## Scenario Results

${Object.entries(scenarios)
  .map(
    ([name, scenario]) => `
### ${name} ${scenario.passed ? '✅' : '❌'}

**Average Performance Metrics:**
- Lighthouse Performance: ${(scenario.averages.lighthouse.performance * 100).toFixed(1)}%
- LCP: ${scenario.averages.coreWebVitals.lcp.toFixed(0)}ms
- CLS: ${scenario.averages.coreWebVitals.cls.toFixed(3)}
- INP: ${scenario.averages.coreWebVitals.inp.toFixed(0)}ms

${
  scenario.failures.length > 0
    ? `
**Failures:**
${scenario.failures.map((failure) => `- ❌ ${failure}`).join('\n')}
`
    : ''
}

${
  scenario.recommendations.length > 0
    ? `
**Recommendations:**
${scenario.recommendations.map((rec) => `- 💡 ${rec}`).join('\n')}
`
    : ''
}
`
  )
  .join('\n')}

---

*Generated by E2E Performance Validator*
`
  }
  /**
   * Generate HTML report
   */
  generateHTMLReport(report) {
    // Simplified HTML report - could be enhanced with charts and interactive elements
    return `<!DOCTYPE html>
<html>
<head>
    <title>E2E Performance Validation Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .passed { color: green; }
        .failed { color: red; }
        .warning { color: orange; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <h1>End-to-End Performance Validation Report</h1>

    <div>
        <strong>Generated:</strong> ${report.summary.timestamp}<br>
        <strong>Duration:</strong> ${report.summary.duration}ms<br>
        <strong>Status:</strong> <span class="${report.overall.passed ? 'passed' : 'failed'}">${report.overall.passed ? 'PASSED' : 'FAILED'}</span><br>
        <strong>Score:</strong> ${report.overall.score.toFixed(1)}%
    </div>

    <h2>Summary</h2>
    <ul>
        <li>Total Tests: ${report.summary.totalTests}</li>
        <li>Passed: ${report.summary.passed}</li>
        <li>Failed: ${report.summary.failed}</li>
        <li>Warnings: ${report.summary.warnings}</li>
    </ul>

    ${Object.entries(report.scenarios)
      .map(
        ([name, scenario]) => `
    <h2>${name} <span class="${scenario.passed ? 'passed' : 'failed'}">${scenario.passed ? '✅' : '❌'}</span></h2>

    <table>
        <tr><th>Metric</th><th>Average Value</th></tr>
        <tr><td>Lighthouse Performance</td><td>${(scenario.averages.lighthouse.performance * 100).toFixed(1)}%</td></tr>
        <tr><td>LCP</td><td>${scenario.averages.coreWebVitals.lcp.toFixed(0)}ms</td></tr>
        <tr><td>CLS</td><td>${scenario.averages.coreWebVitals.cls.toFixed(3)}</td></tr>
        <tr><td>INP</td><td>${scenario.averages.coreWebVitals.inp.toFixed(0)}ms</td></tr>
    </table>
    `
      )
      .join('')}

</body>
</html>`
  }
  /**
   * Generate CSV report
   */
  generateCSVReport(report) {
    const headers = [
      'Scenario',
      'Iteration',
      'Timestamp',
      'Device',
      'Network',
      'Lighthouse Performance',
      'Lighthouse Accessibility',
      'Lighthouse Best Practices',
      'Lighthouse SEO',
      'LCP',
      'CLS',
      'INP',
      'FCP',
      'TTFB',
      'Bundle Total',
      'Bundle Gzipped',
      'Bundle JS',
      'Bundle CSS',
      'Passed',
      'Duration',
    ]
    const rows = Object.values(report.scenarios).flatMap((scenario) =>
      scenario.results.map((result) => [
        result.scenario,
        result.iteration,
        result.timestamp,
        result.device,
        result.networkThrottling,
        result.lighthouse.performance,
        result.lighthouse.accessibility,
        result.lighthouse.bestPractices,
        result.lighthouse.seo,
        result.coreWebVitals.lcp,
        result.coreWebVitals.cls,
        result.coreWebVitals.inp,
        result.coreWebVitals.fcp,
        result.coreWebVitals.ttfb,
        result.bundleSize.total,
        result.bundleSize.gzipped,
        result.bundleSize.javascript,
        result.bundleSize.css,
        result.passed,
        result.duration,
      ])
    )
    return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n')
  }
  /**
   * Log validation summary
   */
  logSummary(report) {
    const { summary, overall } = report
    console.log('\n📊 E2E Performance Validation Summary:')
    console.log(
      `${overall.passed ? '✅' : '❌'} Overall Status: ${overall.passed ? 'PASSED' : 'FAILED'}`
    )
    console.log(`📈 Overall Score: ${overall.score.toFixed(1)}%`)
    console.log(`📋 Tests: ${summary.passed}/${summary.totalTests} passed`)
    if (summary.warnings > 0) {
      console.log(`⚠️  Warnings: ${summary.warnings}`)
    }
    if (overall.criticalIssues.length > 0) {
      console.log('\n🚨 Critical Issues:')
      overall.criticalIssues.forEach((issue) => console.log(`  - ${issue}`))
    }
    console.log(`\n📄 Reports saved to: ${this.config.output.reportDirectory}`)
  }
  // Utility methods
  ensureOutputDirectory() {
    if (!fs_1.default.existsSync(this.config.output.reportDirectory)) {
      fs_1.default.mkdirSync(this.config.output.reportDirectory, {
        recursive: true,
      })
    }
  }
  getNetworkRTT(throttling) {
    switch (throttling) {
      case 'slow-3g':
        return 400
      case 'fast-3g':
        return 150
      case 'dsl':
        return 50
      default:
        return 0
    }
  }
  getNetworkThroughput(throttling) {
    switch (throttling) {
      case 'slow-3g':
        return 400
      case 'fast-3g':
        return 1600
      case 'dsl':
        return 1500
      default:
        return 0
    }
  }
  average(numbers) {
    return numbers.length > 0
      ? numbers.reduce((a, b) => a + b, 0) / numbers.length
      : 0
  }
  formatBytes(bytes) {
    const units = ['B', 'KB', 'MB', 'GB']
    let size = bytes
    let unitIndex = 0
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }
    return `${Math.round(size * 100) / 100} ${units[unitIndex]}`
  }
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
  waitForProcessExit(process) {
    return new Promise((resolve) => {
      process.on('exit', () => resolve())
      setTimeout(() => {
        if (!process.killed) {
          process.kill('SIGKILL')
        }
        resolve()
      }, 5000)
    })
  }
}
exports.E2EPerformanceValidator = E2EPerformanceValidator
