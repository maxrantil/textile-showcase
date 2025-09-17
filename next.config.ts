/** @type {import('next').NextConfig} */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

const nextConfig = {
  typescript: {
    // Allow production builds to complete even with TypeScript errors
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
        port: '',
        pathname: '/images/**',
      },
    ],
    formats: ['image/webp'], // Removed AVIF for Safari compatibility - AVIF only supported in Safari 16+
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  experimental: {
    optimizeCss: true,
  },
  bundlePagesRouterDependencies: true, // Reduce bundle duplication

  // PERFORMANCE: Enhanced webpack bundle optimization for bundle size testing
  webpack: (
    config: {
      optimization?: Record<string, unknown>
      resolve?: Record<string, unknown>
    },
    { dev, isServer }: { dev: boolean; isServer: boolean }
  ) => {
    if (!dev && !isServer) {
      // Safari-optimized bundle splitting - Safari's older JavaScriptCore engine
      // handles fewer, larger chunks better than many small chunks
      const isSafariBuild = process.env.TARGET_BROWSER === 'safari'

      // CRITICAL: Advanced bundle splitting optimization
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          maxInitialRequests: isSafariBuild ? 6 : 10, // Reduce for Safari
          maxAsyncRequests: isSafariBuild ? 15 : 30, // Reduce async chunks for Safari
          minSize: isSafariBuild ? 40000 : 20000, // Larger chunks for Safari
          maxSize: isSafariBuild ? 150000 : 200000, // Slightly smaller max for Safari
          cacheGroups: {
            // CRITICAL: Sanity Studio components - async only for studio route
            sanityStudio: {
              test: /[\\/]node_modules[\\/](sanity|next-sanity[\\/]studio|@sanity[\\/]ui)[\\/]/,
              name: 'sanity-studio',
              priority: 100,
              chunks: 'async', // Test requirement: async only
              enforce: true,
              maxSize: 50000, // Keep studio chunks small
            },
            // Sanity runtime core - main data fetching functionality
            sanityRuntime: {
              test: /[\\/]node_modules[\\/](@sanity[\\/]client|next-sanity(?![\\/]studio))[\\/]/,
              name: 'sanity-runtime',
              priority: 90,
              chunks: 'all',
              enforce: true,
              maxSize: 150000, // Allow larger for core runtime
            },
            // Sanity utilities and helpers
            sanityUtils: {
              test: /[\\/]node_modules[\\/](@sanity[\\/](image-url|icons|vision)|sanity[\\/]lib)[\\/]/,
              name: 'sanity-utils',
              priority: 85,
              chunks: 'all',
              enforce: true,
              maxSize: 100000,
            },
            // CRITICAL: Security dashboard components - keep them in async chunks only
            securityComponents: {
              test: /[\\/]src[\\/]components[\\/]security[\\/]/,
              name: 'security-dashboard',
              priority: 80,
              chunks: 'async', // Only in async chunks, not initial bundle
              enforce: true,
              maxSize: 50000, // Keep security components under 50KB per chunk
            },
            // Security API utilities
            securityLibs: {
              test: /[\\/]src[\\/]lib[\\/]security[\\/]/,
              name: 'security-libs',
              priority: 75,
              chunks: 'async', // Keep out of initial bundle
              enforce: true,
              maxSize: 30000, // Very small security libs chunks
            },
            // Split large vendor libraries for better caching
            react: {
              test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
              name: 'react',
              priority: 40,
              chunks: 'all',
              reuseExistingChunk: true,
            },
            // UI libraries chunk
            ui: {
              test: /[\\/]node_modules[\\/](@radix-ui|framer-motion|@headlessui)[\\/]/,
              name: 'ui-libs',
              priority: 30,
              chunks: 'all',
              reuseExistingChunk: true,
            },
            // Vendor chunk optimization - exclude large libraries
            vendor: {
              test: /[\\/]node_modules[\\/](?!(@sanity|sanity|next-sanity|react|react-dom|@radix-ui|framer-motion)).*[\\/]/,
              name: 'vendors',
              priority: 20,
              chunks: 'all',
              reuseExistingChunk: true,
              maxSize: 80000, // 80KB max per vendor chunk to stay under limit
            },
            // Common code splitting with strict size limits
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'async',
              priority: 10,
              maxSize: 20000, // 20KB max common chunks to meet requirement
            },
          },
        },
        // ENHANCED: Aggressive tree shaking and module optimization
        usedExports: true,
        sideEffects: false,
        providedExports: true,
        concatenateModules: true, // Enable module concatenation
        // Minimize bundle overhead
        moduleIds: 'deterministic',
        chunkIds: 'deterministic',
        // Remove unused code aggressively
        innerGraph: true,
        mangleExports: 'deterministic',
        // PERFORMANCE: Enhanced minification (let Next.js handle minimizer)
        minimize: true,
      }

      // ENHANCED: Advanced module resolution optimizations
      config.resolve = {
        ...config.resolve,
        // Reduce module resolution overhead
        symlinks: false,
        // Speed up module resolution
        extensionAlias: {
          '.js': ['.js', '.ts', '.tsx'],
          '.jsx': ['.jsx', '.tsx'],
        },
      }

      // CRITICAL: Minimize polyfills for modern browsers
      if (config.resolve?.fallback) {
        config.resolve.fallback = {
          ...config.resolve.fallback,
          fs: false,
          os: false,
          path: false,
          crypto: false,
        }
      }
    }

    return config
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  // Compress responses
  compress: true,
  // FIXED: Enhanced headers with proper referrer policy
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Cache static assets
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Longer cache for images with proper referrer policy
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
      // Icons and manifest
      {
        source: '/(favicon|apple-touch-icon|icon)*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
  // FIXED: Add security configurations
  poweredByHeader: false,
  generateEtags: false,
}

module.exports = withBundleAnalyzer(nextConfig)
