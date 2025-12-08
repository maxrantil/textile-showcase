// ABOUTME: Generates BreadcrumbList structured data for improved SEO and rich snippets
// Follows schema.org/BreadcrumbList specification for search engine visibility

const BASE_URL = 'https://idaromme.dk'

interface BreadcrumbItem {
  name: string
  path: string
}

interface ListItemSchema {
  '@type': 'ListItem'
  position: number
  name: string
  item: string
}

interface BreadcrumbListSchema {
  '@context': 'https://schema.org'
  '@type': 'BreadcrumbList'
  itemListElement: ListItemSchema[]
}

/**
 * Generate BreadcrumbList schema for a given page path
 * Used for rich snippets in search results
 */
export function generateBreadcrumbSchema(
  items: BreadcrumbItem[]
): BreadcrumbListSchema {
  const itemListElement: ListItemSchema[] = items.map((item, index) => ({
    '@type': 'ListItem' as const,
    position: index + 1,
    name: item.name,
    item: `${BASE_URL}${item.path}`,
  }))

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement,
  }
}

/**
 * Generate breadcrumb schema for project pages
 */
export function generateProjectBreadcrumbs(
  projectTitle: string,
  projectSlug: string
): BreadcrumbListSchema {
  return generateBreadcrumbSchema([
    { name: 'Home', path: '/' },
    { name: 'Projects', path: '/projects' },
    { name: projectTitle, path: `/project/${projectSlug}` },
  ])
}

/**
 * Generate breadcrumb schema for about page
 */
export function generateAboutBreadcrumbs(): BreadcrumbListSchema {
  return generateBreadcrumbSchema([
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
  ])
}

/**
 * Generate breadcrumb schema for contact page
 */
export function generateContactBreadcrumbs(): BreadcrumbListSchema {
  return generateBreadcrumbSchema([
    { name: 'Home', path: '/' },
    { name: 'Contact', path: '/contact' },
  ])
}
