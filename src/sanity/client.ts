// src/sanity/client.ts
import { createClient } from 'next-sanity'
import { sanityConfig } from './config'

export const client = createClient(sanityConfig)
