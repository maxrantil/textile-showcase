import { TextileDesign } from '@/types/textile'

export async function getProject(slug: string): Promise<TextileDesign | null> {
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔍 Fetching project from API: ${slug}`)
    }

    // Fetch from our API route instead of direct Sanity queries
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/projects/${slug}`, {
      // Enable ISR caching
      next: { revalidate: 3600 }, // 1 hour
    })

    if (!response.ok) {
      if (response.status === 404) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`⚠️ Project not found: ${slug}`)
        }
        return null
      }
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          `⚠️ API responded with status: ${response.status} for ${slug}`
        )
      }
      return null
    }

    const data = await response.json()
    const project = data.project

    if (process.env.NODE_ENV === 'development') {
      if (project) {
        console.log(`✅ Project found: ${project.title}`)
      } else {
        console.warn(`⚠️ Project not found: ${slug}`)
      }
    }

    return project
  } catch (error) {
    console.error(`❌ Failed to fetch project ${slug} from API:`, error)
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
      console.log(`🔍 Fetching project with navigation from API: ${slug}`)
    }

    // Fetch from our API route instead of direct Sanity queries
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/projects/${slug}`, {
      // Enable ISR caching
      next: { revalidate: 3600 }, // 1 hour
    })

    if (!response.ok) {
      if (response.status === 404) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`⚠️ Project not found: ${slug}`)
        }
        return { project: null }
      }
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          `⚠️ API responded with status: ${response.status} for ${slug}`
        )
      }
      return { project: null }
    }

    const data = await response.json()

    if (!data.project) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`⚠️ Project not found: ${slug}`)
      }
      return { project: null }
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(
        `✅ Navigation data from API: previous=${data.previousProject?.title}, next=${data.nextProject?.title}`
      )
    }

    return {
      project: data.project,
      nextProject: data.nextProject,
      previousProject: data.previousProject,
    }
  } catch (error) {
    console.error(
      `❌ Failed to fetch project with navigation ${slug} from API:`,
      error
    )
    return { project: null }
  }
}
