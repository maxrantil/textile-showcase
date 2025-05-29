import { client } from '@/lib/sanity'
import { TextileDesign } from '@/types/sanity'
import { notFound } from 'next/navigation'
import ImageCarousel from '@/components/ImageCarousel'

interface ProjectPageProps {
  params: Promise<{
    slug: string
  }>
}

async function getProject(slug: string): Promise<TextileDesign | null> {
  const query = `
    *[_type == "textileDesign" && (slug.current == $slug || _id == $slug)][0] {
      _id,
      title,
      slug,
      image,
      gallery[] {
        _key,
        asset,
        caption
      },
      description,
      detailedDescription,
      year,
      materials,
      dimensions,
      technique,
      featured
    }
  `
  
  try {
    const project = await client.fetch(query, { slug })
    return project || null
  } catch (error) {
    console.error('Failed to fetch project:', error)
    return null
  }
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params
  const project = await getProject(slug)
  
  if (!project) {
    notFound()
  }

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa' }}>
      {/* Smaller space for header - matching main page */}
      <div style={{ height: '80px' }} />

      {/* Project Content - no extra padding since ImageCarousel handles centering */}
      <div style={{ paddingBottom: '40px' }}>
        <ImageCarousel 
          images={project.gallery || []}
          mainImage={project.image}
          projectTitle={project.title}
          projectYear={project.year}
          projectDescription={project.detailedDescription || project.description}
          projectMaterials={project.materials}
          projectTechnique={project.technique}
          projectDimensions={project.dimensions}
        />
      </div>
    </div>
  )
}
