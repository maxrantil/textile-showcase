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

  it('passes the server device guess to the view (phones get the mobile view)', async () => {
    mockUserAgent =
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Mobile/15E148 Safari/604.1'
    const { default: ProjectPage } = await import('../page')
    render(await ProjectPage({ params: Promise.resolve({ slug: 'salt' }) }))
    expect(mockProjectContent).toHaveBeenLastCalledWith(
      expect.objectContaining({ initialDeviceType: 'mobile' })
    )

    mockUserAgent = 'Mozilla/5.0 (X11; Linux x86_64) Chrome/130.0 Safari/537.36'
    render(await ProjectPage({ params: Promise.resolve({ slug: 'salt' }) }))
    expect(mockProjectContent).toHaveBeenLastCalledWith(
      expect.objectContaining({ initialDeviceType: 'desktop' })
    )
  })
})
