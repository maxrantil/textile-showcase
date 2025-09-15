// ABOUTME: Bundle size analysis utility for production deployment validation
// Analyzes Next.js build output to ensure bundle size compliance and detect regressions

const fs = require('fs') // eslint-disable-line @typescript-eslint/no-require-imports
const path = require('path') // eslint-disable-line @typescript-eslint/no-require-imports

/**
 * Analyzes bundle size from Next.js build output
 * @param {string} buildPath - Path to the build directory
 * @returns {Promise<Object>} Bundle statistics
 */
async function analyze(buildPath) {
  const buildDir = path.resolve(buildPath)

  if (!fs.existsSync(buildDir)) {
    throw new Error(`Build directory not found: ${buildDir}`)
  }

  const stats = {
    totalSize: 0,
    jsSize: 0,
    cssSize: 0,
    staticSize: 0,
    chunks: [],
    timestamp: new Date().toISOString(),
  }

  try {
    // Analyze static files
    const staticDir = path.join(buildDir, 'static')
    if (fs.existsSync(staticDir)) {
      stats.staticSize = await calculateDirectorySize(staticDir)
      stats.totalSize += stats.staticSize

      // Analyze JS chunks
      const jsDir = path.join(staticDir, 'chunks')
      if (fs.existsSync(jsDir)) {
        const jsFiles = await getFilesWithExtension(jsDir, '.js')
        stats.jsSize = jsFiles.reduce((total, file) => total + file.size, 0)
        stats.chunks.push(
          ...jsFiles.map((file) => ({
            name: file.name,
            size: file.size,
            type: 'javascript',
          }))
        )
      }

      // Analyze CSS files
      const cssDir = path.join(staticDir, 'css')
      if (fs.existsSync(cssDir)) {
        const cssFiles = await getFilesWithExtension(cssDir, '.css')
        stats.cssSize = cssFiles.reduce((total, file) => total + file.size, 0)
        stats.chunks.push(
          ...cssFiles.map((file) => ({
            name: file.name,
            size: file.size,
            type: 'stylesheet',
          }))
        )
      }
    }

    // Update total size
    stats.totalSize = stats.jsSize + stats.cssSize

    // Add size validation flags
    stats.validation = {
      totalSizeOk: stats.totalSize < 7 * 1024 * 1024, // < 7MB
      jsSizeOk: stats.jsSize < 5 * 1024 * 1024, // < 5MB
      cssSizeOk: stats.cssSize < 1 * 1024 * 1024, // < 1MB
    }

    return stats
  } catch (error) {
    throw new Error(`Bundle analysis failed: ${error.message}`)
  }
}

/**
 * Calculates total size of a directory
 * @param {string} dirPath - Directory path
 * @returns {Promise<number>} Total size in bytes
 */
async function calculateDirectorySize(dirPath) {
  let totalSize = 0

  const files = fs.readdirSync(dirPath)
  for (const file of files) {
    const filePath = path.join(dirPath, file)
    const stat = fs.statSync(filePath)

    if (stat.isDirectory()) {
      totalSize += await calculateDirectorySize(filePath)
    } else {
      totalSize += stat.size
    }
  }

  return totalSize
}

/**
 * Gets all files with a specific extension and their sizes
 * @param {string} dirPath - Directory path
 * @param {string} extension - File extension (e.g., '.js')
 * @returns {Promise<Array>} Array of file objects with name and size
 */
async function getFilesWithExtension(dirPath, extension) {
  const files = []

  if (!fs.existsSync(dirPath)) {
    return files
  }

  const dirContents = fs.readdirSync(dirPath)
  for (const item of dirContents) {
    const itemPath = path.join(dirPath, item)
    const stat = fs.statSync(itemPath)

    if (stat.isDirectory()) {
      files.push(...(await getFilesWithExtension(itemPath, extension)))
    } else if (path.extname(item) === extension) {
      files.push({
        name: item,
        path: itemPath,
        size: stat.size,
      })
    }
  }

  return files
}

/**
 * Compares current bundle stats with baseline
 * @param {Object} currentStats - Current bundle statistics
 * @param {Object} baselineStats - Baseline bundle statistics
 * @returns {Object} Comparison results
 */
function compareWithBaseline(currentStats, baselineStats) {
  const comparison = {
    totalSizeChange: currentStats.totalSize - baselineStats.totalSize,
    jsSizeChange: currentStats.jsSize - baselineStats.jsSize,
    cssSizeChange: currentStats.cssSize - baselineStats.cssSize,
    percentageChange: {
      total:
        ((currentStats.totalSize - baselineStats.totalSize) /
          baselineStats.totalSize) *
        100,
      js:
        ((currentStats.jsSize - baselineStats.jsSize) / baselineStats.jsSize) *
        100,
      css:
        ((currentStats.cssSize - baselineStats.cssSize) /
          baselineStats.cssSize) *
        100,
    },
    regressionDetected: false,
  }

  // Check for regressions (>10% increase)
  comparison.regressionDetected =
    Math.abs(comparison.percentageChange.total) > 10 ||
    Math.abs(comparison.percentageChange.js) > 10 ||
    Math.abs(comparison.percentageChange.css) > 10

  return comparison
}

/**
 * Saves bundle statistics as baseline for future comparisons
 * @param {Object} stats - Bundle statistics to save
 * @param {string} baselinePath - Path to save baseline file
 */
function saveBaseline(stats, baselinePath = './bundle-baseline.json') {
  const baseline = {
    timestamp: stats.timestamp,
    totalSize: stats.totalSize,
    jsSize: stats.jsSize,
    cssSize: stats.cssSize,
    validation: stats.validation,
  }

  fs.writeFileSync(baselinePath, JSON.stringify(baseline, null, 2))
}

// Utility module for bundle analysis - tests are in separate test file

module.exports = {
  analyze,
  compareWithBaseline,
  saveBaseline,
}
