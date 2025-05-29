import { client } from '@/lib/sanity'
import { TextileDesign } from '@/types/sanity'
import HorizontalGallery from '@/components/HorizontalGallery'

async function getDesigns(): Promise<TextileDesign[]> {
  const query = `
    *[_type == "textileDesign"] | order(_createdAt desc) {
      _id,
      title,
      slug,
      image,
      description,
      year,
      materials,
      dimensions,
      featured
    }
  `
  
  try {
    return await client.fetch(query)
  } catch (error) {
    console.error('Failed to fetch designs:', error)
    return []
  }
}

export default async function Home() {
  const designs = await getDesigns()
  return <HorizontalGallery designs={designs} />
}
