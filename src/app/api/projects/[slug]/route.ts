// ABOUTME: API endpoint for fetching individual textile design projects with navigation
// Handles GET requests to /api/projects/[slug] for specific project details and navigation context

import { NextRequest, NextResponse } from 'next/server'
import { TextileDesign } from '@/types/textile'

interface RouteParams {
  params: Promise<{
    slug: string
  }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params
    console.log(`🔍 API: Fetching project with navigation: ${slug}`)

    // Server-side dynamic import - Sanity only loaded on API routes
    const [{ queries }, { resilientFetch }] = await Promise.all([
      import('@/sanity/queries'),
      import('@/sanity/dataFetcher'),
    ])

    // Fetch project and navigation data in parallel
    const [project, navigation] = await Promise.all([
      // Fetch main project data
      resilientFetch<TextileDesign>(
        queries.getProjectBySlug,
        { slug },
        {
          retries: 3,
          timeout: 15000,
          cache: true,
          cacheTTL: 600000,
        }
      ),
      // Fetch navigation context
      resilientFetch<{
        current: {
          _id: string
          title: string
          slug: { current: string }
          order: number
        } | null
        previous: {
          _id: string
          title: string
          slug: { current: string }
        } | null
        next: { _id: string; title: string; slug: { current: string } } | null
      }>(
        queries.getProjectNavigation,
        { slug },
        {
          retries: 2,
          timeout: 10000,
          cache: true,
          cacheTTL: 300000,
        }
      ),
    ])

    if (!project) {
      console.warn(`⚠️ API: Project not found: ${slug}`)
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Extract navigation data
    const nextProject = navigation?.next
      ? { slug: navigation.next.slug.current, title: navigation.next.title }
      : null

    const previousProject = navigation?.previous
      ? {
          slug: navigation.previous.slug.current,
          title: navigation.previous.title,
        }
      : null

    console.log(
      `✅ API: Project found with navigation: ${project.title} (previous=${previousProject?.title}, next=${nextProject?.title})`
    )

    const responseData = {
      project,
      nextProject,
      previousProject,
    }

    // Add cache headers for client-side caching
    const response = NextResponse.json(responseData, { status: 200 })
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=600, stale-while-revalidate=1200'
    )

    return response
  } catch (error) {
    const { slug } = await params
    console.error(`❌ API: Failed to fetch project ${slug}:`, error)

    return NextResponse.json(
      {
        error: 'Failed to fetch project',
        project: null,
      },
      { status: 500 }
    )
  }
}
