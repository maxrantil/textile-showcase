// ABOUTME: Regression test — CMS fields must not break out of the project page's JSON-LD scripts
// Renders the real page, breadcrumb schema, structured-data helper and ProjectContent

import { renderToStaticMarkup } from 'react-dom/server'

const breakout =
  'Salt</script><meta http-equiv=refresh content=0;url=https://attacker.invalid/><b id=injected>x</b>'

const mockProject = {
  _id: 'p1',
  title: breakout,
  description: breakout,
  slug: { current: 'salt' },
  image: { asset: { _ref: 'image-main-1200x900-jpg' } },
  images: [],
}

jest.mock('../hooks/use-project-data', () => ({
  getProjectWithNavigation: jest.fn(async () => ({
    project: mockProject,
    nextProject: null,
    previousProject: null,
  })),
}))
jest.mock('@/components/adaptive/Project', () => ({
  __esModule: true,
  default: () => null,
}))
jest.mock('next/headers', () => ({
  headers: async () => new Headers({ 'user-agent': '' }),
}))
jest.mock('../components/project-metadata', () => ({
  generateProjectMetadata: jest.fn(),
}))
jest.mock('next/navigation', () => ({ notFound: jest.fn() }))

describe('Project page JSON-LD', () => {
  it('keeps a CMS title containing </script> inside its JSON-LD scripts', async () => {
    const { default: ProjectPage } = await import('../page')
    const html = renderToStaticMarkup(
      await ProjectPage({ params: Promise.resolve({ slug: 'salt' }) })
    )
    const doc = new DOMParser().parseFromString(html, 'text/html')

    expect(doc.getElementById('injected')).toBeNull()
    expect(doc.querySelector('meta[http-equiv="refresh"]')).toBeNull()

    const scripts = [
      ...doc.querySelectorAll('script[type="application/ld+json"]'),
    ]
    expect(scripts.length).toBeGreaterThanOrEqual(2)
    for (const s of scripts) {
      expect(() => JSON.parse(s.textContent ?? '')).not.toThrow()
    }
    expect(html).toContain('\\u003c/script\\u003e')
  })
})
