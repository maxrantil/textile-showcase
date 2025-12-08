import { getOptimizedImageUrl } from '@/utils/image-helpers'
import { TextileDesign } from '@/types/textile'

/**
 * Generate VisualArtwork structured data for a textile project
 * VisualArtwork is more specific than CreativeWork for art pieces
 * @see https://schema.org/VisualArtwork
 */
export function generateProjectStructuredData(
  project: TextileDesign,
  slug: string
) {
  const imageUrl = project.image
    ? getOptimizedImageUrl(project.image, { width: 1200, height: 800, quality: 85 })
    : undefined

  return {
    '@context': 'https://schema.org',
    '@type': 'VisualArtwork',
    name: project.title,
    description: project.description || project.detailedDescription,
    url: `https://idaromme.dk/project/${slug}`,
    image: imageUrl,
    dateCreated: project.year ? `${project.year}-01-01` : undefined,
    artMedium: project.materials?.join(', ') || 'Textile',
    artform: project.technique || 'Hand Weaving',
    artworkSurface: 'Textile',
    genre: ['Contemporary Art', 'Textile Art', 'Nordic Design', 'Fiber Art'],
    creator: {
      '@type': 'Person',
      name: 'Ida Romme',
      url: 'https://idaromme.dk',
      jobTitle: 'Contemporary Textile Designer',
      sameAs: ['https://www.instagram.com/idaromme'],
    },
    isPartOf: {
      '@type': 'Collection',
      name: 'Ida Romme Textile Portfolio',
      url: 'https://idaromme.dk',
    },
    copyrightHolder: {
      '@type': 'Person',
      name: 'Ida Romme',
    },
    copyrightYear: project.year,
    inLanguage: 'en',
  }
}

export function validateProjectSlug(slug: string): boolean {
  return typeof slug === 'string' && slug.length > 0 && slug.length < 200
}

// Default OG image for social sharing when project has no image
// TODO: Replace with a branded 1200x630 image (og-default.jpg in public/)
const DEFAULT_OG_IMAGE = 'https://idaromme.dk/images/placeholder.jpg'

export function createProjectImageUrl(
  project: TextileDesign,
  options = { width: 1200, height: 630, quality: 80 } // Reduced from 90 to 80 for performance
): string {
  if (!project.image) {
    return DEFAULT_OG_IMAGE
  }

  const imageUrl = getOptimizedImageUrl(project.image, options)
  // Return default if image URL generation failed (empty string)
  return imageUrl || DEFAULT_OG_IMAGE
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
