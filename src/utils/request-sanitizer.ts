// ABOUTME: Request sanitization for secure caching
// Removes sensitive headers before caching requests

export class RequestSanitizer {
  sanitizeForCache(request: Request): Request {
    const sensitiveHeaders = [
      'authorization',
      'cookie',
      'x-api-key',
      'x-auth-token',
    ]

    const headers = new Headers()
    for (const [key, value] of request.headers.entries()) {
      if (!sensitiveHeaders.includes(key.toLowerCase())) {
        headers.set(key, value)
      }
    }

    return new Request(request.url, {
      method: request.method,
      headers,
      body: request.body,
    })
  }
}
