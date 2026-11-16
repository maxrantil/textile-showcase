// ABOUTME: Runs the production deploy's SSH host verification step with bash
// ABOUTME: The deploy must stop when the VPS host key secrets are missing (Issue #458, audit SEC-07)

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

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

const verifyScript = stepRunScript('Configure SSH host verification')

function runVerifyStep(env: Record<string, string>) {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'deploy-ssh-'))
  fs.mkdirSync(path.join(home, '.ssh'))
  const githubEnv = path.join(home, 'github_env')
  fs.writeFileSync(githubEnv, '')
  try {
    execFileSync('bash', ['-e', '-c', verifyScript], {
      env: {
        PATH: process.env.PATH ?? '/usr/bin:/bin',
        HOME: home,
        GITHUB_ENV: githubEnv,
        ...env,
      } as unknown as NodeJS.ProcessEnv,
      stdio: 'pipe',
    })
    return { ok: true, githubEnv: fs.readFileSync(githubEnv, 'utf8'), home }
  } catch {
    return { ok: false, githubEnv: fs.readFileSync(githubEnv, 'utf8'), home }
  }
}

describe('production deploy SSH host verification (Issue #458)', () => {
  it('has a host verification step before the first SSH connection', () => {
    const verifyAt = workflowText.indexOf(
      '- name: Configure SSH host verification'
    )
    const rsyncAt = workflowText.indexOf('rsync -az')
    expect(verifyAt).toBeGreaterThan(-1)
    expect(verifyAt).toBeLessThan(rsyncAt)
  })

  it('fails when VULTR_KNOWN_HOSTS is not set', () => {
    const result = runVerifyStep({ VULTR_HOST_FINGERPRINT: 'SHA256:abc' })
    expect(result.ok).toBe(false)
    expect(result.githubEnv).not.toContain('StrictHostKeyChecking=no')
  })

  it('fails when VULTR_HOST_FINGERPRINT is not set', () => {
    const result = runVerifyStep({
      VULTR_KNOWN_HOSTS: '203.0.113.1 ssh-ed25519 AAAAexample',
    })
    expect(result.ok).toBe(false)
  })

  it('pins the known_hosts entry with strict checking when both are set', () => {
    const knownHosts = '203.0.113.1 ssh-ed25519 AAAAexample'
    const result = runVerifyStep({
      VULTR_KNOWN_HOSTS: knownHosts,
      VULTR_HOST_FINGERPRINT: 'SHA256:abc',
    })
    expect(result.ok).toBe(true)
    expect(result.githubEnv).toContain('StrictHostKeyChecking=yes')
    expect(
      fs.readFileSync(path.join(result.home, '.ssh/known_hosts'), 'utf8')
    ).toContain(knownHosts)
  })

  it('never disables host key checking anywhere in the workflow', () => {
    expect(workflowText).not.toContain('StrictHostKeyChecking=no')
  })

  it('passes the host fingerprint to the ssh-action deploy step', () => {
    const sshAction = workflowText.slice(
      workflowText.indexOf('uses: appleboy/ssh-action')
    )
    const withBlock = sshAction.slice(0, sshAction.indexOf('script: |'))
    expect(withBlock).toContain(
      'fingerprint: ${{ secrets.VULTR_HOST_FINGERPRINT }}'
    )
  })
})
