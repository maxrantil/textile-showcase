'use strict'
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable @typescript-eslint/no-unused-vars */
// ABOUTME: Bundle size monitoring and alerting system for performance budget enforcement
// Tracks bundle size changes, detects regressions, and triggers alerts
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value)
          })
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value))
        } catch (e) {
          reject(e)
        }
      }
      function rejected(value) {
        try {
          step(generator['throw'](value))
        } catch (e) {
          reject(e)
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected)
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next())
    })
  }
var __generator =
  (this && this.__generator) ||
  function (thisArg, body) {
    var _ = {
        label: 0,
        sent: function () {
          if (t[0] & 1) throw t[1]
          return t[1]
        },
        trys: [],
        ops: [],
      },
      f,
      y,
      t,
      g = Object.create(
        (typeof Iterator === 'function' ? Iterator : Object).prototype
      )
    return (
      (g.next = verb(0)),
      (g['throw'] = verb(1)),
      (g['return'] = verb(2)),
      typeof Symbol === 'function' &&
        (g[Symbol.iterator] = function () {
          return this
        }),
      g
    )
    function verb(n) {
      return function (v) {
        return step([n, v])
      }
    }
    function step(op) {
      if (f) throw new TypeError('Generator is already executing.')
      while ((g && ((g = 0), op[0] && (_ = 0)), _))
        try {
          if (
            ((f = 1),
            y &&
              (t =
                op[0] & 2
                  ? y['return']
                  : op[0]
                    ? y['throw'] || ((t = y['return']) && t.call(y), 0)
                    : y.next) &&
              !(t = t.call(y, op[1])).done)
          )
            return t
          if (((y = 0), t)) op = [op[0] & 2, t.value]
          switch (op[0]) {
            case 0:
            case 1:
              t = op
              break
            case 4:
              _.label++
              return { value: op[1], done: false }
            case 5:
              _.label++
              y = op[1]
              op = [0]
              continue
            case 7:
              op = _.ops.pop()
              _.trys.pop()
              continue
            default:
              if (
                !((t = _.trys), (t = t.length > 0 && t[t.length - 1])) &&
                (op[0] === 6 || op[0] === 2)
              ) {
                _ = 0
                continue
              }
              if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                _.label = op[1]
                break
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1]
                t = op
                break
              }
              if (t && _.label < t[2]) {
                _.label = t[2]
                _.ops.push(op)
                break
              }
              if (t[2]) _.ops.pop()
              _.trys.pop()
              continue
          }
          op = body.call(thisArg, _)
        } catch (e) {
          op = [6, e]
          y = 0
        } finally {
          f = t = 0
        }
      if (op[0] & 5) throw op[1]
      return { value: op[0] ? op[1] : void 0, done: true }
    }
  }
var __spreadArray =
  (this && this.__spreadArray) ||
  function (to, from, pack) {
    if (pack || arguments.length === 2)
      for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
          if (!ar) ar = Array.prototype.slice.call(from, 0, i)
          ar[i] = from[i]
        }
      }
    return to.concat(ar || Array.prototype.slice.call(from))
  }
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod }
  }
Object.defineProperty(exports, '__esModule', { value: true })
exports.DEFAULT_BUNDLE_BUDGET = exports.BundleMonitor = void 0
var fs_1 = __importDefault(require('fs'))
var path_1 = __importDefault(require('path'))
var BundleMonitor = /** @class */ (function () {
  function BundleMonitor(budgets, historyFile, alertCallback) {
    if (historyFile === void 0) {
      historyFile = '.bundle-history.json'
    }
    this.budgets = budgets
    this.historyFile = historyFile
    this.alertCallback = alertCallback
  }
  /**
   * Analyze Next.js build output and extract bundle statistics
   * Focuses on client-side First Load JS (rootMainFiles + polyfillFiles)
   */
  BundleMonitor.prototype.analyzeBuild = function () {
    return __awaiter(this, arguments, void 0, function (buildDir) {
      var buildManifest,
        manifest,
        chunks,
        assets,
        totalSize,
        firstLoadFiles,
        _i,
        firstLoadFiles_1,
        file,
        filePath,
        stats,
        chunkName,
        isJS,
        isCSS,
        _a,
        _b,
        _c,
        page,
        files,
        pageFiles,
        _d,
        pageFiles_1,
        file,
        filePath,
        stats,
        chunkName,
        isJS,
        isCSS,
        gzippedSize,
        bundleStats
      if (buildDir === void 0) {
        buildDir = '.next'
      }
      return __generator(this, function (_e) {
        buildManifest = path_1.default.join(buildDir, 'build-manifest.json')
        if (!fs_1.default.existsSync(buildManifest)) {
          throw new Error('Build manifest not found: '.concat(buildManifest))
        }
        manifest = JSON.parse(fs_1.default.readFileSync(buildManifest, 'utf8'))
        chunks = []
        assets = []
        totalSize = 0
        firstLoadFiles = __spreadArray(
          __spreadArray([], manifest.rootMainFiles || [], true),
          manifest.polyfillFiles || [],
          true
        )
        for (
          _i = 0, firstLoadFiles_1 = firstLoadFiles;
          _i < firstLoadFiles_1.length;
          _i++
        ) {
          file = firstLoadFiles_1[_i]
          filePath = path_1.default.join(buildDir, file)
          if (fs_1.default.existsSync(filePath)) {
            stats = fs_1.default.statSync(filePath)
            chunkName = path_1.default.basename(file)
            isJS = file.endsWith('.js')
            isCSS = file.endsWith('.css')
            chunks.push({
              name: chunkName,
              size: stats.size,
              type: 'initial', // First Load JS is always initial
            })
            assets.push({
              name: file,
              size: stats.size,
              type: isJS ? 'js' : isCSS ? 'css' : 'other',
            })
            totalSize += stats.size
          }
        }
        // Analyze page-specific chunks (async chunks)
        for (
          _a = 0, _b = Object.entries(manifest.pages || {});
          _a < _b.length;
          _a++
        ) {
          ;(_c = _b[_a]), (page = _c[0]), (files = _c[1])
          pageFiles = files
          for (_d = 0, pageFiles_1 = pageFiles; _d < pageFiles_1.length; _d++) {
            file = pageFiles_1[_d]
            // Skip files already counted in First Load JS
            if (firstLoadFiles.includes(file)) {
              continue
            }
            filePath = path_1.default.join(buildDir, file)
            if (fs_1.default.existsSync(filePath)) {
              stats = fs_1.default.statSync(filePath)
              chunkName = ''
                .concat(page, '-')
                .concat(path_1.default.basename(file))
              isJS = file.endsWith('.js')
              isCSS = file.endsWith('.css')
              chunks.push({
                name: chunkName,
                size: stats.size,
                type: 'async',
              })
              assets.push({
                name: file,
                size: stats.size,
                type: isJS ? 'js' : isCSS ? 'css' : 'other',
              })
              totalSize += stats.size
            }
          }
        }
        gzippedSize = Math.round(totalSize * 0.3) // Typical gzip ratio
        bundleStats = {
          totalSize: totalSize,
          gzippedSize: gzippedSize,
          chunks: chunks,
          assets: assets,
          timestamp: new Date().toISOString(),
          gitCommit:
            process.env.GIT_COMMIT || process.env.VERCEL_GIT_COMMIT_SHA,
          buildId: process.env.BUILD_ID || process.env.VERCEL_DEPLOYMENT_ID,
        }
        return [2 /*return*/, bundleStats]
      })
    })
  }
  /**
   * Validate bundle against budgets and detect regressions
   */
  BundleMonitor.prototype.validateBundle = function (stats) {
    return __awaiter(this, void 0, void 0, function () {
      var alerts,
        _i,
        _a,
        chunk,
        limit,
        assetSizes,
        budgetChecks,
        _b,
        budgetChecks_1,
        check,
        regressionAlerts
      return __generator(this, function (_c) {
        switch (_c.label) {
          case 0:
            alerts = []
            // Check total size budget
            if (stats.totalSize > this.budgets.maxTotalSize) {
              alerts.push({
                type: 'error',
                category: 'size_limit',
                message: 'Total bundle size exceeds budget',
                details: {
                  current: stats.totalSize,
                  threshold: this.budgets.maxTotalSize,
                  percentage: Math.round(
                    ((stats.totalSize - this.budgets.maxTotalSize) /
                      this.budgets.maxTotalSize) *
                      100
                  ),
                },
                timestamp: new Date().toISOString(),
              })
            }
            // Check gzipped size budget
            if (stats.gzippedSize > this.budgets.maxGzippedSize) {
              alerts.push({
                type: 'error',
                category: 'size_limit',
                message: 'Gzipped bundle size exceeds budget',
                details: {
                  current: stats.gzippedSize,
                  threshold: this.budgets.maxGzippedSize,
                  percentage: Math.round(
                    ((stats.gzippedSize - this.budgets.maxGzippedSize) /
                      this.budgets.maxGzippedSize) *
                      100
                  ),
                },
                timestamp: new Date().toISOString(),
              })
            }
            // Check individual chunk sizes
            for (_i = 0, _a = stats.chunks; _i < _a.length; _i++) {
              chunk = _a[_i]
              limit =
                chunk.type === 'initial'
                  ? this.budgets.maxInitialChunkSize
                  : this.budgets.maxAsyncChunkSize
              if (chunk.size > limit) {
                alerts.push({
                  type: 'warning',
                  category: 'size_limit',
                  message: 'Chunk "'.concat(chunk.name, '" exceeds size limit'),
                  details: {
                    current: chunk.size,
                    threshold: limit,
                    percentage: Math.round(
                      ((chunk.size - limit) / limit) * 100
                    ),
                  },
                  timestamp: new Date().toISOString(),
                })
              }
            }
            assetSizes = {
              js: stats.assets
                .filter(function (a) {
                  return a.type === 'js'
                })
                .reduce(function (sum, a) {
                  return sum + a.size
                }, 0),
              css: stats.assets
                .filter(function (a) {
                  return a.type === 'css'
                })
                .reduce(function (sum, a) {
                  return sum + a.size
                }, 0),
              image: stats.assets
                .filter(function (a) {
                  return a.type === 'image'
                })
                .reduce(function (sum, a) {
                  return sum + a.size
                }, 0),
              font: stats.assets
                .filter(function (a) {
                  return a.type === 'font'
                })
                .reduce(function (sum, a) {
                  return sum + a.size
                }, 0),
            }
            budgetChecks = [
              {
                type: 'JavaScript',
                size: assetSizes.js,
                budget: this.budgets.maxJavaScriptSize,
              },
              {
                type: 'CSS',
                size: assetSizes.css,
                budget: this.budgets.maxCSSSize,
              },
              {
                type: 'Images',
                size: assetSizes.image,
                budget: this.budgets.maxImageSize,
              },
              {
                type: 'Fonts',
                size: assetSizes.font,
                budget: this.budgets.maxFontSize,
              },
            ]
            for (
              _b = 0, budgetChecks_1 = budgetChecks;
              _b < budgetChecks_1.length;
              _b++
            ) {
              check = budgetChecks_1[_b]
              if (check.size > check.budget) {
                alerts.push({
                  type: 'warning',
                  category: 'budget_exceeded',
                  message: ''.concat(check.type, ' assets exceed budget'),
                  details: {
                    current: check.size,
                    threshold: check.budget,
                    percentage: Math.round(
                      ((check.size - check.budget) / check.budget) * 100
                    ),
                  },
                  timestamp: new Date().toISOString(),
                })
              }
            }
            return [4 /*yield*/, this.detectRegressions(stats)]
          case 1:
            regressionAlerts = _c.sent()
            alerts.push.apply(alerts, regressionAlerts)
            return [2 /*return*/, alerts]
        }
      })
    })
  }
  /**
   * Detect size regressions compared to previous builds
   */
  BundleMonitor.prototype.detectRegressions = function (currentStats) {
    return __awaiter(this, void 0, void 0, function () {
      var alerts,
        history_1,
        previousStats,
        sizeIncrease,
        sizeIncreasePercentage,
        error_1
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            alerts = []
            _a.label = 1
          case 1:
            _a.trys.push([1, 3, , 4])
            return [4 /*yield*/, this.loadHistory()]
          case 2:
            history_1 = _a.sent()
            if (history_1.length === 0) {
              return [2 /*return*/, alerts] // No history to compare against
            }
            previousStats = history_1[history_1.length - 1]
            sizeIncrease = currentStats.totalSize - previousStats.totalSize
            sizeIncreasePercentage =
              (sizeIncrease / previousStats.totalSize) * 100
            if (sizeIncreasePercentage > this.budgets.regressionThreshold) {
              alerts.push({
                type: 'error',
                category: 'regression',
                message: 'Significant bundle size regression detected',
                details: {
                  current: currentStats.totalSize,
                  threshold:
                    previousStats.totalSize *
                    (1 + this.budgets.regressionThreshold / 100),
                  increase: sizeIncrease,
                  percentage: Math.round(sizeIncreasePercentage * 100) / 100,
                },
                timestamp: new Date().toISOString(),
              })
            } else if (sizeIncreasePercentage > this.budgets.warningThreshold) {
              alerts.push({
                type: 'warning',
                category: 'regression',
                message: 'Bundle size increase detected',
                details: {
                  current: currentStats.totalSize,
                  threshold:
                    previousStats.totalSize *
                    (1 + this.budgets.warningThreshold / 100),
                  increase: sizeIncrease,
                  percentage: Math.round(sizeIncreasePercentage * 100) / 100,
                },
                timestamp: new Date().toISOString(),
              })
            }
            // Check for significant improvements to celebrate
            if (sizeIncreasePercentage < -5) {
              alerts.push({
                type: 'info',
                category: 'optimization',
                message: 'Bundle size optimization detected',
                details: {
                  current: currentStats.totalSize,
                  threshold: previousStats.totalSize,
                  increase: sizeIncrease,
                  percentage: Math.round(sizeIncreasePercentage * 100) / 100,
                },
                timestamp: new Date().toISOString(),
              })
            }
            return [3 /*break*/, 4]
          case 3:
            error_1 = _a.sent()
            console.warn(
              'Could not load bundle history for regression detection:',
              error_1
            )
            return [3 /*break*/, 4]
          case 4:
            return [2 /*return*/, alerts]
        }
      })
    })
  }
  /**
   * Save bundle statistics to history
   */
  BundleMonitor.prototype.saveToHistory = function (stats) {
    return __awaiter(this, void 0, void 0, function () {
      var history_2, error_2
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            _a.trys.push([0, 2, , 3])
            return [4 /*yield*/, this.loadHistory()]
          case 1:
            history_2 = _a.sent()
            history_2.push(stats)
            // Keep only last 50 builds to avoid file bloat
            if (history_2.length > 50) {
              history_2.splice(0, history_2.length - 50)
            }
            fs_1.default.writeFileSync(
              this.historyFile,
              JSON.stringify(history_2, null, 2)
            )
            return [3 /*break*/, 3]
          case 2:
            error_2 = _a.sent()
            console.error('Failed to save bundle history:', error_2)
            return [3 /*break*/, 3]
          case 3:
            return [2 /*return*/]
        }
      })
    })
  }
  /**
   * Load bundle history from file
   */
  BundleMonitor.prototype.loadHistory = function () {
    return __awaiter(this, void 0, void 0, function () {
      var content
      return __generator(this, function (_a) {
        try {
          if (fs_1.default.existsSync(this.historyFile)) {
            content = fs_1.default.readFileSync(this.historyFile, 'utf8')
            return [2 /*return*/, JSON.parse(content)]
          }
        } catch (error) {
          console.warn('Could not load bundle history:', error)
        }
        return [2 /*return*/, []]
      })
    })
  }
  /**
   * Process alerts and trigger notifications
   */
  BundleMonitor.prototype.processAlerts = function (alerts) {
    return __awaiter(this, void 0, void 0, function () {
      var _i, alerts_1, alert_1, emoji, sign
      return __generator(this, function (_a) {
        for (_i = 0, alerts_1 = alerts; _i < alerts_1.length; _i++) {
          alert_1 = alerts_1[_i]
          emoji =
            alert_1.type === 'error'
              ? '🚨'
              : alert_1.type === 'warning'
                ? '⚠️'
                : '📊'
          console.log(
            ''.concat(emoji, ' Bundle Monitor: ').concat(alert_1.message)
          )
          console.log(
            '   Current: '.concat(this.formatSize(alert_1.details.current))
          )
          console.log(
            '   Threshold: '.concat(this.formatSize(alert_1.details.threshold))
          )
          if (alert_1.details.percentage) {
            sign = alert_1.details.percentage > 0 ? '+' : ''
            console.log(
              '   Change: '.concat(sign).concat(alert_1.details.percentage, '%')
            )
          }
          // Trigger callback if provided
          if (this.alertCallback) {
            this.alertCallback(alert_1)
          }
        }
        return [2 /*return*/]
      })
    })
  }
  /**
   * Format bytes into human-readable string
   */
  BundleMonitor.prototype.formatSize = function (bytes) {
    var units = ['B', 'KB', 'MB', 'GB']
    var size = bytes
    var unitIndex = 0
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }
    return ''.concat(Math.round(size * 100) / 100, ' ').concat(units[unitIndex])
  }
  /**
   * Generate bundle size report
   */
  BundleMonitor.prototype.generateReport = function (stats, alerts) {
    var report = []
    report.push('# Bundle Size Report')
    report.push('')
    report.push('Generated: '.concat(new Date().toISOString()))
    if (stats.gitCommit) report.push('Git Commit: '.concat(stats.gitCommit))
    if (stats.buildId) report.push('Build ID: '.concat(stats.buildId))
    report.push('')
    // Summary
    report.push('## Summary')
    report.push('- Total Size: '.concat(this.formatSize(stats.totalSize)))
    report.push('- Gzipped Size: '.concat(this.formatSize(stats.gzippedSize)))
    report.push('- Chunks: '.concat(stats.chunks.length))
    report.push('- Assets: '.concat(stats.assets.length))
    report.push('')
    // Alerts
    if (alerts.length > 0) {
      report.push('## Alerts')
      for (var _i = 0, alerts_2 = alerts; _i < alerts_2.length; _i++) {
        var alert_2 = alerts_2[_i]
        var emoji =
          alert_2.type === 'error'
            ? '🚨'
            : alert_2.type === 'warning'
              ? '⚠️'
              : '📊'
        report.push(
          ''
            .concat(emoji, ' **')
            .concat(alert_2.type.toUpperCase(), '**: ')
            .concat(alert_2.message)
        )
        report.push(
          '   - Current: '.concat(this.formatSize(alert_2.details.current))
        )
        report.push(
          '   - Threshold: '.concat(this.formatSize(alert_2.details.threshold))
        )
        if (alert_2.details.percentage) {
          var sign = alert_2.details.percentage > 0 ? '+' : ''
          report.push(
            '   - Change: '.concat(sign).concat(alert_2.details.percentage, '%')
          )
        }
        report.push('')
      }
    }
    // Largest chunks
    report.push('## Largest Chunks')
    var largestChunks = __spreadArray([], stats.chunks, true)
      .sort(function (a, b) {
        return b.size - a.size
      })
      .slice(0, 10)
    for (
      var _a = 0, largestChunks_1 = largestChunks;
      _a < largestChunks_1.length;
      _a++
    ) {
      var chunk = largestChunks_1[_a]
      report.push(
        '- '
          .concat(chunk.name, ': ')
          .concat(this.formatSize(chunk.size), ' (')
          .concat(chunk.type, ')')
      )
    }
    report.push('')
    // Asset breakdown
    report.push('## Asset Breakdown')
    var assetTypes = stats.assets.reduce(function (acc, asset) {
      acc[asset.type] = (acc[asset.type] || 0) + asset.size
      return acc
    }, {})
    for (var _b = 0, _c = Object.entries(assetTypes); _b < _c.length; _b++) {
      var _d = _c[_b],
        type = _d[0],
        size = _d[1]
      report.push(
        '- '.concat(type.toUpperCase(), ': ').concat(this.formatSize(size))
      )
    }
    return report.join('\n')
  }
  return BundleMonitor
})()
exports.BundleMonitor = BundleMonitor
// Default budget configuration based on actual Next.js 15 App Router performance
exports.DEFAULT_BUNDLE_BUDGET = {
  // Total bundle limits - based on Next.js actual output of ~1.22-1.28MB
  maxTotalSize: 5200000, // 5.2MB for client bundles (uncompressed, accounts for CI 5% reduction)
  maxGzippedSize: 1500000, // 1.5MB gzipped (matches Next.js First Load JS target)
  // Individual chunk limits
  maxInitialChunkSize: 600000, // 600KB for initial chunks (vendor bundles can be large)
  maxAsyncChunkSize: 300000, // 300KB for async chunks
  // Asset type limits - realistic for a modern Next.js app
  maxJavaScriptSize: 4500000, // 4.5MB for all client JS (uncompressed)
  maxCSSSize: 200000, // 200KB for all CSS
  maxImageSize: 400000, // 400KB for all images
  maxFontSize: 700000, // 700KB for all fonts (current: 644KB)
  // Regression thresholds
  regressionThreshold: 10, // 10% increase triggers error
  warningThreshold: 5, // 5% increase triggers warning
}
