// ABOUTME: Keeps the agreed LCP target (Core Web Vitals "good", 2.5s) consistent across
// Lighthouse configurations, which previously set 5s / 3s / 1.5s in different places

const LCP_TARGET_MS = 2500

const loadConfig = (env: Record<string, string | undefined>) => {
  const saved = { ...process.env }
  Object.assign(process.env, env)
  for (const [k, v] of Object.entries(env))
    if (v === undefined) delete process.env[k]
  jest.resetModules()
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const config = require('../../lighthouserc.js')
  process.env = saved
  return config.ci.assert.assertions['largest-contentful-paint']
}

describe('Lighthouse LCP target', () => {
  it.each([
    ['default', { CI: undefined, NODE_ENV: 'test' }],
    ['CI', { CI: 'true', NODE_ENV: 'test' }],
    ['development', { CI: undefined, NODE_ENV: 'development' }],
  ])('%s config asserts LCP <= 2.5s', (_, env) => {
    const [, options] = loadConfig(env)
    expect(options.maxNumericValue).toBe(LCP_TARGET_MS)
  })
})
