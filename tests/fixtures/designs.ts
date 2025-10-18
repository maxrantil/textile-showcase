// ABOUTME: Test fixtures for unit and integration testing of mobile gallery components

import { TextileDesign } from '@/types/textile'

/**
 * Mock textile designs for testing mobile gallery components.
 * These fixtures provide predictable test data with various scenarios:
 * - Multiple images
 * - Missing optional fields
 * - Different categories and years
 */
export const mockDesigns: TextileDesign[] = [
  {
    _id: 'test-design-001',
    title: 'Sustainable Cotton Weave',
    description: 'A modern take on traditional cotton weaving',
    slug: { current: 'sustainable-cotton-weave' },
    image: {
      asset: {
        _ref: 'image-test-ref-001',
        _type: 'reference',
      },
      alt: 'Sustainable cotton textile with natural dyes',
    },
    category: 'Sustainable',
    year: 2024,
    materials: ['Cotton', 'Natural Dyes'],
    techniques: ['Weaving', 'Hand-dyeing'],
  },
  {
    _id: 'test-design-002',
    title: 'Experimental Linen Series',
    description: 'Bold geometric patterns in premium linen',
    slug: { current: 'experimental-linen' },
    image: {
      asset: {
        _ref: 'image-test-ref-002',
        _type: 'reference',
      },
      alt: 'Geometric linen textile design',
    },
    category: 'Experimental',
    year: 2024,
    materials: ['Linen'],
  },
  {
    _id: 'test-design-003',
    title: 'Heritage Silk Collection',
    description: 'Traditional patterns with contemporary colors',
    slug: { current: 'heritage-silk' },
    image: {
      asset: {
        _ref: 'image-test-ref-003',
        _type: 'reference',
      },
      alt: 'Heritage silk pattern',
    },
    category: 'Heritage',
    year: 2023,
  },
  {
    _id: 'test-design-004',
    title: 'Minimal Design Study',
    description: 'Exploring simplicity and negative space',
    slug: { current: 'minimal-study' },
    image: {
      asset: {
        _ref: 'image-test-ref-004',
        _type: 'reference',
      },
      alt: 'Minimal textile design',
    },
    category: 'Contemporary',
    year: 2024,
  },
]

/**
 * Single design fixture for testing individual components
 */
export const mockSingleDesign: TextileDesign = mockDesigns[0]

/**
 * Empty designs array for testing empty states
 */
export const mockEmptyDesigns: TextileDesign[] = []

/**
 * Design with minimal required fields only (testing optional field handling)
 */
export const mockMinimalDesign: TextileDesign = {
  _id: 'test-minimal-001',
  title: 'Minimal Required Fields',
  slug: { current: 'minimal-fields' },
}

/**
 * Design with multiple images for testing gallery functionality
 */
export const mockDesignWithGallery: TextileDesign = {
  _id: 'test-gallery-001',
  title: 'Multi-Image Design',
  slug: { current: 'multi-image' },
  image: {
    asset: {
      _ref: 'image-main-ref',
      _type: 'reference',
    },
    alt: 'Main image',
  },
  gallery: [
    {
      _key: 'gallery-001',
      asset: {
        _ref: 'image-gallery-ref-001',
        _type: 'reference',
      },
      caption: 'Detail view 1',
    },
    {
      _key: 'gallery-002',
      asset: {
        _ref: 'image-gallery-ref-002',
        _type: 'reference',
      },
      caption: 'Detail view 2',
    },
  ],
}

/**
 * Test data utilities
 */
export const designFixtures = {
  all: mockDesigns,
  single: mockSingleDesign,
  empty: mockEmptyDesigns,
  minimal: mockMinimalDesign,
  withGallery: mockDesignWithGallery,
  count: mockDesigns.length,
  first: mockDesigns[0],
  last: mockDesigns[mockDesigns.length - 1],
}
