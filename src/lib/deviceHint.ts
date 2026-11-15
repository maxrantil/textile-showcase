// ABOUTME: Server-side device guess from request headers, used for the initial project view
// The client's useDeviceType still corrects it after hydration; this only avoids a swap

export type DeviceHint = 'mobile' | 'desktop'

/**
 * Phones send "Mobi" in the User-Agent (MDN's recommended check); tablets such as
 * iPad and Android tablets do not, and get the desktop layout like on the client.
 * Chromium's Sec-CH-UA-Mobile client hint is authoritative when present.
 */
export function deviceTypeFromHeaders(
  headers: Pick<Headers, 'get'>
): DeviceHint {
  const chMobile = headers.get('sec-ch-ua-mobile')
  if (chMobile === '?1') return 'mobile'
  if (chMobile === '?0') return 'desktop'

  const ua = headers.get('user-agent') || ''
  return /Mobi/i.test(ua) ? 'mobile' : 'desktop'
}
