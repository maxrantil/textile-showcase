// ABOUTME: Tests the project page does not add its own LCP image preload
// The hand-written preload never matched the image either view displays (wasted bandwidth)

import { render } from '@testing-library/react'

const mockProject = {
  _id: 'p1',
  title: 'Salt',
  slug: { current: 'salt' },
  image: { asset: { _ref: 'image-main-1200x900-jpg' } },
  images: [{ _key: 'g1', asset: { _ref: 'image-gal1-1200x900-jpg' } }],
}

jest.mock('../hooks/use-project-data', () => ({
  getProjectWithNavigation: jest.fn(async () => ({
    project: mockProject,
    nextProject: null,
    previousProject: null,
  })),
}))
jest.mock('../components/project-content', () => ({
  ProjectContent: () => <div data-testid="project-content" />,
}))
jest.mock('../components/project-metadata', () => ({
  generateProjectMetadata: jest.fn(),
}))
jest.mock('@/app/metadata/breadcrumb-schema', () => ({
  generateProjectBreadcrumbs: () => ({}),
}))
jest.mock('../utils/project-helpers', () => ({
  generateProjectStructuredData: () => ({}),
}))
jest.mock('next/navigation', () => ({ notFound: jest.fn() }))

afterEach(() => {
  document.head
    .querySelectorAll('link[rel="preload"][as="image"]')
    .forEach((l) => l.remove())
})

describe('Project page LCP preload', () => {
  it('renders no page-level image preload (the carousel image preloads itself)', async () => {
    const { default: ProjectPage } = await import('../page')
    const { container } = render(
      await ProjectPage({ params: Promise.resolve({ slug: 'salt' }) })
    )

    const preloads = [
      ...document.head.querySelectorAll('link[rel="preload"][as="image"]'),
      ...container.querySelectorAll('link[rel="preload"][as="image"]'),
    ]
    expect(preloads).toHaveLength(0)
  })

  it('still preconnects to the Sanity CDN', async () => {
    const { default: ProjectPage } = await import('../page')
    const { container } = render(
      await ProjectPage({ params: Promise.resolve({ slug: 'salt' }) })
    )
    const preconnect =
      document.head.querySelector(
        'link[rel="preconnect"][href="https://cdn.sanity.io"]'
      ) ||
      container.querySelector(
        'link[rel="preconnect"][href="https://cdn.sanity.io"]'
      )
    expect(preconnect).not.toBeNull()
  })
})
