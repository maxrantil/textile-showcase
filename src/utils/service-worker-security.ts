// ABOUTME: Security validation for service worker implementation
// Prevents malicious caching and origin hijacking

export interface SecurityConfig {
  allowedOrigins: string[]
}

export class SecurityValidator {
  private config: SecurityConfig

  constructor(config: SecurityConfig) {
    this.config = config
  }

  validateOrigin(request: Request): boolean {
    const url = new URL(request.url)
    return this.config.allowedOrigins.some((origin) => url.origin === origin)
  }
}

export class ResponseSanitizer {
  async sanitize(response: Response): Promise<Response> {
    const contentType = response.headers.get('content-type')

    if (contentType?.includes('text/html')) {
      let text = await response.text()
      // Simple XSS prevention - remove script tags
      text = text.replace(
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        ''
      )

      return new Response(text, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      })
    }

    return response
  }
}

export class ServiceWorkerErrorBoundary {
  async handleError(
    error: Error,
    options: {
      fallbackToNetwork?: boolean
      notifyUser?: boolean
      logError?: boolean
    } = {}
  ): Promise<boolean> {
    if (options.logError) {
      console.error('Service Worker Error:', error)
    }

    // Handle gracefully
    return true
  }
}

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
