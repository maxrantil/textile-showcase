import { MetadataRoute } from 'next'
import { queries } from '@/sanity/queries'
import { resilientFetch } from '@/sanity/dataFetcher'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://idaromme.dk'
  
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ]

  // Dynamic project pages
  try {
    const projects = await resilientFetch<Array<{
      slug: { current: string }
      _updatedAt: string
    }>>(
      queries.getAllSlugs,
      {},
      { retries: 2, timeout: 5000 }
    )

    const projectPages: MetadataRoute.Sitemap = projects 
      ? projects.map((project) => ({
          url: `${baseUrl}/project/${project.slug.current}`,
          lastModified: new Date(project._updatedAt),
          changeFrequency: 'monthly' as const,
          priority: 0.7,
        }))
      : []

    return [...staticPages, ...projectPages]
  } catch (error) {
    console.error('Failed to generate sitemap:', error)
    return staticPages
  }
}
