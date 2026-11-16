// ABOUTME: Runs production-validation's readiness poll with bash and stub curl/sleep
// ABOUTME: The smoke tests wait for the live site to answer instead of a fixed sleep (Issue #470)

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const STEP = 'Wait for production to answer'

const workflowText = fs.readFileSync(
  path.join(process.cwd(), '.github/workflows/production-deploy.yml'),
  'utf8'
)
const lines = workflowText.split('\n')

// Returns the body of the `run: |` block of the step with this name
function stepRunScript(name: string): string {
  const start = lines.findIndex((l) => l.trim() === `- name: ${name}`)
  if (start === -1) throw new Error(`step not found: ${name}`)
  const runLine = lines.findIndex((l, i) => i > start && l.trim() === 'run: |')
  const runIndent = lines[runLine].search(/\S/)
  const body: string[] = []
  for (const line of lines.slice(runLine + 1)) {
    if (line.trim() !== '' && line.search(/\S/) <= runIndent) break
    body.push(line)
  }
  const bodyIndent = Math.min(
    ...body.filter((l) => l.trim()).map((l) => l.search(/\S/))
  )
  return body.map((l) => l.slice(bodyIndent)).join('\n')
}

// Runs the step with a curl that fails until call number `succeedOnCall`
// (0 = never succeeds) and a sleep that only records its argument
function runPoll(succeedOnCall: number) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'deploy-ready-'))
  const bin = path.join(dir, 'bin')
  fs.mkdirSync(bin)
  const log = path.join(dir, 'calls.log')
  fs.writeFileSync(log, '')
  fs.writeFileSync(
    path.join(bin, 'curl'),
    `#!/bin/bash
echo "curl $*" >> "${log}"
n=$(grep -c '^curl' "${log}")
[ ${succeedOnCall} -ne 0 ] && [ "$n" -ge ${succeedOnCall} ]
`,
    { mode: 0o755 }
  )
  fs.writeFileSync(
    path.join(bin, 'sleep'),
    `#!/bin/bash\necho "sleep $*" >> "${log}"\n`,
    { mode: 0o755 }
  )
  let ok = true
  let output = ''
  try {
    output = execFileSync('bash', ['-e', '-c', stepRunScript(STEP)], {
      env: {
        PATH: `${bin}:${process.env.PATH ?? '/usr/bin:/bin'}`,
        PRODUCTION_URL: 'https://example.test',
      } as unknown as NodeJS.ProcessEnv,
      stdio: 'pipe',
    }).toString()
  } catch (error) {
    ok = false
    output = String((error as { stdout?: Buffer }).stdout ?? '')
  }
  const calls = fs.readFileSync(log, 'utf8').trim().split('\n').filter(Boolean)
  return { ok, output, calls }
}

describe('production-validation readiness poll (Issue #470)', () => {
  it('has no fixed sleep before the smoke tests', () => {
    expect(workflowText).not.toMatch(/run:\s*sleep \d+/)
    expect(workflowText).not.toContain('Wait for deployment to stabilize')
  })

  it('polls before the smoke tests run', () => {
    const pollAt = workflowText.indexOf(`- name: ${STEP}`)
    const smokeAt = workflowText.indexOf('- name: Run production smoke tests')
    expect(pollAt).toBeGreaterThan(-1)
    expect(pollAt).toBeLessThan(smokeAt)
  })

  it('polls the production URL the smoke tests use', () => {
    expect(workflowText).toMatch(/PRODUCTION_URL: https:\/\/idaromme\.dk/)
  })

  it('returns at once when the site answers on the first request', () => {
    const result = runPoll(1)
    expect(result.ok).toBe(true)
    expect(result.calls).toHaveLength(1)
    expect(result.calls[0]).toContain('https://example.test/')
    expect(result.calls[0]).toContain('--fail')
    expect(result.calls[0]).toMatch(/--max-time \d+/)
  })

  it('retries until the site answers', () => {
    const result = runPoll(4)
    expect(result.ok).toBe(true)
    expect(result.calls.filter((c) => c.startsWith('curl'))).toHaveLength(4)
    expect(result.calls.filter((c) => c.startsWith('sleep'))).toHaveLength(3)
  })

  it('fails the job when the site never answers', () => {
    const result = runPoll(0)
    expect(result.ok).toBe(false)
    expect(result.output).toContain('::error::')
    const attempts = result.calls.filter((c) => c.startsWith('curl')).length
    expect(attempts).toBe(30)
  })
})
