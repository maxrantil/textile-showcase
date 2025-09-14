import { Metadata } from 'next'

export const metadata: Metadata = {
  title:
    'Commission Contemporary Textile Art | Collaborate with Nordic Designer',
  description:
    'Commission custom contemporary textile artwork from Ida Romme. Specializing in sustainable hand-woven pieces, color exploration, and Scandinavian design aesthetics for galleries and collectors.',
  keywords: [
    'commission textile artwork',
    'textile design collaboration',
    'contemporary craft commission',
    'hire textile designer',
    'custom weaving services',
    'Nordic textile consultant',
    'commission contemporary textile',
    'bespoke Nordic textile art',
    'hire sustainable textile designer',
    'custom hand woven textiles',
    'textile art commission Stockholm',
  ],
  openGraph: {
    title:
      'Commission Contemporary Textile Art | Collaborate with Nordic Designer Ida Romme',
    description:
      'Commission custom contemporary textile artwork from Ida Romme. Specializing in sustainable hand-woven pieces and Scandinavian design aesthetics.',
    type: 'website',
    url: 'https://idaromme.dk/contact',
  },
  twitter: {
    card: 'summary_large_image',
    title:
      'Commission Contemporary Textile Art | Collaborate with Nordic Designer',
    description:
      'Commission custom contemporary textile artwork from Ida Romme. Specializing in sustainable hand-woven pieces and Scandinavian design aesthetics.',
  },
  alternates: {
    canonical: 'https://idaromme.dk/contact',
  },
}

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
