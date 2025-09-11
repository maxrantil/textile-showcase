/**
 * This route is responsible for the built-in authoring environment using Sanity Studio.
 * All routes under your studio path is handled by this file using Next.js' catch-all routes:
 * https://nextjs.org/docs/routing/dynamic-routes#catch-all-routes
 *
 * You can learn more about the next-sanity package here:
 * https://github.com/sanity-io/next-sanity
 */

'use client'

import dynamic from 'next/dynamic'
import { Suspense, useState, useEffect } from 'react'
import type { Config } from 'sanity'

// PERFORMANCE: Dynamic import with loading optimization for Sanity Studio
const NextStudio = dynamic(
  () =>
    import('next-sanity/studio').then((mod) => ({ default: mod.NextStudio })),
  {
    loading: () => (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    ),
    ssr: false, // Studio is client-only
  }
)

// PERFORMANCE: Lazy load studio config to reduce initial bundle
async function loadStudioConfig() {
  const configModule = await import('../../../../sanity.config')
  return configModule.default
}

export default function StudioPage() {
  const [config, setConfig] = useState<Config | null>(null)

  useEffect(() => {
    loadStudioConfig().then((loadedConfig) => {
      setConfig(loadedConfig)
    })
  }, [])

  if (!config) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        </div>
      }
    >
      <NextStudio config={config} />
    </Suspense>
  )
}
