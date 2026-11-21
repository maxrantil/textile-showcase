// ABOUTME: Runs scripts/deploy/vps-release.sh in a temp site directory with stub npm, pm2 and node
// ABOUTME: The VPS reinstalls dependencies only when package-lock.json or Node changed (Issue #467)

import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const repoRoot = process.cwd()
const releaseScript = path.join(repoRoot, 'scripts/deploy/vps-release.sh')
const workflowText = fs.readFileSync(
  path.join(repoRoot, '.github/workflows/production-deploy.yml'),
  'utf8'
)

// Stubs log every call to $CALLS so tests can assert what ran and in what order
const stubs: Record<string, string> = {
  node: `#!/bin/bash
[ "$1" = "--version" ] && echo "\${STUB_NODE_VERSION:-v24.0.0}"`,
  npm: `#!/bin/bash
echo "npm $*" >> "$CALLS"
if [ "$1" = "ci" ]; then
  if [ "\${STUB_NPM_FAIL:-}" = 1 ]; then
    mkdir -p node_modules && touch node_modules/partial
    exit 1
  fi
  mkdir -p node_modules/next/dist/bin && touch node_modules/installed
  echo "\${STUB_NPM_TREE:-new}" > node_modules/next/dist/bin/next
fi`,
  pm2: `#!/bin/bash
echo "pm2 $*" >> "$CALLS"
case "$1 $2" in
  "delete "*) [ "\${STUB_PM2_HAS_APP:-1}" = 1 ] || exit 1 ;;
  "start ecosystem.config.js") [ "\${STUB_PM2_START_FAIL:-}" = 1 ] && exit 1 ;;
  "start idaromme-website") [ -f node_modules/next/dist/bin/next ] || exit 42 ;;
esac
exit 0`,
}

interface Site {
  dir: string
  calls: () => string[]
  run: (env?: Record<string, string>) => { status: number | null; out: string }
}

function makeSite(opts: { lock?: string } = {}): Site {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vps-release-'))
  const bin = path.join(dir, '.stub-bin')
  fs.mkdirSync(bin)
  for (const [name, body] of Object.entries(stubs)) {
    fs.writeFileSync(path.join(bin, name), body, { mode: 0o755 })
  }
  const callsFile = path.join(dir, '.calls')
  fs.writeFileSync(callsFile, '')
  fs.writeFileSync(path.join(dir, 'package-lock.json'), opts.lock ?? 'lock-v1')
  fs.mkdirSync(path.join(dir, '.next'))
  fs.writeFileSync(path.join(dir, '.next/BUILD_ID'), 'old')
  fs.mkdirSync(path.join(dir, '.next.incoming'))
  fs.writeFileSync(path.join(dir, '.next.incoming/BUILD_ID'), 'new')

  return {
    dir,
    calls: () =>
      fs.readFileSync(callsFile, 'utf8').split('\n').filter(Boolean),
    run: (env = {}) => {
      const r = spawnSync('bash', [releaseScript], {
        cwd: dir,
        env: {
          PATH: `${bin}:/usr/bin:/bin`,
          HOME: dir,
          CALLS: callsFile,
          ...env,
        } as unknown as NodeJS.ProcessEnv,
        encoding: 'utf8',
      })
      return { status: r.status, out: `${r.stdout}${r.stderr}` }
    },
  }
}

const START = 'pm2 start ecosystem.config.js --only idaromme-website'

const read = (site: Site, f: string) =>
  fs.readFileSync(path.join(site.dir, f), 'utf8')
const exists = (site: Site, f: string) =>
  fs.existsSync(path.join(site.dir, f))

describe('VPS release script (Issue #467)', () => {
  it('installs, promotes the new build and restarts on a first deploy', () => {
    const site = makeSite()
    const r = site.run()
    expect(r.status).toBe(0)
    expect(site.calls()).toContain('npm ci --omit=dev')
    expect(read(site, '.next/BUILD_ID')).toBe('new')
    expect(exists(site, '.next.incoming')).toBe(false)
    expect(exists(site, '.next.backup')).toBe(false)
    expect(site.calls()).toContain(START)
    expect(site.calls()).toContain('pm2 save')
  })

  it('recreates the PM2 process from ecosystem.config.js so its options apply', () => {
    const site = makeSite()
    site.run()
    const calls = site.calls()
    expect(calls).not.toContain('pm2 restart idaromme-website')
    expect(calls.lastIndexOf('pm2 delete idaromme-website')).toBeGreaterThan(-1)
    expect(calls.lastIndexOf('pm2 delete idaromme-website')).toBeLessThan(
      calls.indexOf(START)
    )
  })

  it('stops PM2 before reinstalling dependencies (Issue #302)', () => {
    const site = makeSite()
    site.run()
    const calls = site.calls()
    expect(calls.indexOf('pm2 stop idaromme-website')).toBeGreaterThan(-1)
    expect(calls.indexOf('pm2 stop idaromme-website')).toBeLessThan(
      calls.indexOf('npm ci --omit=dev')
    )
  })

  it('skips npm ci and the PM2 stop when the lockfile and Node are unchanged', () => {
    const site = makeSite()
    site.run()
    fs.mkdirSync(path.join(site.dir, '.next.incoming'))
    fs.writeFileSync(path.join(site.dir, '.next.incoming/BUILD_ID'), 'newer')
    fs.writeFileSync(path.join(site.dir, '.calls'), '')

    const r = site.run()
    expect(r.status).toBe(0)
    expect(site.calls()).not.toContain('npm ci --omit=dev')
    expect(site.calls()).not.toContain('pm2 stop idaromme-website')
    expect(site.calls()).toContain(START)
    expect(read(site, '.next/BUILD_ID')).toBe('newer')
    expect(exists(site, 'node_modules/installed')).toBe(true)
  })

  it('reinstalls when package-lock.json changed', () => {
    const site = makeSite()
    site.run()
    fs.mkdirSync(path.join(site.dir, '.next.incoming'))
    fs.writeFileSync(path.join(site.dir, 'package-lock.json'), 'lock-v2')
    fs.writeFileSync(path.join(site.dir, '.calls'), '')

    expect(site.run().status).toBe(0)
    expect(site.calls()).toContain('npm ci --omit=dev')
  })

  it('reinstalls when the Node version changed (native modules such as sharp)', () => {
    const site = makeSite()
    site.run({ STUB_NODE_VERSION: 'v24.0.0' })
    fs.mkdirSync(path.join(site.dir, '.next.incoming'))
    fs.writeFileSync(path.join(site.dir, '.calls'), '')

    expect(site.run({ STUB_NODE_VERSION: 'v24.1.0' }).status).toBe(0)
    expect(site.calls()).toContain('npm ci --omit=dev')
  })

  it('reinstalls when node_modules has no stamp from an earlier install', () => {
    const site = makeSite()
    fs.mkdirSync(path.join(site.dir, 'node_modules'))
    expect(site.run().status).toBe(0)
    expect(site.calls()).toContain('npm ci --omit=dev')
  })

  it('keeps the running build and restarts PM2 when npm ci fails', () => {
    const site = makeSite()
    const r = site.run({ STUB_NPM_FAIL: '1' })
    expect(r.status).not.toBe(0)
    expect(read(site, '.next/BUILD_ID')).toBe('old')
    expect(exists(site, 'node_modules/.deploy-lock-hash')).toBe(false)
    expect(site.calls()).toContain('pm2 start idaromme-website')
  })

  // Issue #494: npm ci used to run after rm -rf node_modules, so a failed
  // install left PM2 nothing to start
  describe('when a dependency reinstall fails', () => {
    function siteWithPreviousInstall(): Site {
      const site = makeSite()
      expect(site.run({ STUB_NPM_TREE: 'old' }).status).toBe(0)
      fs.mkdirSync(path.join(site.dir, '.next.incoming'))
      fs.writeFileSync(path.join(site.dir, '.next.incoming/BUILD_ID'), 'newer')
      fs.writeFileSync(path.join(site.dir, 'package-lock.json'), 'lock-v2')
      fs.writeFileSync(path.join(site.dir, '.calls'), '')
      return site
    }

    it('restores the previous node_modules and restarts the running build', () => {
      const site = siteWithPreviousInstall()
      const stamp = read(site, 'node_modules/.deploy-lock-hash')

      const r = site.run({ STUB_NPM_FAIL: '1' })

      expect(r.status).not.toBe(0)
      expect(read(site, 'node_modules/next/dist/bin/next').trim()).toBe('old')
      expect(exists(site, 'node_modules/partial')).toBe(false)
      expect(read(site, 'node_modules/.deploy-lock-hash')).toBe(stamp)
      expect(read(site, '.next/BUILD_ID')).toBe('new')
      expect(read(site, '.next.incoming/BUILD_ID')).toBe('newer')
      expect(site.calls()).toContain('pm2 start idaromme-website')
      expect(r.out).not.toContain('Could not restore PM2 process')
      expect(exists(site, 'node_modules.previous')).toBe(false)
    })

    it('reinstalls on the next deploy, since the lockfile still differs', () => {
      const site = siteWithPreviousInstall()
      site.run({ STUB_NPM_FAIL: '1' })
      fs.writeFileSync(path.join(site.dir, '.calls'), '')

      expect(site.run().status).toBe(0)
      expect(site.calls()).toContain('npm ci --omit=dev')
      expect(read(site, 'node_modules/next/dist/bin/next').trim()).toBe('new')
      expect(read(site, '.next/BUILD_ID')).toBe('newer')
    })
  })

  it('restores the previous node_modules with the previous build when the PM2 start fails', () => {
    const site = makeSite()
    expect(site.run({ STUB_NPM_TREE: 'old' }).status).toBe(0)
    fs.mkdirSync(path.join(site.dir, '.next.incoming'))
    fs.writeFileSync(path.join(site.dir, '.next.incoming/BUILD_ID'), 'newer')
    fs.writeFileSync(path.join(site.dir, 'package-lock.json'), 'lock-v2')

    const r = site.run({ STUB_PM2_START_FAIL: '1' })

    expect(r.status).not.toBe(0)
    expect(read(site, '.next/BUILD_ID')).toBe('new')
    expect(read(site, 'node_modules/next/dist/bin/next').trim()).toBe('old')
    expect(exists(site, 'node_modules.previous')).toBe(false)
  })

  it('falls back to a node_modules.previous left by an interrupted deploy', () => {
    const site = makeSite()
    expect(site.run({ STUB_NPM_TREE: 'old' }).status).toBe(0)
    fs.renameSync(
      path.join(site.dir, 'node_modules'),
      path.join(site.dir, 'node_modules.previous')
    )
    fs.mkdirSync(path.join(site.dir, '.next.incoming'))

    const r = site.run({ STUB_NPM_FAIL: '1' })

    expect(r.status).not.toBe(0)
    expect(read(site, 'node_modules/next/dist/bin/next').trim()).toBe('old')
  })

  it('removes node_modules.previous after a successful deploy', () => {
    const site = makeSite()
    site.run()
    fs.mkdirSync(path.join(site.dir, '.next.incoming'))
    fs.writeFileSync(path.join(site.dir, 'package-lock.json'), 'lock-v2')

    expect(site.run().status).toBe(0)
    expect(exists(site, 'node_modules.previous')).toBe(false)
    expect(exists(site, 'node_modules/installed')).toBe(true)
  })

  it('restores the previous build and starts it again when the PM2 start fails', () => {
    const site = makeSite()
    const r = site.run({ STUB_PM2_START_FAIL: '1' })
    expect(r.status).not.toBe(0)
    expect(read(site, '.next/BUILD_ID')).toBe('old')
    expect(site.calls().filter((c) => c === START)).toHaveLength(2)
  })

  it('removes a .next.backup left over from an interrupted deploy', () => {
    const site = makeSite()
    fs.mkdirSync(path.join(site.dir, '.next.backup'))
    fs.writeFileSync(path.join(site.dir, '.next.backup/BUILD_ID'), 'stale')
    expect(site.run().status).toBe(0)
    expect(read(site, '.next/BUILD_ID')).toBe('new')
    expect(exists(site, '.next.backup')).toBe(false)
  })

  it('fails without touching anything when .next.incoming is missing', () => {
    const site = makeSite()
    fs.rmSync(path.join(site.dir, '.next.incoming'), { recursive: true })
    expect(site.run().status).not.toBe(0)
    expect(read(site, '.next/BUILD_ID')).toBe('old')
    expect(site.calls()).toEqual([])
  })

  it('starts a new PM2 process when none exists', () => {
    const site = makeSite()
    expect(site.run({ STUB_PM2_HAS_APP: '0' }).status).toBe(0)
    expect(site.calls()).toContain(START)
    expect(site.calls()).toContain('pm2 save')
  })
})

describe('production deploy workflow runs the release script (Issue #467)', () => {
  const sshScript = workflowText.slice(workflowText.indexOf('script: |'))

  it('runs scripts/deploy/vps-release.sh after pulling the new source', () => {
    const resetAt = sshScript.indexOf('git reset --hard origin/master')
    const releaseAt = sshScript.indexOf('bash scripts/deploy/vps-release.sh')
    expect(resetAt).toBeGreaterThan(-1)
    expect(releaseAt).toBeGreaterThan(resetAt)
  })

  it('no longer reinstalls node_modules inline on every deploy', () => {
    expect(sshScript).not.toContain('rm -rf node_modules')
    expect(sshScript).not.toContain('cp -r .next .next.backup')
  })
})

describe('ecosystem.config.js for the 2 GB VPS (Issue #467)', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const app = require(path.join(repoRoot, 'ecosystem.config.js')).apps[0]

  it('runs Next directly so PM2 measures and limits the server process', () => {
    expect(app.name).toBe('idaromme-website')
    expect(app.script).toBe('node_modules/next/dist/bin/next')
    expect(fs.existsSync(path.join(repoRoot, app.script))).toBe(true)
    expect(app.args).toBe('start')
    expect(app.env.PORT).toBe(3001)
  })

  it('sets memory limits sized for 2 GB', () => {
    expect(app.node_args).toBe('--max-old-space-size=1024')
    expect(app.max_memory_restart).toBe('800M')
  })

  it("leaves log paths to PM2's default under the deploy user's home", () => {
    expect(app.error_file).toBeUndefined()
    expect(app.out_file).toBeUndefined()
  })
})
