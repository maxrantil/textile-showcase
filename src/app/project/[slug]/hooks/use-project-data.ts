import { TextileDesign } from '@/sanity/types'

export async function getProject(slug: string): Promise<TextileDesign | null> {
  try {
    console.log(`🔍 Fetching project: ${slug}`)

    // Dynamic import to prevent Sanity from being bundled in main chunk
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

    if (project) {
      console.log(`✅ Project found: ${project.title}`)
    } else {
      console.warn(`⚠️ Project not found: ${slug}`)
    }

    return project
  } catch (error) {
    console.error(`❌ Failed to fetch project ${slug}:`, error)
    return null
  }
}

export async function getAllProjectSlugs() {
  try {
    console.log('🏗️ Generating static params...')

    // Dynamic import to prevent Sanity from being bundled in main chunk
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
      console.warn('⚠️ No designs found for static generation')
      return []
    }

    console.log(`✅ Found ${designs.length} designs for static generation`)

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
    console.log(`🔍 Fetching project with navigation: ${slug}`)

    // Dynamic import to prevent Sanity from being bundled in main chunk
    const [{ queries }, { resilientFetch }] = await Promise.all([
      import('@/sanity/queries'),
      import('@/sanity/dataFetcher'),
    ])

    // Fetch current project and navigation data
    const [project, navigation] = await Promise.all([
      getProject(slug),
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
      console.warn(`⚠️ Project not found: ${slug}`)
      return { project: null }
    }

    // Extract navigation data
    const nextProject = navigation?.next
      ? { slug: navigation.next.slug.current, title: navigation.next.title }
      : undefined

    const previousProject = navigation?.previous
      ? {
          slug: navigation.previous.slug.current,
          title: navigation.previous.title,
        }
      : undefined

    console.log(
      `✅ Navigation data: previous=${previousProject?.title}, next=${nextProject?.title}`
    )

    return {
      project,
      nextProject,
      previousProject,
    }
  } catch (error) {
    console.error(`❌ Failed to fetch project with navigation ${slug}:`, error)
    return { project: null }
  }
}
