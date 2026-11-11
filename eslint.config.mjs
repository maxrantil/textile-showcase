// ABOUTME: ESLint flat config using eslint-config-next's native flat presets
// ABOUTME: (core-web-vitals + typescript); FlatCompat is not needed since Next 16
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'

const eslintConfig = [
  {
    ignores: ['scripts/dist/**', 'scripts/dist/**/*', '**/scripts/dist/**'],
  },
  ...nextCoreWebVitals,
  ...nextTypescript,
]

export default eslintConfig
