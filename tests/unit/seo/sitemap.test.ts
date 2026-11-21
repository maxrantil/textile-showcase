// ABOUTME: Tests for the generated sitemap's project entries
// ABOUTME: CMS slugs must stay inside one URL path segment (Issue #492)

const mockResilientFetch = jest.fn()

jest.mock('@/sanity/dataFetcher', () => ({
  resilientFetch: (...args: unknown[]) => mockResilientFetch(...args),
}))
jest.mock('@/sanity/queries', () => ({ queries: { getAllSlugs: 'slugs' } }))

import sitemap from '@/app/sitemap'

const UPDATED = '2026-11-01T00:00:00Z'

function projectUrls(entries: Array<{ url: string }>): string[] {
  return entries
    .map((entry) => entry.url)
    .filter((url) => url.startsWith('https://idaromme.dk/project/'))
}

describe('sitemap project entries', () => {
  beforeEach(() => mockResilientFetch.mockReset())

  it('keeps an ordinary slug unchanged', async () => {
    mockResilientFetch.mockResolvedValue([
      { slug: 'woven-light', _updatedAt: UPDATED },
    ])

    expect(projectUrls(await sitemap())).toEqual([
      'https://idaromme.dk/project/woven-light',
    ])
  })

  it('encodes a slug carrying XML or URL delimiters', async () => {
    const payload = 'x</loc></url><url><loc>https://example.invalid/?a=1#b'
    mockResilientFetch.mockResolvedValue([
      { slug: payload, _updatedAt: UPDATED },
    ])

    const urls = projectUrls(await sitemap())
    expect(urls).toEqual([
      `https://idaromme.dk/project/${encodeURIComponent(payload)}`,
    ])
    expect(urls[0]).not.toMatch(/[<>?#]/)
    expect(urls[0].slice('https://idaromme.dk/project/'.length)).not.toContain(
      '/'
    )
  })

  it('percent-encodes non-ASCII letters', async () => {
    mockResilientFetch.mockResolvedValue([
      { slug: 'blå-væv', _updatedAt: UPDATED },
    ])

    expect(projectUrls(await sitemap())).toEqual([
      'https://idaromme.dk/project/bl%C3%A5-v%C3%A6v',
    ])
  })
})
