// ABOUTME: Service worker implementation for Phase 2B Day 5
// Target: 50% faster repeat visits through intelligent caching

// const CACHE_NAME = 'textile-showcase-v1' // Reserved for future use
const STATIC_CACHE = 'textile-static-v1'
const CHUNKS_CACHE = 'textile-chunks-v1'
const IMAGES_CACHE = 'textile-images-v1'
const ROUTES_CACHE = 'textile-routes-v1'

// Critical assets to cache immediately
const CRITICAL_ASSETS = ['/', '/manifest.json', '/favicon.ico']

// Install event - cache critical assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE)
      await cache.addAll(CRITICAL_ASSETS)

      // Skip waiting to activate immediately
      self.skipWaiting()
    })()
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys()
      await Promise.all(
        cacheNames
          .filter((name) => !name.includes('v1'))
          .map((name) => caches.delete(name))
      )

      // Take control of all clients immediately
      await self.clients.claim()
    })()
  )
})

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Only handle same-origin requests and allowed CDNs
  if (!isAllowedOrigin(url)) {
    return
  }

  // Route to appropriate caching strategy
  if (isStaticAsset(url)) {
    event.respondWith(handleStaticAsset(request))
  } else if (isChunk(url)) {
    event.respondWith(handleChunk(request))
  } else if (isSanityImage(url)) {
    event.respondWith(handleSanityImage(request))
  } else if (isRoute(request)) {
    event.respondWith(handleRoute(request))
  }
})

// Security: validate allowed origins
function isAllowedOrigin(url) {
  const allowedOrigins = [
    self.location.origin,
    'https://cdn.sanity.io',
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com',
  ]
  return allowedOrigins.includes(url.origin)
}

// Identify static assets
function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.includes('.css') ||
    url.pathname.includes('.woff') ||
    url.pathname.includes('.ico')
  )
}

// Identify JavaScript chunks
function isChunk(url) {
  return (
    url.pathname.includes('.js') &&
    (url.pathname.includes('chunk') || url.pathname.includes('vendor'))
  )
}

// Identify Sanity CDN images
function isSanityImage(url) {
  return url.hostname === 'cdn.sanity.io' && url.pathname.includes('/images/')
}

// Identify HTML routes
function isRoute(request) {
  return (
    request.method === 'GET' &&
    request.headers.get('accept')?.includes('text/html')
  )
}

// Cache-first strategy for static assets
async function handleStaticAsset(request) {
  const cache = await caches.open(STATIC_CACHE)
  const cached = await cache.match(request)

  if (cached) {
    return cached
  }

  try {
    const response = await fetch(request)
    if (response.ok) {
      await cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    return cached || new Response('Asset not available', { status: 503 })
  }
}

// Stale-while-revalidate for chunks
async function handleChunk(request) {
  const cache = await caches.open(CHUNKS_CACHE)
  const cached = await cache.match(request)

  // Return cached immediately if available
  if (cached) {
    // Update in background if stale
    fetch(request)
      .then((response) => {
        if (response.ok) {
          cache.put(request, response)
        }
      })
      .catch(() => {
        // Ignore background update failures
      })

    return cached
  }

  // No cache, fetch from network
  try {
    const response = await fetch(request)
    if (response.ok) {
      await cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    return new Response('Chunk not available', { status: 503 })
  }
}

// Cache-first for Sanity images with size limits
async function handleSanityImage(request) {
  const cache = await caches.open(IMAGES_CACHE)
  const cached = await cache.match(request)

  if (cached) {
    return cached
  }

  try {
    const response = await fetch(request)
    if (response.ok) {
      // Only cache images under 2MB
      const contentLength = response.headers.get('content-length')
      if (!contentLength || parseInt(contentLength) < 2 * 1024 * 1024) {
        await cache.put(request, response.clone())
      }
    }
    return response
  } catch (error) {
    return cached || new Response('Image not available', { status: 503 })
  }
}

// Network-first for HTML routes with offline fallback
async function handleRoute(request) {
  const cache = await caches.open(ROUTES_CACHE)

  try {
    const response = await fetch(request)
    if (response.ok) {
      await cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    const cached = await cache.match(request)
    if (cached) {
      return cached
    }

    // Return offline fallback
    const offlinePage = await cache.match('/offline.html')
    return offlinePage || new Response('Offline', { status: 503 })
  }
}

// Message handling for updates and cache warm-up
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }

  if (event.data && event.data.type === 'WARM_CACHE') {
    warmCache(event.data.urls)
  }
})

// Cache warming function
async function warmCache(urls) {
  const cache = await caches.open(CHUNKS_CACHE)
  try {
    await cache.addAll(urls)
  } catch (error) {
    console.warn('Cache warming failed:', error)
  }
}
