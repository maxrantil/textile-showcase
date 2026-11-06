// ABOUTME: Tests for the /api/health endpoint
// Ensures the upstream Sanity check is cached and responses are never cached by clients

const mockFetch = jest.fn()
const mockCreateClient = jest.fn(() => ({ fetch: mockFetch }))

jest.mock('next-sanity', () => ({
  createClient: (...args: unknown[]) =>
    (mockCreateClient as unknown as (...a: unknown[]) => unknown)(...args),
}))

type MockRes = {
  statusCode: number
  body: Record<string, unknown> | undefined
  headers: Record<string, string>
  status: (code: number) => MockRes
  json: (body: Record<string, unknown>) => MockRes
  setHeader: (k: string, v: string) => MockRes
}

function mockRes(): MockRes {
  const res: MockRes = {
    statusCode: 0,
    body: undefined,
    headers: {},
    status(code) {
      res.statusCode = code
      return res
    },
    json(body) {
      res.body = body
      return res
    },
    setHeader(k, v) {
      res.headers[k.toLowerCase()] = v
      return res
    },
  }
  return res
}

describe('GET /api/health', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    mockFetch.mockReset().mockResolvedValue({ _id: 'x' })
    mockCreateClient.mockClear()
    process.env = { ...originalEnv, NEXT_PUBLIC_SANITY_PROJECT_ID: 'test' }
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    process.env = originalEnv
    jest.restoreAllMocks()
  })

  const load = async () =>
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    (await import('@/pages/api/health')).default as (
      req: unknown,
      res: MockRes
    ) => Promise<void>

  it('reports healthy and sets Cache-Control: no-store', async () => {
    const health = await load()
    const res = mockRes()
    await health({ method: 'GET' }, res)

    expect(res.statusCode).toBe(200)
    expect(res.body?.status).toBe('healthy')
    expect(res.headers['cache-control']).toBe('no-store')
  })

  it('caches the Sanity check so bursts do not hit the upstream API', async () => {
    const health = await load()
    for (let i = 0; i < 10; i++) {
      await health({ method: 'GET' }, mockRes())
    }

    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(mockCreateClient).toHaveBeenCalledTimes(1)
  })

  it('returns 503 when Sanity is unreachable', async () => {
    mockFetch.mockRejectedValue(new Error('down'))
    const health = await load()
    const res = mockRes()
    await health({ method: 'GET' }, res)

    expect(res.statusCode).toBe(503)
    expect(res.body?.services).toMatchObject({ database: 'unhealthy' })
  })

  it('does not expose process memory details', async () => {
    const health = await load()
    const res = mockRes()
    await health({ method: 'GET' }, res)
    expect(res.body).not.toHaveProperty('memory')
  })

  it('rejects non-GET methods', async () => {
    const health = await load()
    const res = mockRes()
    await health({ method: 'POST' }, res)
    expect(res.statusCode).toBe(405)
  })
})
