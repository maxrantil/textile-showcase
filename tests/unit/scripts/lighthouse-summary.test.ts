// ABOUTME: Tests for the Lighthouse CI summary used by the PR comment and budget steps
// Missing metrics must read as n/a with the reason, never as 0

import {
  formatMarkdown,
  isLighthouseReport,
  summarizeReport,
} from '../../../scripts/lighthouse-summary.js'

const report = (overrides: Record<string, unknown> = {}) => ({
  lighthouseVersion: '12.0.0',
  requestedUrl: 'http://localhost:3000/about',
  finalUrl: 'http://localhost:3000/about',
  categories: { performance: { score: 0.82 } },
  audits: {
    'largest-contentful-paint': { numericValue: 3051.4 },
    'first-contentful-paint': { numericValue: 766.2 },
    'cumulative-layout-shift': { numericValue: 0.0123 },
  },
  runWarnings: [],
  ...overrides,
})

describe('isLighthouseReport', () => {
  it('accepts Lighthouse result objects', () => {
    expect(isLighthouseReport(report())).toBe(true)
  })

  it('rejects the lhci manifest and other JSON files', () => {
    expect(isLighthouseReport([{ url: 'x', jsonPath: 'a.json' }])).toBe(false)
    expect(isLighthouseReport({ foo: 1 })).toBe(false)
  })
})

describe('summarizeReport', () => {
  it('extracts rounded metrics for a normal run', () => {
    expect(summarizeReport(report())).toEqual({
      url: '/about',
      performance: 82,
      lcp: 3051,
      fcp: 766,
      cls: 0.012,
      notes: [],
    })
  })

  it('reports missing performance score and LCP as null, not 0', () => {
    const s = summarizeReport(
      report({
        requestedUrl: 'http://localhost:3000',
        finalUrl: 'http://localhost:3000/',
        categories: { performance: { score: null } },
        audits: {
          'largest-contentful-paint': {
            numericValue: undefined,
            errorMessage:
              'The page did not display content that qualifies as a LCP. (NO_LCP)',
          },
          'first-contentful-paint': { numericValue: 1125 },
          'cumulative-layout-shift': { numericValue: 0 },
        },
      })
    )
    expect(s.url).toBe('/')
    expect(s.performance).toBeNull()
    expect(s.lcp).toBeNull()
    expect(s.fcp).toBe(1125)
    expect(s.notes.join(' ')).toContain('NO_LCP')
  })

  it('includes runtime errors and run warnings in notes', () => {
    const s = summarizeReport(
      report({
        runtimeError: {
          code: 'NO_FCP',
          message: 'The page did not paint any content.',
        },
        runWarnings: [
          'The page loaded too slowly to finish within the time limit.',
        ],
      })
    )
    expect(s.notes).toEqual(
      expect.arrayContaining([
        expect.stringContaining('NO_FCP'),
        expect.stringContaining('too slowly'),
      ])
    )
  })
})

describe('formatMarkdown', () => {
  it('renders n/a for missing values and lists notes once per page', () => {
    const rows = [
      summarizeReport(report()),
      summarizeReport(
        report({
          requestedUrl: 'http://localhost:3000',
          finalUrl: 'http://localhost:3000/',
          categories: { performance: { score: null } },
          audits: {
            'largest-contentful-paint': { errorMessage: 'NO_LCP' },
            'first-contentful-paint': { numericValue: 1125 },
            'cumulative-layout-shift': { numericValue: 0 },
          },
        })
      ),
      summarizeReport(
        report({
          requestedUrl: 'http://localhost:3000',
          finalUrl: 'http://localhost:3000/',
          categories: { performance: { score: null } },
          audits: {
            'largest-contentful-paint': { errorMessage: 'NO_LCP' },
            'first-contentful-paint': { numericValue: 1130 },
            'cumulative-layout-shift': { numericValue: 0 },
          },
        })
      ),
    ]
    const md = formatMarkdown(rows)
    expect(md).toContain('| /about | 🔴 82% | 🔴 3051ms |')
    expect(md).toContain('| / | ⚪ n/a | ⚪ n/a |')
    expect(md).not.toMatch(/\| \/ \| 🔴 0%/)
    expect(md).not.toContain('Unknown URL')
    expect(md.match(/NO_LCP/g)).toHaveLength(1)
  })

  it('says so when there are no results', () => {
    expect(formatMarkdown([])).toContain('No Lighthouse results found')
  })
})
