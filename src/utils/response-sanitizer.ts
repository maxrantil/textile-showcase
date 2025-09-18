// ABOUTME: Response sanitization utilities for service worker security
// Prevents XSS and content injection through cached responses

export class ResponseSanitizer {
  async sanitize(response: Response): Promise<Response> {
    const contentType = response.headers.get('content-type')

    if (contentType?.includes('text/html')) {
      let text = await response.text()
      // Remove potentially dangerous scripts
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
