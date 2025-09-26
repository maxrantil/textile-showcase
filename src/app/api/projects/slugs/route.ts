// ABOUTME: API endpoint for fetching project slugs for static generation
// Handles GET requests to /api/projects/slugs for generateStaticParams and build-time operations

import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('🏗️ API: Generating static params via API...')

    // Server-side dynamic import - Sanity only loaded on API routes
    const [{ queries }, { resilientFetch }] = await Promise.all([
      import('@/sanity/queries'),
      import('@/sanity/dataFetcher'),
    ])

    const designs = await resilientFetch<
      Array<{ slug: string; _updatedAt: string }>
    >(
      queries.getAllSlugs,
      {},
      {
        retries: 2,
        timeout: 20000,
        cache: true,
        cacheTTL: 300000,
      }
    )

    if (!designs || designs.length === 0) {
      console.warn('⚠️ API: No designs found for static generation')
      return NextResponse.json({ slugs: [] }, { status: 200 })
    }

    const slugs = designs
      .filter((design) => design.slug)
      .map((design) => ({
        slug: design.slug,
      }))

    console.log(`✅ API: Found ${slugs.length} slugs for static generation`)

    // Shorter cache for build-time data
    const response = NextResponse.json({ slugs }, { status: 200 })
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=180, stale-while-revalidate=360'
    )

    return response
  } catch (error) {
    console.error('❌ API: Failed to generate static params:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch slugs',
        slugs: [],
      },
      { status: 500 }
    )
  }
}
