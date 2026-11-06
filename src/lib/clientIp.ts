// ABOUTME: Trusted client IP extraction for requests arriving via the nginx reverse proxy
// Uses the rightmost X-Forwarded-For hop, which nginx appends and clients cannot forge

const MAX_IP_LENGTH = 64

function clean(value: string | undefined | null): string | null {
  const trimmed = value?.trim()
  if (!trimmed || trimmed.length > MAX_IP_LENGTH) return null
  return trimmed
}

/**
 * Returns the client IP as seen by our reverse proxy.
 *
 * nginx's `proxy_add_x_forwarded_for` appends `$remote_addr` to whatever the
 * client sent, so only the LAST entry is trustworthy. Taking the first entry
 * would let any client pick its own rate-limit key.
 */
export function getClientIp(request: Pick<Request, 'headers'>): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    const hops = forwarded.split(',')
    const last = clean(hops[hops.length - 1])
    if (last) return last
  }

  return clean(request.headers.get('x-real-ip')) ?? 'unknown'
}
