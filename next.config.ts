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

  // PERFORMANCE: Webpack bundle optimization for TDD tests
  webpack: (
    config: { optimization?: Record<string, unknown> },
    { dev, isServer }: { dev: boolean; isServer: boolean }
  ) => {
    if (!dev && !isServer) {
      // Bundle splitting optimization
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            // CRITICAL: Isolate Sanity Studio (fixes 1.44MB issue)
            sanity: {
              test: /[\\/]node_modules[\\/](@sanity|sanity)[\\/]/,
              name: 'sanity',
              priority: 30,
              chunks: 'all',
              enforce: true,
              reuseExistingChunk: false, // Force separate chunk
            },
            // Vendor chunk optimization - exclude Sanity completely
            vendor: {
              test: /[\\/]node_modules[\\/](?!(@sanity|sanity)).*[\\/]/,
              name: 'vendors',
              priority: 20,
              chunks: 'all',
              reuseExistingChunk: true,
            },
            // Common code splitting
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'async',
              priority: 10,
            },
          },
        },
        // Enhanced tree shaking
        usedExports: true,
        sideEffects: false,
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
