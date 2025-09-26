import { ClientProjectContent } from '@/components/ClientProjectContent'

interface ProjectPageProps {
  params: Promise<{
    slug: string
  }>
}

// Disable static generation - fully dynamic routing with client-side data fetching
export const dynamic = 'force-dynamic'

// Generate static metadata (no dynamic data fetching)
export async function generateMetadata({ params }: ProjectPageProps) {
  const { slug } = await params

  return {
    title: `${slug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())} - Ida Romme`,
    description:
      'Contemporary textile design project by Ida Romme, featuring sustainable hand-woven pieces.',
    openGraph: {
      title: `${slug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())} - Ida Romme`,
      description: 'Contemporary textile design project by Ida Romme',
      type: 'article',
      url: `https://idaromme.dk/project/${slug}`,
    },
    alternates: {
      canonical: `https://idaromme.dk/project/${slug}`,
    },
  }
}

// Main page component
export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params

  return <ClientProjectContent slug={slug} />
}
