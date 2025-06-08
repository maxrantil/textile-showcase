import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://idaromme.dk'

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/', // Hide API routes
        '/_next/', // Hide Next.js internals
        '/admin/', // Hide any admin routes
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
