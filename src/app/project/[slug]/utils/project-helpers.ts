import { getOptimizedImageUrl } from '@/utils/image-helpers'
import { TextileDesign } from '@/types/textile'

export function generateProjectStructuredData(
  project: TextileDesign,
  slug: string
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: project.title,
    creator: {
      '@type': 'Person',
      name: 'Ida Romme',
    },
    description: project.description || project.detailedDescription,
    dateCreated: project.year ? `${project.year}-01-01` : undefined,
    material: project.materials,
    artMedium: 'Textile',
    artform: 'Weaving',
    image: project.image
      ? getOptimizedImageUrl(project.image, { width: 800, height: 600 })
      : undefined,
    url: `https://idaromme.dk/project/${slug}`,
    isPartOf: {
      '@type': 'Collection',
      name: 'Ida Romme Textile Collection',
    },
  }
}

export function validateProjectSlug(slug: string): boolean {
  return typeof slug === 'string' && slug.length > 0 && slug.length < 200
}

export function createProjectImageUrl(
  project: TextileDesign,
  options = { width: 1200, height: 630, quality: 80 } // Reduced from 90 to 80 for performance
) {
  return project.image ? getOptimizedImageUrl(project.image, options) : ''
}

export function createProjectDescription(project: TextileDesign): string {
  const materials = project.materials?.join(', ') || 'sustainable materials'
  return (
    project.description ||
    project.detailedDescription ||
    `Contemporary textile design by Ida Romme featuring ${materials}.`
  )
}

export function createProjectKeywords(project: TextileDesign): string[] {
  return [
    project.title,
    'textile design',
    ...(project.materials || []),
    ...(project.techniques || []),
    project.technique,
    'contemporary textiles',
    'Ida Romme',
  ].filter(Boolean) as string[]
}
