// ABOUTME: Tests for the npm audit gate used by Production Deploy, Unit Tests and weekly monitoring
// High/critical production advisories fail unless a dated, unexpired exception covers them (Issue #460)

import { evaluateAudit } from '../../../scripts/audit-gate.js'

const advisory = (
  ghsa: string,
  severity: string,
  name = 'pkg'
): Record<string, unknown> => ({
  source: 1,
  name,
  dependency: name,
  title: `${name} advisory`,
  url: `https://github.com/advisories/${ghsa}`,
  severity,
  range: '<2.0.0',
})

const audit = (...vias: Record<string, unknown>[]) => ({
  vulnerabilities: Object.fromEntries(
    vias.map((via, i) => [
      `${via.name}-${i}`,
      { name: via.name, severity: via.severity, via: [via, 'other-pkg'] },
    ])
  ),
})

const TODAY = '2026-11-16'

describe('evaluateAudit (Issue #460)', () => {
  it('passes when there are only low and moderate advisories', () => {
    const result = evaluateAudit(
      audit(
        advisory('GHSA-aaaa-aaaa-aaaa', 'low'),
        advisory('GHSA-bbbb-bbbb-bbbb', 'moderate')
      ),
      [],
      TODAY
    )
    expect(result.ok).toBe(true)
    expect(result.blocking).toEqual([])
  })

  it('fails on a high advisory', () => {
    const result = evaluateAudit(
      audit(advisory('GHSA-cccc-cccc-cccc', 'high', 'next')),
      [],
      TODAY
    )
    expect(result.ok).toBe(false)
    expect(result.blocking).toEqual([
      expect.objectContaining({ id: 'GHSA-cccc-cccc-cccc', package: 'next' }),
    ])
  })

  it('fails on a critical advisory', () => {
    const result = evaluateAudit(
      audit(advisory('GHSA-dddd-dddd-dddd', 'critical')),
      [],
      TODAY
    )
    expect(result.ok).toBe(false)
  })

  it('reports an advisory shared by several packages once', () => {
    const shared = advisory('GHSA-eeee-eeee-eeee', 'high', 'sharp')
    const result = evaluateAudit(audit(shared, shared), [], TODAY)
    expect(result.blocking).toHaveLength(1)
  })

  it('passes a high advisory covered by an unexpired exception', () => {
    const result = evaluateAudit(
      audit(advisory('GHSA-ffff-ffff-ffff', 'high')),
      [
        {
          advisory: 'GHSA-ffff-ffff-ffff',
          expires: '2026-12-01',
          reason: 'build-time only, no fix yet',
        },
      ],
      TODAY
    )
    expect(result.ok).toBe(true)
    expect(result.excepted.map((a) => a.id)).toEqual(['GHSA-ffff-ffff-ffff'])
  })

  it('fails when the exception has expired', () => {
    const result = evaluateAudit(
      audit(advisory('GHSA-gggg-gggg-gggg', 'high')),
      [
        {
          advisory: 'GHSA-gggg-gggg-gggg',
          expires: '2026-11-15',
          reason: 'expired yesterday',
        },
      ],
      TODAY
    )
    expect(result.ok).toBe(false)
    expect(result.expired.map((e: { advisory: string }) => e.advisory)).toEqual(
      ['GHSA-gggg-gggg-gggg']
    )
  })

  it('still counts an exception as valid on its expiry date', () => {
    const result = evaluateAudit(
      audit(advisory('GHSA-hhhh-hhhh-hhhh', 'high')),
      [{ advisory: 'GHSA-hhhh-hhhh-hhhh', expires: TODAY, reason: 'last day' }],
      TODAY
    )
    expect(result.ok).toBe(true)
  })

  it('rejects an exception without a reason or a valid expiry date', () => {
    const result = evaluateAudit(
      audit(advisory('GHSA-iiii-iiii-iiii', 'high')),
      [{ advisory: 'GHSA-iiii-iiii-iiii', expires: 'someday', reason: '' }],
      TODAY
    )
    expect(result.ok).toBe(false)
    expect(result.invalid).toHaveLength(1)
  })
})
