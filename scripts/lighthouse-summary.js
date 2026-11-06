// ABOUTME: Summarizes Lighthouse CI result files for the PR comment and budget steps
// Missing metrics are reported as null ("n/a") with Lighthouse's reason, never as 0

const BASE_URL = 'http://localhost:3000'

/** lhci writes lhr-*.json reports next to a manifest.json; only reports count */
function isLighthouseReport(data) {
  return (
    !!data &&
    typeof data === 'object' &&
    !Array.isArray(data) &&
    typeof data.lighthouseVersion === 'string' &&
    !!data.audits
  )
}

function numeric(audit) {
  const value = audit?.numericValue
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function round(value, factor = 1) {
  return value === null ? null : Math.round(value * factor) / factor
}

function pagePath(data) {
  const url = data.finalUrl || data.requestedUrl || ''
  const path = url.replace(BASE_URL, '')
  return path === '' ? '/' : path
}

/** One row per Lighthouse run */
function summarizeReport(data) {
  const audits = data.audits || {}
  const score = data.categories?.performance?.score
  const lcpAudit = audits['largest-contentful-paint']

  const notes = []
  if (data.runtimeError?.code) {
    notes.push(
      `${data.runtimeError.code}: ${data.runtimeError.message || ''}`.trim()
    )
  }
  if (numeric(lcpAudit) === null && lcpAudit?.errorMessage) {
    notes.push(`LCP: ${lcpAudit.errorMessage}`)
  }
  for (const warning of data.runWarnings || []) {
    notes.push(String(warning))
  }

  return {
    url: pagePath(data),
    performance: typeof score === 'number' ? Math.round(score * 100) : null,
    lcp: round(numeric(lcpAudit)),
    fcp: round(numeric(audits['first-contentful-paint'])),
    cls: round(numeric(audits['cumulative-layout-shift']), 1000),
    notes,
  }
}

const NA = '⚪ n/a'

function cell(value, render) {
  return value === null ? NA : render(value)
}

function formatMarkdown(rows) {
  let body = '## 🔍 Lighthouse Performance Report\n\n'

  if (rows.length === 0) {
    body +=
      '❌ No Lighthouse results found. Check the workflow logs for details.\n'
    return body
  }

  body += '### Performance Scores\n\n'
  body += '| Page | Performance | LCP | FCP | CLS |\n'
  body += '|------|-------------|-----|-----|-----|\n'

  for (const r of rows) {
    const perf = cell(
      r.performance,
      (v) => `${v >= 98 ? '🟢' : v >= 90 ? '🟡' : '🔴'} ${v}%`
    )
    const lcp = cell(
      r.lcp,
      (v) => `${v <= 1200 ? '🟢' : v <= 2500 ? '🟡' : '🔴'} ${v}ms`
    )
    const fcp = cell(
      r.fcp,
      (v) => `${v <= 1200 ? '🟢' : v <= 1800 ? '🟡' : '🔴'} ${v}ms`
    )
    const cls = cell(
      r.cls,
      (v) => `${v <= 0.1 ? '🟢' : v <= 0.25 ? '🟡' : '🔴'} ${v}`
    )
    body += `| ${r.url} | ${perf} | ${lcp} | ${fcp} | ${cls} |\n`
  }

  // Unique notes per page, so three runs with the same error show it once
  const notesByPage = new Map()
  for (const r of rows) {
    if (!notesByPage.has(r.url)) notesByPage.set(r.url, new Set())
    for (const note of r.notes) notesByPage.get(r.url).add(note)
  }
  const pagesWithNotes = [...notesByPage].filter(([, notes]) => notes.size > 0)
  if (pagesWithNotes.length > 0) {
    body += '\n### Notes\n'
    for (const [url, notes] of pagesWithNotes) {
      for (const note of notes) body += `- \`${url}\`: ${note}\n`
    }
  }

  body += '\n### Thresholds\n'
  body += '- 🟢 **Performance**: ≥98% (Target)\n'
  body += '- 🟡 **Performance**: 90-97% (Needs improvement)\n'
  body += '- 🔴 **Performance**: <90% (Poor)\n'
  body += '- **LCP**: 🟢 ≤1.2s, 🟡 ≤2.5s, 🔴 >2.5s\n'
  body += '- **FCP**: 🟢 ≤1.2s, 🟡 ≤1.8s, 🔴 >1.8s\n'
  body += '- **CLS**: 🟢 ≤0.1, 🟡 ≤0.25, 🔴 >0.25\n'
  body += '- ⚪ **n/a**: Lighthouse produced no value (see Notes)\n'
  return body
}

module.exports = { isLighthouseReport, summarizeReport, formatMarkdown }
