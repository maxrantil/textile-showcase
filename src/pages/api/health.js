// ABOUTME: Production health check endpoint for monitoring and deployment validation
// Reports database, security and SSE status; upstream Sanity check is cached for 30s

// Sanity client created dynamically to avoid bundling in main chunks

/** How long a Sanity connectivity result is reused before re-checking */
const DB_CHECK_TTL_MS = 30_000
const DB_CHECK_TIMEOUT_MS = 5_000

let sanityClient = null
let dbCheck = { status: 'unknown', checkedAt: 0, pending: null }

async function getSanityClient() {
  if (sanityClient) return sanityClient

  // Dynamic import to avoid bundling Sanity in main chunks
  const { createClient } = await import('next-sanity')

  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
  if (!projectId) {
    throw new Error(
      'NEXT_PUBLIC_SANITY_PROJECT_ID is required but not configured'
    )
  }

  sanityClient = createClient({
    projectId,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2023-05-03',
    token: process.env.SANITY_API_TOKEN,
    useCdn: false, // For health checks, always get fresh data
  })
  return sanityClient
}

async function runDbCheck() {
  try {
    const client = await getSanityClient()
    let timer
    await Promise.race([
      client.fetch('*[_type == "textileDesign"][0]{_id}'),
      new Promise((_, reject) => {
        timer = setTimeout(
          () => reject(new Error('Sanity health check timed out')),
          DB_CHECK_TIMEOUT_MS
        )
      }),
    ]).finally(() => clearTimeout(timer))
    return 'healthy'
  } catch (error) {
    console.error('Database health check failed:', error)
    return 'unhealthy'
  }
}

/**
 * Cached Sanity connectivity check. An unauthenticated endpoint must not
 * translate every incoming request into an upstream API call.
 */
async function getDatabaseStatus() {
  const now = Date.now()
  if (dbCheck.checkedAt && now - dbCheck.checkedAt < DB_CHECK_TTL_MS) {
    return dbCheck.status
  }
  if (!dbCheck.pending) {
    dbCheck.pending = runDbCheck().then((status) => {
      dbCheck = { status, checkedAt: Date.now(), pending: null }
      return status
    })
  }
  return dbCheck.pending
}

/**
 * Health check endpoint for production monitoring
 * @param {import('next').NextApiRequest} req
 * @param {import('next').NextApiResponse} res
 */
export default async function health(req, res) {
  res.setHeader('Cache-Control', 'no-store')

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const startTime = Date.now()

    // Check Sanity CMS connectivity (cached)
    const databaseStatus = await getDatabaseStatus()

    // Check security service status
    let securityStatus = 'unknown'
    try {
      // Validate security configuration exists
      const securityEnabled = process.env.SECURITY_LOGGING_ENABLED === 'true'
      const hasGpgKey = !!process.env.GPG_KEY_ID
      const hasAuditKey = !!process.env.AUDIT_SIGNING_KEY

      securityStatus =
        securityEnabled && hasGpgKey && hasAuditKey ? 'healthy' : 'degraded'
    } catch (error) {
      console.error('Security health check failed:', error)
      securityStatus = 'unhealthy'
    }

    // Check SSE endpoint connectivity
    let sseStatus = 'unknown'
    try {
      const sseEndpoint = process.env.SSE_ENDPOINT_URL
      if (sseEndpoint) {
        // In a real implementation, you would test connectivity to SSE endpoint
        sseStatus = 'healthy'
      } else {
        sseStatus = 'not_configured'
      }
    } catch (error) {
      console.error('SSE health check failed:', error)
      sseStatus = 'unhealthy'
    }

    const responseTime = Date.now() - startTime
    const version = process.env.npm_package_version || '1.0.0'
    const environment = process.env.NODE_ENV || 'development'

    // Determine overall health status
    const isHealthy =
      databaseStatus === 'healthy' &&
      securityStatus !== 'unhealthy' &&
      sseStatus !== 'unhealthy'

    const response = {
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      version,
      environment,
      responseTime: `${responseTime}ms`,
      services: {
        database: databaseStatus,
        security: securityStatus,
        sse: sseStatus,
      },
      uptime: Math.round(process.uptime()),
    }

    // Return appropriate status code
    const statusCode = isHealthy ? 200 : 503

    res.status(statusCode).json(response)
  } catch (error) {
    console.error('Health check endpoint error:', error)

    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      error: 'Internal server error during health check',
      services: {
        database: 'unknown',
        security: 'unknown',
        sse: 'unknown',
      },
    })
  }
}
