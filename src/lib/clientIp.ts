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

const HEXTET = /^[0-9a-f]{1,4}$/

/** The first four hextets of an IPv6 address, or null if it is not one */
function ipv6Prefix64(address: string): string[] | null {
  const [head, tail, ...rest] = address.split('::')
  if (rest.length > 0) return null
  const left = head ? head.split(':') : []
  const right = tail ? tail.split(':') : []
  const missing = 8 - left.length - right.length
  if (tail === undefined ? missing !== 0 : missing < 1) return null
  const groups = [
    ...left,
    ...Array(tail === undefined ? 0 : missing).fill('0'),
    ...right,
  ]
  if (!groups.every((g) => HEXTET.test(g))) return null
  return groups.slice(0, 4).map((g) => parseInt(g, 16).toString(16))
}

/**
 * The key a client is rate-limited under. IPv4 addresses are used as they
 * are; an IPv6 host usually gets a whole /64, so all of it counts as one
 * client (Issue #488). IPv4-mapped IPv6 (::ffff:a.b.c.d) counts as the IPv4.
 */
export function clientRateLimitKey(ip: string): string {
  const lower = ip.toLowerCase()
  const mapped = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/.exec(lower)
  if (mapped) return mapped[1]
  if (!lower.includes(':')) return ip

  const prefix = ipv6Prefix64(lower.split('%', 1)[0])
  return prefix ? `${prefix.join(':')}::/64` : ip
}
