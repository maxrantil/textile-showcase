// ABOUTME: Guards against shipping the same font bytes under two file names
// Two identical files cost a second download on every page (Issue #429)

import { createHash } from 'crypto'
import { readdirSync, readFileSync, statSync } from 'fs'
import path from 'path'

const FONTS_DIR = path.join(process.cwd(), 'public/fonts')

describe('self-hosted fonts', () => {
  it('has no two font files with identical bytes', () => {
    const filesByHash = new Map<string, string[]>()

    const fontFiles = (
      readdirSync(FONTS_DIR, { recursive: true }) as string[]
    ).filter((file) => statSync(path.join(FONTS_DIR, file)).isFile())

    for (const file of fontFiles) {
      const hash = createHash('sha256')
        .update(readFileSync(path.join(FONTS_DIR, file)))
        .digest('hex')
      filesByHash.set(hash, [...(filesByHash.get(hash) ?? []), file])
    }

    const duplicates = [...filesByHash.values()].filter(
      (files) => files.length > 1
    )
    expect(duplicates).toEqual([])
  })

  // The file is a variable font. The CSS declares weights 400 and 500 only, so
  // the file carries the weight axis from 400 to 500 and no more. A full 100 to
  // 900 axis is about 48KB, and the font is downloaded ahead of first paint
  it('keeps the preloaded font within the size of a 400 to 500 weight axis', () => {
    const { size } = statSync(path.join(FONTS_DIR, 'inter-400.woff2'))

    expect(size).toBeLessThanOrEqual(36 * 1024)
  })

  it('only preloads font files that exist', () => {
    const layout = readFileSync(
      path.join(process.cwd(), 'src/app/layout.tsx'),
      'utf8'
    )
    const preloaded = [...layout.matchAll(/href="\/fonts\/([^"]+)"/g)].map(
      (match) => match[1]
    )

    expect(preloaded).toEqual(['inter-400.woff2'])
    expect(readdirSync(FONTS_DIR)).toEqual(expect.arrayContaining(preloaded))
  })
})
