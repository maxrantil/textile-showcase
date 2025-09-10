#!/usr/bin/env node
// ABOUTME: Automated test regression detection script for Phase 3 quality assurance

import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import {
  loadTestBaseline,
  saveTestBaseline,
  createRegressionReport,
  analyzeCoverageRegression,
  detectPerformanceRegression,
  enforceMinimumCoverage,
  validateTestPatterns,
} from '../utils/test-regression'

interface CLIOptions {
  save?: boolean
  enforce?: boolean
  tolerance?: number
  verbose?: boolean
}

async function runRegressionCheck(options: CLIOptions = {}) {
  const {
    save = false,
    enforce = true,
    tolerance = 2,
    verbose = false,
  } = options

  console.log('🔍 Running Phase 3 Test Regression Analysis...\n')

  try {
    // Step 1: Run tests and collect results
    console.log('📋 Running test suite...')
    const testCommand = 'jest --coverage --json --outputFile=test-results.json'

    let testResults: Record<string, unknown>
    try {
      execSync(testCommand, { stdio: verbose ? 'inherit' : 'pipe' })
      testResults = JSON.parse(fs.readFileSync('test-results.json', 'utf8'))
    } catch (error) {
      console.error('❌ Test execution failed:', error)
      process.exit(1)
    }

    // Step 2: Load previous baseline
    console.log('📊 Loading previous baseline...')
    const previousBaseline = await loadTestBaseline()

    if (!previousBaseline) {
      console.log(
        '⚠️  No previous baseline found. Creating initial baseline...'
      )
    }

    // Step 3: Create regression report
    console.log('📈 Analyzing test results...')
    const report = createRegressionReport(testResults, previousBaseline)

    // Step 4: Check for regressions
    let hasRegressions = false
    const regressionDetails: string[] = []

    // Coverage regression check
    if (previousBaseline) {
      const coverageAnalysis = analyzeCoverageRegression(
        previousBaseline.coverage,
        report.coverageChange.after,
        tolerance
      )

      if (coverageAnalysis.hasRegression) {
        hasRegressions = true
        regressionDetails.push('Coverage Regression:')
        regressionDetails.push(
          ...coverageAnalysis.details.map((d) => `  - ${d}`)
        )
      }

      // Performance regression check
      const performanceAnalysis = detectPerformanceRegression(
        report.performanceMetrics,
        previousBaseline.performance,
        25 // 25% tolerance for performance
      )

      if (performanceAnalysis.hasRegression) {
        hasRegressions = true
        regressionDetails.push('Performance Regression:')
        regressionDetails.push(
          ...performanceAnalysis.details.map((d) => `  - ${d}`)
        )
      }
    }

    // Step 5: Enforce minimum coverage
    const coverageCheck = enforceMinimumCoverage(
      report.coverageChange.after,
      enforce
    )
    if (!coverageCheck.passed) {
      hasRegressions = true
      regressionDetails.push('Coverage Threshold Violations:')
      regressionDetails.push(...coverageCheck.violations.map((v) => `  - ${v}`))
    }

    // Step 6: Validate test patterns
    console.log('🔍 Validating test patterns...')
    const testFiles = execSync(
      'find tests -name "*.test.ts" -o -name "*.test.tsx"',
      { encoding: 'utf8' }
    )
      .trim()
      .split('\n')
      .filter(Boolean)

    const patternValidation = validateTestPatterns(testFiles)
    if (!patternValidation.isValid) {
      hasRegressions = true
      regressionDetails.push('Test Pattern Violations:')
      regressionDetails.push(
        ...patternValidation.violations.map((v) => `  - ${v}`)
      )
    }

    // Step 7: Display results
    console.log('\n' + '='.repeat(60))
    console.log('📊 TEST REGRESSION ANALYSIS RESULTS')
    console.log('='.repeat(60))

    console.log(`\n📈 Test Summary:`)
    console.log(`  Total Tests: ${report.totalTests}`)
    console.log(`  Passed: ${report.passedTests} ✅`)
    console.log(
      `  Failed: ${report.failedTests} ${report.failedTests > 0 ? '❌' : '✅'}`
    )
    console.log(`  Skipped: ${report.skippedTests}`)

    if (previousBaseline) {
      console.log(`  New Tests: +${report.newTests}`)
      if (report.removedTests > 0) {
        console.log(`  Removed Tests: -${report.removedTests}`)
      }
    }

    console.log(`\n📊 Coverage Report:`)
    console.log(
      `  Lines: ${report.coverageChange.after.lines.toFixed(1)}% (target: ${report.coverageChange.after.threshold.lines}%)`
    )
    console.log(
      `  Functions: ${report.coverageChange.after.functions.toFixed(1)}% (target: ${report.coverageChange.after.threshold.functions}%)`
    )
    console.log(
      `  Branches: ${report.coverageChange.after.branches.toFixed(1)}% (target: ${report.coverageChange.after.threshold.branches}%)`
    )
    console.log(
      `  Statements: ${report.coverageChange.after.statements.toFixed(1)}% (target: ${report.coverageChange.after.threshold.statements}%)`
    )

    console.log(`\n⚡ Performance Metrics:`)
    console.log(
      `  Average Test Duration: ${report.performanceMetrics.testDuration.toFixed(1)}ms`
    )

    if (report.performanceMetrics.slowestTests.length > 0) {
      console.log(`  Slowest Tests:`)
      report.performanceMetrics.slowestTests.slice(0, 3).forEach((test) => {
        console.log(
          `    - ${path.basename(test.name)}: ${test.duration.toFixed(1)}ms`
        )
      })
    }

    // Step 8: Report regressions
    if (hasRegressions) {
      console.log(`\n❌ REGRESSIONS DETECTED:`)
      regressionDetails.forEach((detail) => console.log(detail))

      if (enforce) {
        console.log('\n💥 Test regression check FAILED - Quality gates not met')
        console.log('Fix regressions before proceeding with deployment.')
        process.exit(1)
      } else {
        console.log('\n⚠️  Regressions detected but enforcement is disabled')
      }
    } else {
      console.log(`\n✅ No regressions detected - All quality gates passed!`)
    }

    // Step 9: Save baseline if requested
    if (save && !hasRegressions) {
      console.log('\n💾 Saving new baseline...')
      await saveTestBaseline(report)
    } else if (save && hasRegressions) {
      console.log('\n⚠️  Not saving baseline due to regressions')
    }

    // Step 10: Phase 3 specific checks
    console.log(`\n🎯 Phase 3 Quality Metrics:`)
    console.log(
      `  Mobile Hook Tests: ${testFiles.filter((f) => f.includes('mobile-hooks')).length} files`
    )
    console.log(
      `  Integration Tests: ${testFiles.filter((f) => f.includes('integration')).length} files`
    )
    console.log(
      `  Test Pattern Compliance: ${patternValidation.isValid ? '✅' : '❌'}`
    )

    // Calculate Phase 3 success score
    const phase3Score = calculatePhase3Score(report, patternValidation.isValid)
    console.log(
      `  Phase 3 Score: ${phase3Score.toFixed(1)}/100 ${phase3Score >= 75 ? '✅' : '❌'}`
    )

    if (phase3Score < 75) {
      console.log('\n⚠️  Phase 3 quality score below target (75/100)')
      console.log(
        'Consider adding more tests or improving coverage to meet Phase 3 goals.'
      )
    } else {
      console.log('\n🎉 Phase 3 quality targets achieved!')
    }

    // Cleanup
    try {
      fs.unlinkSync('test-results.json')
    } catch {
      // Ignore cleanup errors
    }

    console.log('\n' + '='.repeat(60))
  } catch (error) {
    console.error('💥 Regression check failed:', error)
    process.exit(1)
  }
}

function calculatePhase3Score(
  report: Record<string, unknown>,
  testPatternCompliance: boolean
): number {
  let score = 0

  // Coverage scoring (40% of total)
  const avgCoverage =
    (report.coverageChange.after.lines +
      report.coverageChange.after.functions +
      report.coverageChange.after.branches +
      report.coverageChange.after.statements) /
    4

  score += Math.min(40, (avgCoverage / 60) * 40) // 60% target coverage

  // Test count scoring (20% of total)
  const testScore = Math.min(20, (report.totalTests / 50) * 20) // 50 tests target
  score += testScore

  // Performance scoring (20% of total)
  const avgDuration = report.performanceMetrics.testDuration
  const perfScore =
    avgDuration < 100 ? 20 : Math.max(0, 20 - (avgDuration - 100) / 50)
  score += perfScore

  // Pattern compliance (20% of total)
  if (testPatternCompliance) {
    score += 20
  }

  return score
}

// CLI argument parsing
const args = process.argv.slice(2)
const options: CLIOptions = {}

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--save':
      options.save = true
      break
    case '--no-enforce':
      options.enforce = false
      break
    case '--tolerance':
      options.tolerance = parseInt(args[++i]) || 2
      break
    case '--verbose':
      options.verbose = true
      break
    case '--help':
      console.log(`
Phase 3 Test Regression Check

Usage: npm run test:regression [options]

Options:
  --save           Save baseline after successful check
  --no-enforce     Don't fail on regressions (warning only)
  --tolerance N    Coverage regression tolerance % (default: 2)
  --verbose        Show detailed test output
  --help           Show this help message

Examples:
  npm run test:regression                    # Check for regressions
  npm run test:regression -- --save          # Save new baseline
  npm run test:regression -- --no-enforce    # Warning mode only
`)
      process.exit(0)
    default:
      console.error(`Unknown option: ${args[i]}`)
      process.exit(1)
  }
}

// Run the regression check
if (require.main === module) {
  runRegressionCheck(options).catch((error) => {
    console.error('Script execution failed:', error)
    process.exit(1)
  })
}
