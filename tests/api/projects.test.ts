// ABOUTME: Comprehensive API route tests for /api/projects endpoints
// Tests GET /api/projects, /api/projects/[slug], and /api/projects/slugs

import { GET as getProjects } from '@/app/api/projects/route'
import { GET as getProjectBySlug } from '@/app/api/projects/[slug]/route'
import { GET as getSlugs } from '@/app/api/projects/slugs/route'
import { createMockRequest, extractResponseJson } from './utils'

// Mock Sanity
const mockResilientFetch = jest.fn()
jest.mock('@/sanity/dataFetcher', () => ({
  resilientFetch: (...args: unknown[]) => mockResilientFetch(...args),
}))

jest.mock('@/sanity/queries', () => ({
  queries: {
    getDesignsForHome: 'mockGetDesignsForHome',
    getProjectBySlug: 'mockGetProjectBySlug',
    getProjectNavigation: 'mockGetProjectNavigation',
    getAllSlugs: 'mockGetAllSlugs',
  },
}))

describe('GET /api/projects', () => {
  beforeEach(() => {
    mockResilientFetch.mockClear()
    jest.clearAllMocks()
  })

  it('should return all projects successfully', async () => {
    const mockProjects = [
      {
        _id: '1',
        title: 'Design 1',
        slug: { current: 'design-1' },
        year: 2024,
      },
      {
        _id: '2',
        title: 'Design 2',
        slug: { current: 'design-2' },
        year: 2023,
      },
    ]

    mockResilientFetch.mockResolvedValueOnce(mockProjects)

    const response = await getProjects()
    const data = (await extractResponseJson(response)) as {
      designs: unknown[]
    }

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('designs')
    expect(data.designs).toEqual(mockProjects)
    expect(data.designs).toHaveLength(2)
  })

  it('should call resilientFetch with correct parameters', async () => {
    mockResilientFetch.mockResolvedValueOnce([])

    await getProjects()

    expect(mockResilientFetch).toHaveBeenCalledWith(
      'mockGetDesignsForHome',
      {},
      {
        retries: 3,
        timeout: 8000,
        cache: true,
        cacheTTL: 300000,
      }
    )
  })

  it('should return empty array when no projects found', async () => {
    mockResilientFetch.mockResolvedValueOnce(null)

    const response = await getProjects()
    const data = (await extractResponseJson(response)) as {
      designs: unknown[]
    }

    expect(response.status).toBe(200)
    expect(data.designs).toEqual([])
  })

  it('should return empty array when projects array is empty', async () => {
    mockResilientFetch.mockResolvedValueOnce([])

    const response = await getProjects()
    const data = (await extractResponseJson(response)) as {
      designs: unknown[]
    }

    expect(response.status).toBe(200)
    expect(data.designs).toEqual([])
  })

  it('should handle Sanity fetch errors gracefully', async () => {
    mockResilientFetch.mockRejectedValueOnce(
      new Error('Sanity connection failed')
    )

    const response = await getProjects()
    const data = (await extractResponseJson(response)) as {
      error: string
      designs: unknown[]
    }

    expect(response.status).toBe(500)
    expect(data).toHaveProperty('error', 'Failed to fetch projects')
    expect(data).toHaveProperty('designs', [])
  })

  it('should set proper cache headers on success', async () => {
    mockResilientFetch.mockResolvedValueOnce([{ _id: '1', title: 'Test' }])

    const response = await getProjects()

    expect(response.headers.get('Cache-Control')).toBe(
      'public, s-maxage=300, stale-while-revalidate=600'
    )
  })
})

describe('GET /api/projects/[slug]', () => {
  beforeEach(() => {
    mockResilientFetch.mockClear()
    jest.clearAllMocks()
  })

  it('should return project with navigation successfully', async () => {
    const mockProject = {
      _id: '1',
      title: 'Test Design',
      slug: { current: 'test-design' },
      year: 2024,
    }

    const mockNavigation = {
      current: {
        _id: '1',
        title: 'Test Design',
        slug: { current: 'test-design' },
        order: 2,
      },
      previous: {
        _id: '0',
        title: 'Previous Design',
        slug: { current: 'previous-design' },
      },
      next: {
        _id: '2',
        title: 'Next Design',
        slug: { current: 'next-design' },
      },
    }

    mockResilientFetch
      .mockResolvedValueOnce(mockProject)
      .mockResolvedValueOnce(mockNavigation)

    const params = Promise.resolve({ slug: 'test-design' })
    const request = createMockRequest({ method: 'GET' })
    const response = await getProjectBySlug(request, { params })

    const data = (await extractResponseJson(response)) as {
      project: unknown
      nextProject: { slug: string; title: string } | null
      previousProject: { slug: string; title: string } | null
    }

    expect(response.status).toBe(200)
    expect(data.project).toEqual(mockProject)
    expect(data.nextProject).toEqual({
      slug: 'next-design',
      title: 'Next Design',
    })
    expect(data.previousProject).toEqual({
      slug: 'previous-design',
      title: 'Previous Design',
    })
  })

  it('should return 404 when project not found', async () => {
    mockResilientFetch.mockResolvedValueOnce(null).mockResolvedValueOnce({
      current: null,
      previous: null,
      next: null,
    })

    const params = Promise.resolve({ slug: 'non-existent' })
    const request = createMockRequest({ method: 'GET' })
    const response = await getProjectBySlug(request, { params })

    const data = (await extractResponseJson(response)) as { error: string }

    expect(response.status).toBe(404)
    expect(data).toHaveProperty('error', 'Project not found')
  })

  it('should handle project with no navigation', async () => {
    const mockProject = {
      _id: '1',
      title: 'Only Design',
      slug: { current: 'only-design' },
    }

    mockResilientFetch
      .mockResolvedValueOnce(mockProject)
      .mockResolvedValueOnce({
        current: {
          _id: '1',
          title: 'Only Design',
          slug: { current: 'only-design' },
          order: 1,
        },
        previous: null,
        next: null,
      })

    const params = Promise.resolve({ slug: 'only-design' })
    const request = createMockRequest({ method: 'GET' })
    const response = await getProjectBySlug(request, { params })

    const data = (await extractResponseJson(response)) as {
      project: unknown
      nextProject: null
      previousProject: null
    }

    expect(response.status).toBe(200)
    expect(data.nextProject).toBeNull()
    expect(data.previousProject).toBeNull()
  })

  it('should handle Sanity fetch errors gracefully', async () => {
    mockResilientFetch.mockRejectedValueOnce(new Error('Sanity timeout'))

    const params = Promise.resolve({ slug: 'error-design' })
    const request = createMockRequest({ method: 'GET' })
    const response = await getProjectBySlug(request, { params })

    const data = (await extractResponseJson(response)) as {
      error: string
      project: null
    }

    expect(response.status).toBe(500)
    expect(data).toHaveProperty('error', 'Failed to fetch project')
    expect(data).toHaveProperty('project', null)
  })

  it('should set proper cache headers on success', async () => {
    mockResilientFetch
      .mockResolvedValueOnce({
        _id: '1',
        title: 'Test',
      })
      .mockResolvedValueOnce({
        current: {
          _id: '1',
          title: 'Test',
          slug: { current: 'test' },
          order: 1,
        },
        previous: null,
        next: null,
      })

    const params = Promise.resolve({ slug: 'test' })
    const request = createMockRequest({ method: 'GET' })
    const response = await getProjectBySlug(request, { params })

    expect(response.headers.get('Cache-Control')).toBe(
      'public, s-maxage=600, stale-while-revalidate=1200'
    )
  })

  it('should call resilientFetch with correct parameters', async () => {
    mockResilientFetch
      .mockResolvedValueOnce({
        _id: '1',
        title: 'Test',
      })
      .mockResolvedValueOnce({
        current: {
          _id: '1',
          title: 'Test',
          slug: { current: 'test' },
          order: 1,
        },
        previous: null,
        next: null,
      })

    const params = Promise.resolve({ slug: 'my-design' })
    const request = createMockRequest({ method: 'GET' })
    await getProjectBySlug(request, { params })

    // First call for project
    expect(mockResilientFetch).toHaveBeenNthCalledWith(
      1,
      'mockGetProjectBySlug',
      { slug: 'my-design' },
      {
        retries: 3,
        timeout: 15000,
        cache: true,
        cacheTTL: 600000,
      }
    )

    // Second call for navigation
    expect(mockResilientFetch).toHaveBeenNthCalledWith(
      2,
      'mockGetProjectNavigation',
      { slug: 'my-design' },
      {
        retries: 2,
        timeout: 10000,
        cache: true,
        cacheTTL: 300000,
      }
    )
  })
})

describe('GET /api/projects/slugs', () => {
  beforeEach(() => {
    mockResilientFetch.mockClear()
    jest.clearAllMocks()
  })

  it('should return all slugs successfully', async () => {
    const mockDesigns = [
      { slug: 'design-1', _updatedAt: '2024-01-01' },
      { slug: 'design-2', _updatedAt: '2024-01-02' },
      { slug: 'design-3', _updatedAt: '2024-01-03' },
    ]

    mockResilientFetch.mockResolvedValueOnce(mockDesigns)

    const response = await getSlugs()
    const data = (await extractResponseJson(response)) as {
      slugs: Array<{ slug: string }>
    }

    expect(response.status).toBe(200)
    expect(data.slugs).toHaveLength(3)
    expect(data.slugs).toEqual([
      { slug: 'design-1' },
      { slug: 'design-2' },
      { slug: 'design-3' },
    ])
  })

  it('should filter out designs without slugs', async () => {
    const mockDesigns = [
      { slug: 'design-1', _updatedAt: '2024-01-01' },
      { slug: null, _updatedAt: '2024-01-02' },
      { slug: 'design-3', _updatedAt: '2024-01-03' },
    ]

    mockResilientFetch.mockResolvedValueOnce(mockDesigns)

    const response = await getSlugs()
    const data = (await extractResponseJson(response)) as {
      slugs: Array<{ slug: string }>
    }

    expect(response.status).toBe(200)
    expect(data.slugs).toHaveLength(2)
    expect(data.slugs).toEqual([{ slug: 'design-1' }, { slug: 'design-3' }])
  })

  it('should return empty array when no designs found', async () => {
    mockResilientFetch.mockResolvedValueOnce(null)

    const response = await getSlugs()
    const data = (await extractResponseJson(response)) as {
      slugs: unknown[]
    }

    expect(response.status).toBe(200)
    expect(data.slugs).toEqual([])
  })

  it('should return empty array when designs array is empty', async () => {
    mockResilientFetch.mockResolvedValueOnce([])

    const response = await getSlugs()
    const data = (await extractResponseJson(response)) as {
      slugs: unknown[]
    }

    expect(response.status).toBe(200)
    expect(data.slugs).toEqual([])
  })

  it('should handle Sanity fetch errors gracefully', async () => {
    mockResilientFetch.mockRejectedValueOnce(new Error('Database error'))

    const response = await getSlugs()
    const data = (await extractResponseJson(response)) as {
      error: string
      slugs: unknown[]
    }

    expect(response.status).toBe(500)
    expect(data).toHaveProperty('error', 'Failed to fetch slugs')
    expect(data).toHaveProperty('slugs', [])
  })

  it('should set proper cache headers on success', async () => {
    mockResilientFetch.mockResolvedValueOnce([
      { slug: 'test', _updatedAt: '2024-01-01' },
    ])

    const response = await getSlugs()

    expect(response.headers.get('Cache-Control')).toBe(
      'public, s-maxage=180, stale-while-revalidate=360'
    )
  })

  it('should call resilientFetch with correct parameters', async () => {
    mockResilientFetch.mockResolvedValueOnce([])

    await getSlugs()

    expect(mockResilientFetch).toHaveBeenCalledWith(
      'mockGetAllSlugs',
      {},
      {
        retries: 2,
        timeout: 20000,
        cache: true,
        cacheTTL: 300000,
      }
    )
  })
})
