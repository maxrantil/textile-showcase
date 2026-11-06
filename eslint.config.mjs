import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { FlatCompat } from '@eslint/eslintrc'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
})

const eslintConfig = [
  {
    ignores: [
      'scripts/dist/**',
      'scripts/dist/**/*',
      '**/scripts/dist/**',
      // Vendored agent skills (upstream code, see .claude/skills/*/UPSTREAM.md)
      '.claude/**',
    ],
  },
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
]

export default eslintConfig
