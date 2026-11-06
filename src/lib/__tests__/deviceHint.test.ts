// ABOUTME: Tests server-side device guess from request headers (User-Agent, Sec-CH-UA-Mobile)
// Phones get the mobile project view in the initial HTML; tablets and desktops get desktop

import { deviceTypeFromHeaders } from '../deviceHint'

const h = (ua: string, chMobile?: string) =>
  new Headers({
    'user-agent': ua,
    ...(chMobile ? { 'sec-ch-ua-mobile': chMobile } : {}),
  })

const IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
const ANDROID_PHONE =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36'
const ANDROID_TABLET =
  'Mozilla/5.0 (Linux; Android 14; SM-X910) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36'
const IPAD =
  'Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/604.1'
const DESKTOP =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36'

describe('deviceTypeFromHeaders', () => {
  it.each([
    ['iPhone', IPHONE, 'mobile'],
    ['Android phone', ANDROID_PHONE, 'mobile'],
    ['Android tablet', ANDROID_TABLET, 'desktop'],
    ['iPad', IPAD, 'desktop'],
    ['desktop Chrome', DESKTOP, 'desktop'],
  ])('%s → %s', (_, ua, expected) => {
    expect(deviceTypeFromHeaders(h(ua))).toBe(expected)
  })

  it('trusts Sec-CH-UA-Mobile when present', () => {
    expect(deviceTypeFromHeaders(h(DESKTOP, '?1'))).toBe('mobile')
    expect(deviceTypeFromHeaders(h(ANDROID_PHONE, '?0'))).toBe('desktop')
  })

  it('defaults to desktop without headers', () => {
    expect(deviceTypeFromHeaders(new Headers())).toBe('desktop')
  })
})
