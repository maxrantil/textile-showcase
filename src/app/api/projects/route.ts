// ABOUTME: API endpoint for fetching all textile design projects
// Handles GET requests to /api/projects for listing all designs with caching and error handling

import { NextResponse } from 'next/server'
import { TextileDesign } from '@/types/textile'

export async function GET() {
  try {
    console.log('🔍 API: Fetching all projects')

    // Server-side dynamic import - Sanity only loaded on API routes
    const [{ queries }, { resilientFetch }] = await Promise.all([
      import('@/sanity/queries'),
      import('@/sanity/dataFetcher'),
    ])

    const designs = await resilientFetch<TextileDesign[]>(
      queries.getDesignsForHome,
      {},
      {
        retries: 3,
        timeout: 8000,
        cache: true,
        cacheTTL: 300000, // 5 minutes
      }
    )

    if (!designs || designs.length === 0) {
      console.warn('⚠️ API: No designs found')
      return NextResponse.json({ designs: [] }, { status: 200 })
    }

    console.log(`✅ API: Successfully fetched ${designs.length} projects`)

    // Add cache headers for client-side caching
    const response = NextResponse.json({ designs }, { status: 200 })
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=300, stale-while-revalidate=600'
    )

    return response
  } catch (error) {
    console.error('❌ API: Failed to fetch projects:', error)

    return NextResponse.json(
      {
        error: 'Failed to fetch projects',
        designs: [],
      },
      { status: 500 }
    )
  }
}
