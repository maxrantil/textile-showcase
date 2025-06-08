import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './src/sanity/schemas'
import { SANITY_PROJECT_CONFIG } from './src/sanity/config/project'

export default defineConfig({
  name: 'default',
  title: 'Textile Showcase CMS',
  projectId: SANITY_PROJECT_CONFIG.projectId,
  dataset: SANITY_PROJECT_CONFIG.dataset,
  plugins: [structureTool(), visionTool()],
  schema: {
    types: schemaTypes,
  },
})
