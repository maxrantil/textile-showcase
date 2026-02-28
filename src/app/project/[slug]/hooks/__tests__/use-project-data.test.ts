// ABOUTME: Tests for use-project-data — verifies direct Sanity queries instead of HTTP self-calls

import { getProject, getProjectWithNavigation } from '../use-project-data'

// Mock Sanity modules used by the functions under test
jest.mock('@/sanity/queries', () => ({
  queries: {
    getProjectBySlug: 'mock-getProjectBySlug-query',
    getProjectNavigation: 'mock-getProjectNavigation-query',
    getAllSlugs: 'mock-getAllSlugs-query',
  },
}))

const mockResilientFetch = jest.fn()
jest.mock('@/sanity/dataFetcher', () => ({
  resilientFetch: (...args: unknown[]) => mockResilientFetch(...args),
}))

const mockProject = {
  _id: 'abc123',
  title: 'Test Textile',
  slug: { current: 'test-textile' },
  year: 2024,
  featured: false,
  order: 1,
  _createdAt: '2024-01-01T00:00:00Z',
}

const mockNavigation = {
  current: { _id: 'abc123', title: 'Test Textile', slug: { current: 'test-textile' }, order: 1 },
  previous: { _id: 'prev1', title: 'Previous Work', slug: { current: 'previous-work' } },
  next: { _id: 'next1', title: 'Next Work', slug: { current: 'next-work' } },
}

beforeEach(() => {
  mockResilientFetch.mockReset()
  // Define global.fetch as a mock (jsdom doesn't provide it natively)
  global.fetch = jest.fn().mockImplementation(() => {
    throw new Error('fetch should not be called — use resilientFetch directly')
  }) as jest.Mock
})

afterEach(() => {
  delete (global as Record<string, unknown>).fetch
})

describe('getProject', () => {
  it('calls resilientFetch with getProjectBySlug query and correct params', async () => {
    mockResilientFetch.mockResolvedValueOnce(mockProject)

    const result = await getProject('test-textile')

    expect(mockResilientFetch).toHaveBeenCalledWith(
      'mock-getProjectBySlug-query',
      { slug: 'test-textile' },
      expect.objectContaining({ cache: true })
    )
    expect(result).toEqual(mockProject)
  })

  it('does NOT call global fetch (no HTTP self-reference)', async () => {
    mockResilientFetch.mockResolvedValueOnce(mockProject)

    await getProject('test-textile')

    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('returns null when resilientFetch returns null (project not found)', async () => {
    mockResilientFetch.mockResolvedValueOnce(null)

    const result = await getProject('nonexistent')

    expect(result).toBeNull()
  })

  it('returns null on unexpected error', async () => {
    mockResilientFetch.mockRejectedValueOnce(new Error('Sanity unreachable'))

    const result = await getProject('test-textile')

    expect(result).toBeNull()
  })
})

describe('getProjectWithNavigation', () => {
  it('calls resilientFetch for both project and navigation in parallel', async () => {
    mockResilientFetch
      .mockResolvedValueOnce(mockProject)
      .mockResolvedValueOnce(mockNavigation)

    await getProjectWithNavigation('test-textile')

    expect(mockResilientFetch).toHaveBeenCalledTimes(2)
    expect(mockResilientFetch).toHaveBeenCalledWith(
      'mock-getProjectBySlug-query',
      { slug: 'test-textile' },
      expect.objectContaining({ cache: true })
    )
    expect(mockResilientFetch).toHaveBeenCalledWith(
      'mock-getProjectNavigation-query',
      { slug: 'test-textile' },
      expect.objectContaining({ cache: true })
    )
  })

  it('does NOT call global fetch (no HTTP self-reference)', async () => {
    mockResilientFetch
      .mockResolvedValueOnce(mockProject)
      .mockResolvedValueOnce(mockNavigation)

    await getProjectWithNavigation('test-textile')

    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('returns project with extracted next and previous navigation slugs', async () => {
    mockResilientFetch
      .mockResolvedValueOnce(mockProject)
      .mockResolvedValueOnce(mockNavigation)

    const result = await getProjectWithNavigation('test-textile')

    expect(result.project).toEqual(mockProject)
    expect(result.nextProject).toEqual({ slug: 'next-work', title: 'Next Work' })
    expect(result.previousProject).toEqual({ slug: 'previous-work', title: 'Previous Work' })
  })

  it('returns project without navigation when navigation is null', async () => {
    mockResilientFetch
      .mockResolvedValueOnce(mockProject)
      .mockResolvedValueOnce(null)

    const result = await getProjectWithNavigation('test-textile')

    expect(result.project).toEqual(mockProject)
    expect(result.nextProject).toBeUndefined()
    expect(result.previousProject).toBeUndefined()
  })

  it('returns { project: null } when project not found', async () => {
    mockResilientFetch
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)

    const result = await getProjectWithNavigation('nonexistent')

    expect(result).toEqual({ project: null })
  })

  it('returns { project: null } on unexpected error', async () => {
    mockResilientFetch.mockRejectedValueOnce(new Error('Sanity unreachable'))

    const result = await getProjectWithNavigation('test-textile')

    expect(result).toEqual({ project: null })
  })
})
