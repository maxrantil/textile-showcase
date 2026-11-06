// ABOUTME: Serializes structured data for <script type="application/ld+json"> without element breakout
// Escapes <, >, & and U+2028/U+2029 as JSON unicode escapes so CMS strings stay JSON data

const UNSAFE_CHARS = /[<>&\u2028\u2029]/g

export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(
    UNSAFE_CHARS,
    (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`
  )
}
