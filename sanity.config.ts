// sanity.config.ts
import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { schemaTypes } from './src/sanity/schemas'

export default defineConfig({
  name: 'default',
  title: 'Textile Showcase CMS',
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '2y05n6hf',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  plugins: [structureTool()],
  schema: {
    types: schemaTypes,
  },
  basePath: '/studio',
  studioHost: 'textile-studio',
})
