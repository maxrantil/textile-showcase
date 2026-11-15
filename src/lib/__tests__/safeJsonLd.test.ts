// ABOUTME: Tests JSON-LD serialization cannot end its <script> element or create DOM nodes
// CMS strings containing '</script>' or '<!--' must stay JSON string data

import { safeJsonLd } from '../safeJsonLd'

const breakout =
  'Salt</script><meta http-equiv=refresh content=0;url=https://attacker.invalid/><b id=injected>x</b>'

describe('safeJsonLd', () => {
  it('escapes characters that could end or alter a script element', () => {
    const out = safeJsonLd({ name: breakout, note: '<!-- a & b -->' })
    expect(out).not.toMatch(/[<>&]/)
    expect(out).toContain('\\u003c/script\\u003e')
  })

  it('round-trips to the original data through JSON.parse', () => {
    const data = {
      name: breakout,
      sep: 'line\u2028para\u2029end',
      list: [1, 'a&b'],
    }
    expect(JSON.parse(safeJsonLd(data))).toEqual(data)
  })

  it('escapes U+2028 and U+2029 line separators', () => {
    const out = safeJsonLd({ s: '\u2028\u2029' })
    expect(out).toBe('{"s":"\\u2028\\u2029"}')
  })

  it('does not create DOM nodes when written into an ld+json script', () => {
    document.body.innerHTML = `<script type="application/ld+json">${safeJsonLd({ name: breakout })}</script>`
    expect(document.getElementById('injected')).toBeNull()
    expect(document.querySelector('meta[http-equiv="refresh"]')).toBeNull()
    const script = document.querySelector('script[type="application/ld+json"]')
    expect(JSON.parse(script?.textContent ?? '')).toEqual({ name: breakout })
  })
})
