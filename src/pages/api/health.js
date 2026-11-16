// ABOUTME: Production health check endpoint for monitoring and deployment validation
// Answers healthy/unhealthy from a Sanity check that is cached for 30s

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
 * Public health check: up or down, nothing else. Version, environment,
 * uptime and service details helped reconnaissance and are not returned
 * (audit SEC-13).
 * @param {import('next').NextApiRequest} req
 * @param {import('next').NextApiResponse} res
 */
export default async function health(req, res) {
  res.setHeader('Cache-Control', 'no-store')

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Check Sanity CMS connectivity (cached)
    const databaseStatus = await getDatabaseStatus()
    if (databaseStatus === 'healthy') {
      return res.status(200).json({ status: 'healthy' })
    }
  } catch (error) {
    console.error('Health check endpoint error:', error)
  }

  return res.status(503).json({ status: 'unhealthy' })
}
