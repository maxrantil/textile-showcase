import { Metadata } from 'next'
import { getProject } from '../hooks/use-project-data'
import { 
  createProjectImageUrl, 
  createProjectDescription, 
  createProjectKeywords 
} from '../utils/project-helpers'

interface ProjectMetadataProps {
  slug: string
}

export async function generateProjectMetadata({ slug }: ProjectMetadataProps): Promise<Metadata> {
  try {
    const project = await getProject(slug)
    
    if (!project) {
      return {
        title: 'Project Not Found - Ida Romme',
        description: 'The requested textile project could not be found.',
      }
    }

    const imageUrl = createProjectImageUrl(project)
    const title = `${project.title} - Ida Romme`
    const description = createProjectDescription(project)
    const keywords = createProjectKeywords(project)

    return {
      title,
      description,
      keywords,
      openGraph: {
        title,
        description,
        type: 'article',
        url: `https://idaromme.dk/project/${slug}`,
        images: imageUrl ? [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: project.title,
          }
        ] : [],
        publishedTime: project.year ? `${project.year}-01-01` : undefined,
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: imageUrl ? [imageUrl] : [],
      },
      alternates: {
        canonical: `https://idaromme.dk/project/${slug}`,
      },
    }
  } catch (error) {
    console.error('❌ Failed to generate metadata:', error)
    return {
      title: 'Project - Ida Romme',
      description: 'Contemporary textile design by Ida Romme.',
    }
  }
}
