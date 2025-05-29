import { createClient } from 'next-sanity'
import imageUrlBuilder from '@sanity/image-url'

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  useCdn: true,
  apiVersion: '2024-01-01',
})

const builder = imageUrlBuilder(client)

export const urlFor = (source: any) => {
  if (!source) {
    console.warn('urlFor received null or undefined source')
    // Return a placeholder or empty builder
    return builder.image({})
  }
  return builder.image(source)
}

// Helper function to add timeout to any promise
function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 10000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
    )
  ])
}

// Resilient fetch function with retry logic
export async function resilientFetch<T = any>(
  query: string,
  params: Record<string, any> = {},
  options: { retries?: number; timeout?: number } = {}
): Promise<T | null> {
  const { retries = 2, timeout = 8000 } = options
  
  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      const result = await withTimeout(
        client.fetch<T>(query, params),
        timeout
      )
      return result
    } catch (error) {
      const isLastAttempt = attempt === retries + 1
      
      console.warn(`Sanity fetch attempt ${attempt} failed:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        query: query.slice(0, 100) + '...', // Log first 100 chars of query
        isLastAttempt
      })
      
      if (isLastAttempt) {
        console.error('All Sanity fetch attempts failed, returning null')
        return null
      }
      
      // Wait before retrying (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  return null
}
