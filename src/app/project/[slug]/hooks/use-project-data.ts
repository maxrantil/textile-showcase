// ABOUTME: Server-side data fetching for project pages — queries Sanity directly (no HTTP round-trip)
// Replaces the previous self-referencing HTTP call that caused cold-start hangs after PM2 restart

import { TextileDesign } from '@/types/textile'

export async function getProject(slug: string): Promise<TextileDesign | null> {
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔍 Fetching project from Sanity: ${slug}`)
    }

    const [{ queries }, { resilientFetch }] = await Promise.all([
      import('@/sanity/queries'),
      import('@/sanity/dataFetcher'),
    ])

    const project = await resilientFetch<TextileDesign>(
      queries.getProjectBySlug,
      { slug },
      {
        retries: 3,
        timeout: 15000,
        cache: true,
        cacheTTL: 600000,
      }
    )

    if (process.env.NODE_ENV === 'development') {
      if (project) {
        console.log(`✅ Project found: ${project.title}`)
      } else {
        console.warn(`⚠️ Project not found: ${slug}`)
      }
    }

    return project
  } catch (error) {
    console.error(`❌ Failed to fetch project ${slug}:`, error)
    return null
  }
}

export async function getAllProjectSlugs() {
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log('🏗️ Generating static params (build-time Sanity import)...')
    }

    // Build-time only: Direct Sanity import for generateStaticParams
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
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ No designs found for static generation')
      }
      return []
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ Found ${designs.length} designs for static generation`)
    }

    return designs
      .filter((design) => design.slug)
      .map((design) => ({
        slug: design.slug,
      }))
  } catch (error) {
    console.error('❌ Failed to generate static params:', error)
    return []
  }
}

export async function getProjectWithNavigation(slug: string): Promise<{
  project: TextileDesign | null
  nextProject?: { slug: string; title: string }
  previousProject?: { slug: string; title: string }
}> {
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔍 Fetching project with navigation from Sanity: ${slug}`)
    }

    const [{ queries }, { resilientFetch }] = await Promise.all([
      import('@/sanity/queries'),
      import('@/sanity/dataFetcher'),
    ])

    const [project, navigation] = await Promise.all([
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
      if (process.env.NODE_ENV === 'development') {
        console.warn(`⚠️ Project not found: ${slug}`)
      }
      return { project: null }
    }

    const nextProject = navigation?.next
      ? { slug: navigation.next.slug.current, title: navigation.next.title }
      : undefined

    const previousProject = navigation?.previous
      ? {
          slug: navigation.previous.slug.current,
          title: navigation.previous.title,
        }
      : undefined

    if (process.env.NODE_ENV === 'development') {
      console.log(
        `✅ Navigation data from Sanity: previous=${previousProject?.title}, next=${nextProject?.title}`
      )
    }

    return {
      project,
      nextProject,
      previousProject,
    }
  } catch (error) {
    console.error(
      `❌ Failed to fetch project with navigation ${slug}:`,
      error
    )
    return { project: null }
  }
}
