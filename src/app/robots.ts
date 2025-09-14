import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://idaromme.dk'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/', // Hide API routes
          '/_next/', // Hide Next.js internals
          '/admin/', // Hide any admin routes
          '/studio/', // Hide Sanity Studio
          '/*.json$', // Hide JSON files
          '/404', // Hide 404 page from search results
          '/500', // Hide error pages
          '/tmp/', // Hide temporary files
          '/cache/', // Hide cache directory
        ],
        crawlDelay: 1, // Be respectful to server resources
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/api/', '/_next/', '/admin/', '/studio/'],
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: ['/api/', '/_next/', '/admin/', '/studio/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
