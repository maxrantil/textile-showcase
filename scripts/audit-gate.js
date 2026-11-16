// ABOUTME: Fails CI on high/critical npm advisories in production dependencies (Issue #460, audit SEC-09)
// An advisory passes only if .github/audit-exceptions.json lists it with a reason and an unexpired date

/* eslint-disable @typescript-eslint/no-require-imports */

const BLOCKING_SEVERITIES = new Set(['high', 'critical'])
const DATE = /^\d{4}-\d{2}-\d{2}$/

function advisoryId(via) {
  const match = /GHSA-[\w-]+/.exec(via.url || '')
  return match ? match[0] : String(via.source)
}

/** Unique high/critical advisories in `npm audit --json` output */
function blockingAdvisories(auditJson) {
  const byId = new Map()
  for (const vuln of Object.values(auditJson.vulnerabilities || {})) {
    for (const via of vuln.via || []) {
      // String entries point at another vulnerable package; its own entry lists the advisory
      if (typeof via !== 'object' || !BLOCKING_SEVERITIES.has(via.severity)) {
        continue
      }
      const id = advisoryId(via)
      if (!byId.has(id)) {
        byId.set(id, {
          id,
          package: via.name,
          severity: via.severity,
          title: via.title,
          url: via.url,
          range: via.range,
        })
      }
    }
  }
  return [...byId.values()]
}

function isValidException(exception) {
  return (
    !!exception &&
    typeof exception.advisory === 'string' &&
    typeof exception.reason === 'string' &&
    exception.reason.trim() !== '' &&
    typeof exception.expires === 'string' &&
    DATE.test(exception.expires)
  )
}

/**
 * @param auditJson parsed `npm audit --omit=dev --json` output
 * @param exceptions entries of .github/audit-exceptions.json
 * @param today YYYY-MM-DD; an exception is valid up to and including its expiry date
 */
function evaluateAudit(auditJson, exceptions, today) {
  const invalid = exceptions.filter((e) => !isValidException(e))
  const valid = exceptions.filter(isValidException)
  const expired = valid.filter((e) => e.expires < today)
  const active = new Set(
    valid.filter((e) => e.expires >= today).map((e) => e.advisory)
  )

  const advisories = blockingAdvisories(auditJson)
  const excepted = advisories.filter((a) => active.has(a.id))
  const blocking = advisories.filter((a) => !active.has(a.id))

  return {
    ok: blocking.length === 0 && invalid.length === 0 && expired.length === 0,
    blocking,
    excepted,
    expired,
    invalid,
  }
}

function main() {
  const { execFileSync } = require('node:child_process')
  const fs = require('node:fs')
  const path = require('node:path')

  // npm audit exits non-zero when it finds anything; the JSON is still on stdout
  let raw
  try {
    raw = execFileSync('npm', ['audit', '--omit=dev', '--json'], {
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
    })
  } catch (error) {
    raw = error.stdout
  }
  let auditJson
  try {
    auditJson = JSON.parse(raw)
  } catch {
    console.error(
      '❌ npm audit did not return JSON:\n' + String(raw).slice(0, 2000)
    )
    process.exit(2)
  }
  if (auditJson.error) {
    console.error('❌ npm audit failed: ' + JSON.stringify(auditJson.error))
    process.exit(2)
  }

  const exceptionsFile = path.join(
    process.cwd(),
    '.github/audit-exceptions.json'
  )
  const exceptions = fs.existsSync(exceptionsFile)
    ? JSON.parse(fs.readFileSync(exceptionsFile, 'utf8'))
    : []
  const today = new Date().toISOString().slice(0, 10)
  const result = evaluateAudit(auditJson, exceptions, today)

  const counts = auditJson.metadata?.vulnerabilities || {}
  console.log(
    `npm audit --omit=dev: ${counts.total ?? '?'} total ` +
      `(critical ${counts.critical ?? 0}, high ${counts.high ?? 0}, ` +
      `moderate ${counts.moderate ?? 0}, low ${counts.low ?? 0})`
  )
  for (const a of result.excepted) {
    const e = exceptions.find((x) => x.advisory === a.id)
    console.log(
      `⚠️  excepted until ${e.expires}: ${a.id} ${a.package} (${a.severity}) — ${e.reason}`
    )
  }
  for (const a of result.blocking) {
    console.log(
      `❌ ${a.severity}: ${a.id} ${a.package} ${a.range} — ${a.title} ${a.url}`
    )
  }
  for (const e of result.expired) {
    console.log(`❌ exception expired on ${e.expires}: ${e.advisory}`)
  }
  for (const e of result.invalid) {
    console.log(
      `❌ exception needs advisory, reason and expires (YYYY-MM-DD): ${JSON.stringify(e)}`
    )
  }
  if (!result.ok) {
    console.log(
      '\nFix the dependency, or add a reviewed entry with a reason and a near expiry date to .github/audit-exceptions.json'
    )
    process.exit(1)
  }
  console.log(
    '✅ No unreviewed high or critical advisories in production dependencies'
  )
}

if (require.main === module) main()

module.exports = { evaluateAudit }
