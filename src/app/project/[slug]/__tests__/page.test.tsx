// ABOUTME: Tests for the project page's document links: it must not preload an image that neither layout shows
// The desktop carousel preloads its own first image; the cover image is not the first thing on screen

import React from 'react'
import { render } from '@testing-library/react'
import '@testing-library/jest-dom'
import ProjectPage from '../page'

const project = {
  _id: 'design-1',
  title: 'Composing Tones',
  slug: { current: 'composing-tones' },
  image: {
    asset: { _ref: 'image-cover-873x1188-jpg', _type: 'reference' as const },
  },
  images: [
    {
      _key: 'a',
      asset: {
        asset: {
          _ref: 'image-first-4000x6000-png',
          _type: 'reference' as const,
        },
      },
    },
  ],
}

jest.mock('next/navigation', () => ({ notFound: jest.fn() }))
jest.mock('../hooks/use-project-data', () => ({
  getProjectWithNavigation: jest.fn(async () => ({
    project,
    nextProject: undefined,
    previousProject: undefined,
  })),
}))
jest.mock('../components/project-metadata', () => ({
  generateProjectMetadata: jest.fn(),
}))
jest.mock('../components/project-content', () => ({
  ProjectContent: () => <div data-testid="project-content" />,
}))

describe('ProjectPage document links', () => {
  it('does not preload an image itself', async () => {
    const page = await ProjectPage({
      params: Promise.resolve({ slug: 'composing-tones' }),
    })
    const { container } = render(page)

    expect(
      container.ownerDocument.querySelectorAll(
        'link[rel="preload"][as="image"]'
      )
    ).toHaveLength(0)
  })

  it('keeps the preconnect to the image CDN', async () => {
    const page = await ProjectPage({
      params: Promise.resolve({ slug: 'composing-tones' }),
    })
    const { container } = render(page)

    expect(
      container.ownerDocument.querySelector(
        'link[rel="preconnect"][href="https://cdn.sanity.io"]'
      )
    ).not.toBeNull()
  })
})
