// ABOUTME: Checks that production-validation runs in the Playwright container image
// ABOUTME: The image tag must match @playwright/test in package-lock.json (Issue #473)

import fs from 'node:fs'
import path from 'node:path'

const workflowText = fs.readFileSync(
  path.join(process.cwd(), '.github/workflows/production-deploy.yml'),
  'utf8'
)
const lockfile = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'package-lock.json'), 'utf8')
)
const playwrightVersion: string =
  lockfile.packages['node_modules/@playwright/test'].version

// The production-validation job, up to the next top-level job (or end of file)
function jobBlock(name: string): string {
  const lines = workflowText.split('\n')
  const start = lines.findIndex((l) => l === `  ${name}:`)
  if (start === -1) throw new Error(`job not found: ${name}`)
  const end = lines.findIndex(
    (l, i) => i > start && /^ {2}[A-Za-z0-9_-]+:\s*$/.test(l)
  )
  return lines.slice(start, end === -1 ? undefined : end).join('\n')
}

const job = jobBlock('production-validation')

describe('production-validation Playwright container (Issue #473)', () => {
  it('runs in the Playwright image pinned by digest', () => {
    expect(job).toMatch(
      /image: mcr\.microsoft\.com\/playwright:v[\d.]+-noble@sha256:[0-9a-f]{64}/
    )
  })

  it('uses the image for the @playwright/test version in package-lock.json', () => {
    const tag = job.match(/mcr\.microsoft\.com\/playwright:v([\d.]+)-noble/)
    // On a Playwright bump, update the image tag and digest in production-deploy.yml:
    // curl -sI -H 'Accept: application/vnd.oci.image.index.v1+json' \
    //   https://mcr.microsoft.com/v2/playwright/manifests/v<version>-noble | grep -i digest
    expect(tag?.[1]).toBe(playwrightVersion)
  })

  it('does not install browsers or system packages at run time', () => {
    const commands = job
      .split('\n')
      .filter((l) => !l.trim().startsWith('#'))
      .join('\n')
    expect(commands).not.toMatch(/playwright install/)
  })

  it('sets HOME to /root so Firefox starts as root in the container', () => {
    expect(job).toMatch(/HOME: \/root/)
  })

  it('still runs the smoke tests in Chrome and Firefox', () => {
    expect(job).toContain('--project="Desktop Chrome"')
    expect(job).toContain('--project="Desktop Firefox"')
  })
})
