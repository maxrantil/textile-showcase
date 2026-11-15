#!/usr/bin/env node
// ABOUTME: Enforces a per-route JavaScript budget against a production build
// Starts `next start`, loads each route and sums gzipped size of the module scripts its HTML references

import { spawn } from 'node:child_process'
import fs from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import zlib from 'node:zlib'

const require = createRequire(import.meta.url)

const PORT = Number(process.env.BUDGET_PORT || 3999)
const BASE = `http://127.0.0.1:${PORT}`
const NEXT_DIR = path.join(process.cwd(), '.next')

/** Gzipped first-load JS allowed per public route */
const BUDGET_GZIP_KB = Number(process.env.ROUTE_JS_BUDGET_KB || 250)

// Content routes visitors load. /studio (Sanity Studio) is intentionally excluded.
const ROUTES = ['/', '/about', '/contact', '/projects', '/project/budget-check']

const SCRIPT_TAG = /<script\b[^>]*>/gi
const SRC_ATTR = /\bsrc="([^"]+\.js)"/i

/** Module scripts referenced by the HTML; nomodule polyfills are skipped by modern browsers */
function scriptsIn(html) {
  const files = new Set()
  for (const tag of html.match(SCRIPT_TAG) || []) {
    if (/\bnomodule\b/i.test(tag)) continue
    const src = tag.match(SRC_ATTR)?.[1]
    if (src?.startsWith('/_next/')) files.add(src.replace(/^\/_next\//, ''))
  }
  return [...files]
}

function measure(files) {
  let raw = 0
  let gzip = 0
  for (const file of files) {
    const fullPath = path.join(NEXT_DIR, file)
    if (!fs.existsSync(fullPath)) continue
    const content = fs.readFileSync(fullPath)
    raw += content.length
    gzip += zlib.gzipSync(content, { level: 9 }).length
  }
  return { raw, gzip }
}

async function waitForServer(timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${BASE}/robots.txt`)
      if (res.ok) return
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 500))
  }
  throw new Error(`next start did not respond on port ${PORT}`)
}

async function main() {
  if (!fs.existsSync(path.join(NEXT_DIR, 'BUILD_ID'))) {
    console.error('❌ No production build found. Run `npm run build` first.')
    process.exit(1)
  }

  const server = spawn(
    process.execPath,
    [require.resolve('next/dist/bin/next'), 'start', '-p', String(PORT)],
    { stdio: 'ignore', env: { ...process.env, NODE_ENV: 'production' } }
  )

  let failed = false
  try {
    await waitForServer()
    console.log(`📦 Route JS budget: ${BUDGET_GZIP_KB}KB gzip per route\n`)

    for (const route of ROUTES) {
      const html = await (await fetch(`${BASE}${route}`)).text()
      const files = scriptsIn(html)
      const { raw, gzip } = measure(files)
      const gzipKb = gzip / 1024
      const ok = gzipKb <= BUDGET_GZIP_KB
      if (!ok) failed = true
      console.log(
        `${ok ? '✅' : '❌'} ${route.padEnd(24)} ${String(files.length).padStart(3)} scripts  ` +
          `${(raw / 1024).toFixed(0).padStart(5)}KB raw  ${gzipKb.toFixed(0).padStart(4)}KB gzip`
      )
    }
  } finally {
    server.kill()
  }

  if (failed) {
    console.error(
      `\n❌ One or more routes exceed the ${BUDGET_GZIP_KB}KB gzip JavaScript budget`
    )
    process.exit(1)
  }
  console.log('\n✅ All routes within budget')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
