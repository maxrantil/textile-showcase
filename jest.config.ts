import type { Config } from 'jest'
import nextJest from 'next/jest.js'

// Force deterministic test values — unit tests must not depend on real Sanity
// credentials. CI sets the real project ID as a secret (masked as ***), which
// would cause URL-matching assertions to fail if we only used ??= fallbacks.
process.env.NEXT_PUBLIC_SANITY_PROJECT_ID = 'testproject'
process.env.NEXT_PUBLIC_SANITY_DATASET = 'testdataset'

const createJestConfig = nextJest({
  dir: './',
})

const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/sanity/config$': '<rootDir>/src/__mocks__/sanity/config.ts',
    '\\.(css|less|scss|sass)$': '<rootDir>/src/__mocks__/styleMock.ts',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/src/__mocks__/fileMock.ts',
  },
  clearMocks: true,
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/sanity/**/*',
    '!src/app/layout.tsx',
    '!src/__mocks__/**/*',
  ],
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/tests/e2e/',
    '<rootDir>/tests/performance/bundle',
    '<rootDir>/__tests__/deployment/production-config',
  ],
}

// @sanity/image-url v2 is ESM-only: let next/jest's SWC transform compile it
// instead of skipping it like the rest of node_modules
const ESM_PACKAGES = ['@sanity/image-url']

export default async function jestConfig() {
  const resolved = await createJestConfig(config)()
  return {
    ...resolved,
    // next/jest's first pattern is /node_modules/(?!.pnpm)(?!(geist|...)/):
    // add our packages to its exception list
    transformIgnorePatterns: (resolved.transformIgnorePatterns || []).map(
      (pattern, index) =>
        index === 0 && pattern.includes('(?!(')
          ? pattern.replace('(?!(', `(?!(${ESM_PACKAGES.join('|')}|`)
          : pattern
    ),
  }
}
