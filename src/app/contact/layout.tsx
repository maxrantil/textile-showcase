import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact - Ida Romme',
  description: 'Get in touch with Ida Romme for textile design collaborations, commissions, or inquiries about contemporary textile art.',
  openGraph: {
    title: 'Contact Ida Romme',
    description: 'Get in touch for textile design collaborations and inquiries',
  },
}

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
