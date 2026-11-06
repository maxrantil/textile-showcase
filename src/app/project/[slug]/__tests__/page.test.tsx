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
const mockProjectContent = jest.fn((props: Record<string, unknown>) => (
  <div
    data-testid="project-content"
    data-device={String(props.initialDeviceType)}
  />
))
jest.mock('../components/project-content', () => ({
  ProjectContent: (props: Record<string, unknown>) => mockProjectContent(props),
}))

let mockUserAgent = ''
jest.mock('next/headers', () => ({
  headers: async () => new Headers({ 'user-agent': mockUserAgent }),
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

  it('passes the server device guess to the view (phones get the mobile view)', async () => {
    mockUserAgent =
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Mobile/15E148 Safari/604.1'
    render(
      await ProjectPage({
        params: Promise.resolve({ slug: 'composing-tones' }),
      })
    )
    expect(mockProjectContent).toHaveBeenLastCalledWith(
      expect.objectContaining({ initialDeviceType: 'mobile' })
    )

    mockUserAgent = 'Mozilla/5.0 (X11; Linux x86_64) Chrome/130.0 Safari/537.36'
    render(
      await ProjectPage({
        params: Promise.resolve({ slug: 'composing-tones' }),
      })
    )
    expect(mockProjectContent).toHaveBeenLastCalledWith(
      expect.objectContaining({ initialDeviceType: 'desktop' })
    )
  })
})
