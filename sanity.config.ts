// sanity.config.ts
import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './src/sanity/schemas'
import { SANITY_PROJECT_CONFIG } from './src/sanity/config/project'

export default defineConfig({
  name: 'default',
  title: 'Textile Showcase CMS',
  projectId: '2y05n6hf',
  dataset: 'production',
  plugins: [structureTool(), visionTool()],
  schema: {
    types: schemaTypes,
  },
  basePath: '/studio', // Add this for proper routing
  studioHost: 'textile-studio',
})
