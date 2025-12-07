// ABOUTME: Generates FAQPage structured data for SEO and rich snippets
// FAQ schema helps search engines display Q&A rich results

interface FAQItem {
  question: string
  answer: string
}

interface FAQPageSchema {
  '@context': 'https://schema.org'
  '@type': 'FAQPage'
  mainEntity: Array<{
    '@type': 'Question'
    name: string
    acceptedAnswer: {
      '@type': 'Answer'
      text: string
    }
  }>
}

/**
 * Generate FAQPage schema from a list of Q&A pairs
 */
export function generateFAQSchema(items: FAQItem[]): FAQPageSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }
}

/**
 * Pre-defined FAQ items for the main portfolio site
 * These answer common questions visitors might have about the artist and work
 */
export const portfolioFAQItems: FAQItem[] = [
  {
    question: 'What type of textile work does Ida Romme create?',
    answer:
      'Ida Romme creates contemporary hand-woven textiles that blend traditional Scandinavian craftsmanship with modern design aesthetics. Her work explores color, texture, and sustainable materials through innovative weaving techniques.',
  },
  {
    question: 'Does Ida Romme accept commissions?',
    answer:
      'Yes, Ida accepts custom textile commissions for both private collectors and commercial clients. Each commission is a collaborative process that begins with a consultation to understand your vision, space, and requirements. Contact through the website to discuss your project.',
  },
  {
    question: 'Where is Ida Romme based?',
    answer:
      'Ida Romme is a Nordic textile artist based in Stockholm, Sweden. She trained at the Swedish School of Textiles in Borås, known for its innovative textile education and sustainable practices.',
  },
  {
    question: 'What materials does Ida Romme use in her textiles?',
    answer:
      'Ida primarily works with sustainable and natural fibers, including organic cotton, linen, wool, and recycled materials. Material choices are guided by both aesthetic qualities and environmental responsibility.',
  },
  {
    question: 'Are the textile pieces for sale?',
    answer:
      'Select pieces from Ida Romme\'s portfolio are available for purchase. Availability varies by piece. For inquiries about purchasing or commissioning work, please use the contact form on the website.',
  },
]

/**
 * Generate the default portfolio FAQ schema
 */
export function generatePortfolioFAQSchema(): FAQPageSchema {
  return generateFAQSchema(portfolioFAQItems)
}
