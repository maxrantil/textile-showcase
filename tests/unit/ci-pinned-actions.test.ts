// ABOUTME: Checks that every CI action and reusable workflow is pinned to a full commit SHA
// Tags and branches can move upstream; a SHA cannot (Issue #462, audit SEC-08)

import fs from 'node:fs'
import path from 'node:path'

const workflowDir = path.join(process.cwd(), '.github/workflows')
const workflows = fs
  .readdirSync(workflowDir)
  .filter((f) => f.endsWith('.yml') || f.endsWith('.yaml'))
  .map((f) => ({
    file: f,
    text: fs.readFileSync(path.join(workflowDir, f), 'utf8'),
  }))

const usesRefs = workflows.flatMap(({ file, text }) =>
  [...text.matchAll(/^\s*-?\s*uses:\s*([^\s#]+)/gm)].map((m) => ({
    file,
    ref: m[1],
  }))
)

describe('CI supply chain pinning (Issue #462)', () => {
  it('finds the workflows and their uses: references', () => {
    expect(workflows.length).toBeGreaterThan(5)
    expect(usesRefs.length).toBeGreaterThan(20)
  })

  it('pins every remote action and reusable workflow to a 40-character commit SHA', () => {
    const unpinned = usesRefs
      .filter(({ ref }) => !ref.startsWith('./'))
      .filter(({ ref }) => !/@[0-9a-f]{40}$/.test(ref))
      .map(({ file, ref }) => `${file}: ${ref}`)
    expect(unpinned).toEqual([])
  })

  it('installs CLI tools at exact versions, not ranges', () => {
    const ranged = workflows.flatMap(({ file, text }) =>
      [...text.matchAll(/npm (?:install|i) -g (\S+)/g)]
        .map((m) => m[1])
        .filter((pkg) => !/@\d+\.\d+\.\d+$/.test(pkg))
        .map((pkg) => `${file}: ${pkg}`)
    )
    expect(ranged).toEqual([])
  })

  it('has Dependabot update the pinned actions', () => {
    const config = fs.readFileSync(
      path.join(process.cwd(), '.github/dependabot.yml'),
      'utf8'
    )
    expect(config).toMatch(/package-ecosystem:\s*['"]?github-actions/)
  })
})
