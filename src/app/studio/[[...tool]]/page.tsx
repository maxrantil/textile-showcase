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

// PERFORMANCE: Lazy load the studio configuration (schemas, plugins).
// NextStudio creates its own authenticated client from this config.
async function loadStudioDependencies() {
  const configModule = await import('../../../../sanity.config')
  return { config: configModule.default }
}

export default function StudioPage() {
  const [dependencies, setDependencies] = useState<{ config: Config } | null>(
    null
  )

  useEffect(() => {
    loadStudioDependencies().then((loaded) => {
      setDependencies(loaded)
    })
  }, [])

  if (!dependencies) {
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
      <NextStudio config={dependencies.config} />
    </Suspense>
  )
}
