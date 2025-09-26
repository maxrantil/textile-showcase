// ABOUTME: Advanced tree shaking configuration for unused JavaScript elimination
import type { Configuration } from 'webpack'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const webpack = require('webpack')

export const treeShakingConfig: Partial<Configuration> = {
  // Eliminate unused exports
  optimization: {
    usedExports: true,
    innerGraph: true, // Enable advanced dependency analysis
    sideEffects: false,
    providedExports: true,
  },

  // Module resolution for tree shaking
  resolve: {
    mainFields: ['browser', 'module', 'main'],
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
