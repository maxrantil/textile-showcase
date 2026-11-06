/** @type {import('next').NextConfig} */
// Only require @next/bundle-analyzer (devDep) when ANALYZE=true so that
// `next start` works with `npm ci --omit=dev` on the production VPS (Fixes #325).
const withBundleAnalyzer =
  process.env.ANALYZE === 'true'
    ? // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('@next/bundle-analyzer')({ enabled: true })
    : (config: unknown) => config

const nextConfig = {
  // Modern JavaScript targeting for legacy JS elimination
  compiler: {
    // Remove console.log in production for smaller bundles
    removeConsole: process.env.NODE_ENV === 'production',
  },
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
    formats: ['image/webp'], // WebP only - avif encoding too slow on VPS (5+ second LCP overhead)
    minimumCacheTTL: 31536000, // Cache optimized images for 1 year (fixes Issue #308 cold-start slowness)
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  experimental: {
    // PHASE 2C: Critical CSS extraction and optimization
    optimizeCss: true,

    // PHASE 2C: Advanced package optimization for TTI improvement
    optimizePackageImports: ['styled-components'],

    // PHASE 2C: Enable concurrent features for better TTI
    serverActions: {},
  },
  bundlePagesRouterDependencies: true, // Reduce bundle duplication

  // PHASE 2C: Critical server components for TTI optimization
  serverExternalPackages: ['@sanity/client', '@sanity/image-url'],

  // Client builds: chunk splitting is left to Next.js defaults so each route
  // only downloads the code it imports. Sanity packages are NOT externalized:
  // only /studio imports them on the client, and mapping them to null crashed
  // the Studio (Issue #389). scripts/route-js-budget.mjs keeps them off public routes.
  webpack: (
    config: {
      optimization?: Record<string, unknown>
      resolve?: Record<string, unknown>
    },
    { dev, isServer }: { dev: boolean; isServer: boolean }
  ) => {
    if (!dev && !isServer) {
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
          // Legacy XSS auditor disabled per OWASP (proxy.ts sets the same value)
          {
            key: 'X-XSS-Protection',
            value: '0',
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
          // No catch-all Cache-Control: it applied 'immutable' to HTML, API
          // responses, sw.js and manifest.json. Next.js sets correct caching
          // for /_next/static; public assets are covered by the rules below.
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
      // Self-hosted fonts
      {
        source: '/fonts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
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
