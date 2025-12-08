import { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://idaromme.dk'

  // Static pages with enhanced SEO prioritization
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0, // Highest priority for homepage
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9, // High priority for artist statement
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8, // Important for commissions
    },
    // Future content pages (commented for now, uncomment when created)
    // {
    //   url: `${baseUrl}/process`,
    //   lastModified: new Date(),
    //   changeFrequency: 'monthly',
    //   priority: 0.7,
    // },
    // {
    //   url: `${baseUrl}/sustainability`,
    //   lastModified: new Date(),
    //   changeFrequency: 'monthly',
    //   priority: 0.7,
    // },
    // {
    //   url: `${baseUrl}/exhibitions`,
    //   lastModified: new Date(),
    //   changeFrequency: 'monthly',
    //   priority: 0.6,
    // },
    // {
    //   url: `${baseUrl}/collections`,
    //   lastModified: new Date(),
    //   changeFrequency: 'weekly',
    //   priority: 0.8,
    // },
  ]

  // Dynamic project pages
  try {
    // Dynamic import to prevent Sanity from being bundled in main chunk
    const [{ queries }, { resilientFetch }] = await Promise.all([
      import('@/sanity/queries'),
      import('@/sanity/dataFetcher'),
    ])

    // Note: seoQueries.getAllSlugs returns { slug: string } not { slug: { current: string } }
    // The query uses: "slug": slug.current which extracts the string directly
    const projects = await resilientFetch<
      Array<{
        slug: string
        _updatedAt: string
      }>
    >(queries.getAllSlugs, {}, { retries: 2, timeout: 5000 })

    const projectPages: MetadataRoute.Sitemap = projects
      ? projects.map((project) => ({
          url: `${baseUrl}/project/${project.slug}`,
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
