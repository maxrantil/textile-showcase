// ABOUTME: Test regression prevention utilities for Phase 3 quality assurance

export interface TestCoverageReport {
  lines: number
  functions: number
  branches: number
  statements: number
  threshold: {
    lines: number
    functions: number
    branches: number
    statements: number
  }
}

export interface RegressionTestReport {
  totalTests: number
  passedTests: number
  failedTests: number
  skippedTests: number
  newTests: number
  removedTests: number
  coverageChange: {
    before: TestCoverageReport
    after: TestCoverageReport
    regression: boolean
  }
  performanceMetrics: {
    testDuration: number
    slowestTests: Array<{
      name: string
      duration: number
    }>
  }
}

/**
 * Analyzes test coverage changes to detect regressions
 * Phase 3 implementation - prevents coverage drops
 */
export function analyzeCoverageRegression(
  previousCoverage: TestCoverageReport,
  currentCoverage: TestCoverageReport,
  tolerancePercent: number = 2
): { hasRegression: boolean; details: string[] } {
  const details: string[] = []
  let hasRegression = false

  const metrics = ['lines', 'functions', 'branches', 'statements'] as const

  for (const metric of metrics) {
    const before = previousCoverage[metric]
    const after = currentCoverage[metric]
    const diff = before - after
    const percentDrop = (diff / before) * 100

    if (percentDrop > tolerancePercent) {
      hasRegression = true
      details.push(
        `${metric} coverage dropped from ${before}% to ${after}% (${percentDrop.toFixed(1)}% decrease)`
      )
    } else if (after > before) {
      details.push(
        `${metric} coverage improved from ${before}% to ${after}% (+${(after - before).toFixed(1)}%)`
      )
    }
  }

  return { hasRegression, details }
}

/**
 * Generates test performance baseline for regression detection
 * Phase 3 implementation - tracks test performance over time
 */
export function generatePerformanceBaseline(testResults: {
  testResults: Array<{
    testFilePath: string
    perfStats: {
      start: number
      end: number
    }
  }>
}): {
  averageDuration: number
  slowTests: Array<{ name: string; duration: number }>
} {
  const durations = testResults.testResults.map((result) => {
    const duration = result.perfStats.end - result.perfStats.start
    return {
      name: result.testFilePath,
      duration,
    }
  })

  const totalDuration = durations.reduce((sum, test) => sum + test.duration, 0)
  const averageDuration = totalDuration / durations.length

  // Identify slow tests (> 2x average duration)
  const slowTests = durations
    .filter((test) => test.duration > averageDuration * 2)
    .sort((a, b) => b.duration - a.duration)
    .slice(0, 10) // Top 10 slowest

  return {
    averageDuration,
    slowTests,
  }
}

/**
 * Validates that critical test patterns are maintained
 * Phase 3 implementation - ensures test quality standards
 */
export function validateTestPatterns(testFiles: string[]): {
  isValid: boolean
  violations: string[]
} {
  const violations: string[] = []
  let isValid = true

  for (const testFile of testFiles) {
    const fileName = testFile.split('/').pop() || ''

    // Validate naming conventions
    if (!fileName.endsWith('.test.tsx') && !fileName.endsWith('.test.ts')) {
      violations.push(
        `${fileName}: Test file should end with .test.ts or .test.tsx`
      )
      isValid = false
    }

    // Validate hook tests are in correct directory
    if (
      fileName.includes('Hook') ||
      (fileName.includes('use') && testFile.includes('/mobile/'))
    ) {
      if (
        !testFile.includes('/mobile-hooks/') &&
        !testFile.includes('/hooks/')
      ) {
        violations.push(
          `${fileName}: Hook tests should be in /mobile-hooks/ or /hooks/ directory`
        )
        isValid = false
      }
    }

    // Validate integration tests are in correct directory
    if (fileName.includes('integration') || fileName.includes('Integration')) {
      if (!testFile.includes('/integration/')) {
        violations.push(
          `${fileName}: Integration tests should be in /integration/ directory`
        )
        isValid = false
      }
    }
  }

  return { isValid, violations }
}

/**
 * Creates test regression report for CI/CD pipeline
 * Phase 3 implementation - comprehensive regression detection
 */
export function createRegressionReport(
  testResults: Record<string, unknown>,
  previousBaseline?: {
    coverage: TestCoverageReport
    performance: {
      averageDuration: number
      slowTests: Array<{ name: string; duration: number }>
    }
    testCount: number
  }
): RegressionTestReport {
  const currentCoverage: TestCoverageReport = {
    lines: testResults.coverageMap?.getCoverageSummary?.()?.lines?.pct || 0,
    functions:
      testResults.coverageMap?.getCoverageSummary?.()?.functions?.pct || 0,
    branches:
      testResults.coverageMap?.getCoverageSummary?.()?.branches?.pct || 0,
    statements:
      testResults.coverageMap?.getCoverageSummary?.()?.statements?.pct || 0,
    threshold: {
      lines: 60, // Phase 3 target
      functions: 60,
      branches: 50,
      statements: 60,
    },
  }

  const currentPerformance = generatePerformanceBaseline(testResults)

  const totalTests = testResults.numTotalTests || 0
  const passedTests = testResults.numPassedTests || 0
  const failedTests = testResults.numFailedTests || 0
  const skippedTests = testResults.numTodoTests || 0

  let coverageRegression = false
  let newTests = 0
  let removedTests = 0

  if (previousBaseline) {
    const coverageAnalysis = analyzeCoverageRegression(
      previousBaseline.coverage,
      currentCoverage,
      2 // 2% tolerance
    )
    coverageRegression = coverageAnalysis.hasRegression

    newTests = Math.max(0, totalTests - previousBaseline.testCount)
    removedTests = Math.max(0, previousBaseline.testCount - totalTests)
  }

  return {
    totalTests,
    passedTests,
    failedTests,
    skippedTests,
    newTests,
    removedTests,
    coverageChange: {
      before: previousBaseline?.coverage || currentCoverage,
      after: currentCoverage,
      regression: coverageRegression,
    },
    performanceMetrics: {
      testDuration: currentPerformance.averageDuration,
      slowestTests: currentPerformance.slowTests,
    },
  }
}

/**
 * Enforces minimum test coverage thresholds
 * Phase 3 implementation - prevents coverage regressions
 */
export function enforceMinimumCoverage(
  coverage: TestCoverageReport,
  enforceThresholds: boolean = true
): { passed: boolean; violations: string[] } {
  const violations: string[] = []

  if (!enforceThresholds) {
    return { passed: true, violations: [] }
  }

  const checks = [
    {
      metric: 'lines',
      actual: coverage.lines,
      threshold: coverage.threshold.lines,
    },
    {
      metric: 'functions',
      actual: coverage.functions,
      threshold: coverage.threshold.functions,
    },
    {
      metric: 'branches',
      actual: coverage.branches,
      threshold: coverage.threshold.branches,
    },
    {
      metric: 'statements',
      actual: coverage.statements,
      threshold: coverage.threshold.statements,
    },
  ]

  for (const check of checks) {
    if (check.actual < check.threshold) {
      violations.push(
        `${check.metric} coverage ${check.actual}% is below threshold ${check.threshold}%`
      )
    }
  }

  return {
    passed: violations.length === 0,
    violations,
  }
}

/**
 * Detects test performance regressions
 * Phase 3 implementation - ensures tests remain fast
 */
export function detectPerformanceRegression(
  currentPerformance: {
    averageDuration: number
    slowTests: Array<{ name: string; duration: number }>
  },
  previousPerformance?: {
    averageDuration: number
    slowTests: Array<{ name: string; duration: number }>
  },
  tolerancePercent: number = 25
): { hasRegression: boolean; details: string[] } {
  const details: string[] = []
  let hasRegression = false

  if (!previousPerformance) {
    details.push('No previous performance baseline available')
    return { hasRegression, details }
  }

  // Check average duration regression
  const durationIncrease =
    currentPerformance.averageDuration - previousPerformance.averageDuration
  const percentIncrease =
    (durationIncrease / previousPerformance.averageDuration) * 100

  if (percentIncrease > tolerancePercent) {
    hasRegression = true
    details.push(
      `Average test duration increased from ${previousPerformance.averageDuration.toFixed(1)}ms to ${currentPerformance.averageDuration.toFixed(1)}ms (${percentIncrease.toFixed(1)}% increase)`
    )
  }

  // Check for new slow tests
  const previousSlowTestNames = new Set(
    previousPerformance.slowTests.map((t) => t.name)
  )
  const newSlowTests = currentPerformance.slowTests.filter(
    (t) => !previousSlowTestNames.has(t.name)
  )

  if (newSlowTests.length > 0) {
    hasRegression = true
    details.push(
      `New slow tests detected: ${newSlowTests.map((t) => t.name).join(', ')}`
    )
  }

  return { hasRegression, details }
}

/**
 * Saves test baseline for future regression detection
 * Phase 3 implementation - maintains test quality over time
 */
export async function saveTestBaseline(
  report: RegressionTestReport,
  baselinePath: string = './tests/baselines/test-baseline.json'
): Promise<void> {
  const baseline = {
    coverage: report.coverageChange.after,
    performance: report.performanceMetrics,
    testCount: report.totalTests,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
  }

  try {
    const fs = require('fs').promises

    const path = require('path')

    // Ensure directory exists
    const dir = path.dirname(baselinePath)
    await fs.mkdir(dir, { recursive: true })

    await fs.writeFile(baselinePath, JSON.stringify(baseline, null, 2))
    console.log(`✅ Test baseline saved to ${baselinePath}`)
  } catch (error) {
    console.error('❌ Failed to save test baseline:', error)
    throw error
  }
}

/**
 * Loads previous test baseline for comparison
 * Phase 3 implementation - enables regression detection
 */
export async function loadTestBaseline(
  baselinePath: string = './tests/baselines/test-baseline.json'
): Promise<{
  coverage: TestCoverageReport
  performance: {
    averageDuration: number
    slowTests: Array<{ name: string; duration: number }>
  }
  testCount: number
} | null> {
  try {
    const fs = require('fs').promises
    const data = await fs.readFile(baselinePath, 'utf8')
    const baseline = JSON.parse(data)

    return {
      coverage: baseline.coverage,
      performance: baseline.performance,
      testCount: baseline.testCount,
    }
  } catch (error) {
    console.warn('⚠️  No previous test baseline found, starting fresh')
    return null
  }
}
