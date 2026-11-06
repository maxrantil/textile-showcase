// ABOUTME: ESLint flat config using eslint-config-next's native flat exports
// Covers Next.js core-web-vitals and TypeScript rule sets

import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'

const eslintConfig = [
  {
    ignores: [
      'scripts/dist/**',
      '.next/**',
      'node_modules/**',
      'coverage/**',
      'playwright-report/**',
      'test-results/**',
    ],
  },
  ...nextCoreWebVitals,
  ...nextTypescript,
]

export default eslintConfig
