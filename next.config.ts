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
    // Enhanced build optimization per PDR Phase 1
    optimizePackageImports: [
      '@sanity/client',
      'styled-components',
      'next-sanity',
    ],
  },
  bundlePagesRouterDependencies: true, // Reduce bundle duplication

  // PERFORMANCE: Phase 1 Bundle Consolidation - Strategic 4-chunk approach
  webpack: (
    config: {
      optimization?: Record<string, unknown>
      resolve?: Record<string, unknown>
      externals?: Record<string, unknown>
    },
    { dev, isServer }: { dev: boolean; isServer: boolean }
  ) => {
    if (!dev && !isServer) {
      // PHASE 4: Exclude Sanity dependencies from client-side bundles
      config.externals = {
        ...config.externals,
        // Externalize all Sanity packages for client-side builds
        '@sanity/client': 'null',
        '@sanity/image-url': 'null',
        '@sanity/vision': 'null',
        'next-sanity': 'null',
        sanity: 'null',
        '@sanity/icons': 'null',
        '@sanity/ui': 'null',
        '@sanity/desk': 'null',
        '@sanity/types': 'null',
        '@sanity/mutator': 'null',
        '@sanity/diff': 'null',
        '@sanity/util': 'null',
      }

      // CRITICAL: Strategic bundle consolidation from PDR Phase 1 - Aggressive approach
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          maxInitialRequests: 4, // Strict 4-chunk limit per PDR
          maxAsyncRequests: 6, // Very conservative async limit
          minSize: 50000, // Larger minimum to force consolidation
          maxSize: 500000, // Larger max to allow strategic grouping
          enforceSizeThreshold: 400000, // Force consolidation below this size

          cacheGroups: {
            // Disable default cache groups to prevent fragmentation
            default: false,
            defaultVendors: false,

            // CRITICAL: Framework chunk (highest priority) - Allow larger size for consolidation
            framework: {
              test: /[\\/]node_modules[\\/](react|react-dom|next|scheduler|react-is)[\\/]/,
              name: 'framework',
              priority: 50,
              chunks: 'all',
              enforce: true,
              minSize: 0,
              maxSize: 400000, // Increased to allow consolidation
            },

            // PHASE 4: Sanity cache group removed - externalized instead

            // Styled Components + UI Libraries - Consolidated
            styledSystem: {
              test: /[\\/]node_modules[\\/](styled-components|@emotion|@radix-ui|framer-motion)[\\/]/,
              name: 'styled-system',
              priority: 35,
              chunks: 'all',
              enforce: true,
              minSize: 0,
              maxSize: 300000,
            },

            // ALL OTHER vendor libraries (massive consolidation)
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendor',
              priority: 10,
              chunks: 'all',
              enforce: true,
              minSize: 0,
              maxSize: 600000, // Large consolidation chunk
              minChunks: 1,
            },
          },
        },

        // Enhanced tree shaking per PDR
        usedExports: true,
        innerGraph: true, // Advanced tree shaking per PDR
        sideEffects: false,
        providedExports: true,

        // Module concatenation for better performance per PDR
        concatenateModules: true,
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
          // EMERGENCY: Preconnect to critical resources (Issue #39)
          {
            key: 'Link',
            value: '<https://cdn.sanity.io>; rel=preconnect; crossorigin',
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
