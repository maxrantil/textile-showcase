// ABOUTME: Guards against downloading the same font bytes twice under different URLs
// inter-400.woff2 and inter-500.woff2 were identical files, both preloaded on every page

import { createHash } from 'node:crypto'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const css = readFileSync(join(root, 'src/styles/critical/critical.css'), 'utf8')
const layout = readFileSync(join(root, 'src/app/layout.tsx'), 'utf8')

const fontFaceUrls = [
  ...new Set(
    [...css.matchAll(/url\('(\/fonts\/[^']+\.woff2)'\)/g)].map((m) => m[1])
  ),
]
const preloadedFonts = [
  ...layout.matchAll(/href="(\/fonts\/[^"]+\.woff2)"/g),
].map((m) => m[1])

const hashOf = (url: string) =>
  createHash('sha256')
    .update(readFileSync(join(root, 'public', url)))
    .digest('hex')

describe('self-hosted fonts', () => {
  it('every @font-face and preload URL exists', () => {
    for (const url of [...fontFaceUrls, ...preloadedFonts]) {
      expect(existsSync(join(root, 'public', url))).toBe(true)
    }
  })

  it('no two font URLs serve byte-identical files', () => {
    const byHash = new Map<string, string>()
    for (const url of fontFaceUrls) {
      const hash = hashOf(url)
      expect(byHash.get(hash) ?? url).toBe(url)
      byHash.set(hash, url)
    }
  })

  it('preloads each font file once, and only files @font-face uses', () => {
    expect(new Set(preloadedFonts).size).toBe(preloadedFonts.length)
    for (const url of preloadedFonts) expect(fontFaceUrls).toContain(url)
  })
})
