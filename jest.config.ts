import type { Config } from 'jest'
import nextJest from 'next/jest.js'

// Provide fallback env vars for tests that import modules requiring them at load time
// These are safe non-secret test values; real values in .env.local override via CI
process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ??= 'testproject'
process.env.NEXT_PUBLIC_SANITY_DATASET ??= 'testdataset'

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

export default createJestConfig(config)
