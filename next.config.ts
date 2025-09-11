/** @type {import('next').NextConfig} */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
        port: '',
        pathname: '/images/**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
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
      // CRITICAL: Advanced bundle splitting optimization
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          maxInitialRequests: 10, // Lower to reduce initial bundle size
          maxAsyncRequests: 30,
          minSize: 20000,
          maxSize: 200000, // Smaller chunks
          cacheGroups: {
            // CRITICAL: Studio chunks - should never be in initial bundle
            sanityStudio: {
              test: /[\\/]node_modules[\\/](next-sanity)[\\/].*studio/,
              name: 'sanity-studio',
              priority: 100,
              chunks: 'async',
              enforce: true,
            },
            // CRITICAL: Large Sanity runtime - split but don't force async (needed for SSR)
            sanityRuntime: {
              test: /[\\/]node_modules[\\/](@sanity\/client|sanity)[\\/]/,
              name: 'sanity-runtime',
              priority: 90,
              chunks: 'all', // Allow in both sync and async
              enforce: true,
              maxSize: 200000, // Split large chunks
            },
            // Smaller Sanity utilities
            sanityUtils: {
              test: /[\\/]node_modules[\\/](@sanity|next-sanity)[\\/]/,
              name: 'sanity-utils',
              priority: 85,
              chunks: 'all',
              enforce: true,
              maxSize: 150000,
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
              maxSize: 200000, // 200KB max per vendor chunk
            },
            // Common code splitting with size limits
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'async',
              priority: 10,
              maxSize: 100000, // 100KB max common chunks
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
  // Handle build optimization
  typescript: {
    ignoreBuildErrors: false,
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
        source: '/:path*',
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
            value: 'SAMEORIGIN',
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
