import { Metadata } from 'next'

export { viewport } from 'next-sanity/studio'

export const metadata: Metadata = {
  title: 'Textile Showcase CMS',
  robots: {
    index: false, // Don't index the admin area
  },
}

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
