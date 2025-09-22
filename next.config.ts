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
    formats: ['image/avif', 'image/webp'], // AVIF first for better compression, WebP fallback
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
          maxAsyncRequests: isSafariBuild ? 12 : 25, // Conservative chunk limits
          minSize: isSafariBuild ? 50000 : 30000, // Larger minimum chunks
          maxSize: isSafariBuild ? 200000 : 250000, // Allow bigger chunks
          cacheGroups: {
            // CRITICAL: Balanced Sanity Studio chunking strategy
            sanityStudioCore: {
              test: /[\\/]node_modules[\\/](sanity[\\/](lib|desk|form)|@sanity[\\/]ui[\\/]core)[\\/]/,
              name: 'sanity-studio-core',
              priority: 105,
              chunks: 'async',
              enforce: true,
              maxSize: 80000, // Reasonable chunks for core studio
            },
            sanityStudioComponents: {
              test: /[\\/]node_modules[\\/](@sanity[\\/]ui|next-sanity[\\/]studio)[\\/]/,
              name: 'sanity-studio-components',
              priority: 100,
              chunks: 'async',
              enforce: true,
              maxSize: 100000, // Larger component chunks for efficiency
            },
            sanityStudioPlugins: {
              test: /[\\/]node_modules[\\/](sanity[\\/]plugins|@sanity[\\/](vision|structure))[\\/]/,
              name: 'sanity-studio-plugins',
              priority: 95,
              chunks: 'async',
              enforce: true,
              maxSize: 60000, // Medium plugin chunks
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
            // CRITICAL: Aggressive vendor chunk consolidation to reduce HTTP requests
            // Split into 3 strategic chunks instead of 13+ fragments
            vendorCore: {
              test: /[\\/]node_modules[\\/](next|react-is|scheduler)[\\/]/,
              name: 'vendor-core',
              priority: 25,
              chunks: 'all',
              enforce: true,
              maxSize: 200000, // 200KB for core Next.js
            },
            vendorUtils: {
              test: /[\\/]node_modules[\\/](?!(@sanity|sanity|next-sanity|react|react-dom|next|react-is|scheduler|styled-components)).*[\\/]/,
              name: 'vendor-utils',
              priority: 20,
              chunks: 'all',
              reuseExistingChunk: true,
              maxSize: 300000, // 300KB consolidated chunk for utilities
            },
            vendorStyles: {
              test: /[\\/]node_modules[\\/](styled-components|@emotion)[\\/]/,
              name: 'vendor-styles',
              priority: 22,
              chunks: 'all',
              reuseExistingChunk: true,
              maxSize: 150000, // 150KB for styling libraries
            },
            // Common code splitting with proper size limits
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'async',
              priority: 10,
              minSize: 10000, // 10KB minimum
              maxSize: 50000, // 50KB max common chunks
            },
          },
        },
        // Basic optimization settings to reduce memory usage
        usedExports: true,
        sideEffects: false,
        providedExports: true,
        moduleIds: 'deterministic',
        chunkIds: 'deterministic',
        removeEmptyChunks: true,
        mergeDuplicateChunks: true,
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

      // CRITICAL: Minimize polyfills for modern browsers (targeting ES2020+)
      if (config.resolve?.fallback) {
        config.resolve.fallback = {
          ...config.resolve.fallback,
          fs: false,
          os: false,
          path: false,
          crypto: false,
          stream: false,
          buffer: false,
          util: false,
          url: false,
          querystring: false,
        }
      }

      // PERFORMANCE: Target modern browsers to reduce polyfill overhead
      // Note: target property is deprecated, using environment through other means
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
