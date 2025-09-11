// ABOUTME: Test fixtures and data for E2E gallery testing with predictable data sets
export interface TestTextileDesign {
  _id: string
  title: string
  slug: { current: string }
  description: string
  image: {
    asset: { _ref: string }
    alt: string
  }
  category?: string
  year?: number
}

export const e2eTestDesigns: TestTextileDesign[] = [
  {
    _id: 'e2e-sustainable-cotton-001',
    title: 'E2E Sustainable Cotton Collection',
    slug: { current: 'e2e-sustainable-cotton' },
    description:
      'Test design for E2E automation featuring sustainable cotton weaving techniques',
    image: {
      asset: { _ref: 'test-image-ref-001' },
      alt: 'Sustainable cotton textile design for E2E testing',
    },
    category: 'Sustainable',
    year: 2024,
  },
  {
    _id: 'e2e-linen-experiment-002',
    title: 'E2E Linen Experimental Series',
    slug: { current: 'e2e-linen-experiment' },
    description: 'Experimental linen design for navigation testing',
    image: {
      asset: { _ref: 'test-image-ref-002' },
      alt: 'Experimental linen design for E2E automation',
    },
    category: 'Experimental',
    year: 2024,
  },
  {
    _id: 'e2e-silk-heritage-003',
    title: 'E2E Heritage Silk Patterns',
    slug: { current: 'e2e-heritage-silk' },
    description: 'Traditional silk patterns modernized for contemporary use',
    image: {
      asset: { _ref: 'test-image-ref-003' },
      alt: 'Heritage silk pattern design for testing',
    },
    category: 'Heritage',
    year: 2023,
  },
]

export const galleryTestData = {
  totalDesigns: e2eTestDesigns.length,
  firstDesign: e2eTestDesigns[0],
  lastDesign: e2eTestDesigns[e2eTestDesigns.length - 1],
  categories: ['Sustainable', 'Experimental', 'Heritage'],
}

export const performanceTestData = {
  expectedLoadTime: 2000, // 2 seconds
  expectedImageCount: e2eTestDesigns.length,
  expectedScrollPositions: e2eTestDesigns.map((_, index) => index * 400), // Estimated scroll positions
}
