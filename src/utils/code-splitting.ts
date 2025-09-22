// ABOUTME: Code splitting utilities - now using production implementation
// Enhanced with advanced features from advanced-code-splitting.ts

export interface ChunkLoadMetrics {
  chunkName: string
  loadTime: number
  size: number
  success: boolean
  retries: number
}

export interface BundleAnalysis {
  totalSize: number
  mainBundle: number
  routeChunks: Record<
    string,
    {
      size: number
      loadTime: number
      compressed: boolean
      preloaded: boolean
      critical: boolean
    }
  >
  chunkCount: number
  timestamp: number
  compressionRatio: number
  loadTimes: Record<string, number>
}

export interface TTIMetrics {
  currentTTI: number
  improvement: number
  baselineTTI: number
}

// Production implementations using advanced code splitting
import {
  bundleAnalyzer,
  ttiMeasurement,
  productionChunkLoader,
} from './advanced-code-splitting'

export async function analyzeBundleSize(): Promise<BundleAnalysis> {
  // Production implementation with real metrics
  return bundleAnalyzer.analyzeBundleSize()
}

export async function measureTTI(): Promise<number> {
  // Production TTI measurement with breakdown
  return ttiMeasurement.measureTTI()
}

export async function loadChunk(chunkName: string): Promise<ChunkLoadMetrics> {
  // Production chunk loading with retries and error handling
  return productionChunkLoader.loadChunk(chunkName, { trigger: 'immediate' })
}

// Route prefetching utility - using production implementation
import { IntelligentRoutePrefetcher } from './advanced-code-splitting'

export class RoutePrefetcher extends IntelligentRoutePrefetcher {
  // Backward compatibility wrapper
  async prefetchRoute(routePath: string): Promise<unknown> {
    return super.prefetchRoute(routePath, 'programmatic')
  }
}

// Safari optimization configuration
export const safariChunkConfig = {
  maxChunks: 20,
  minChunkSize: 50000,
  asyncChunks: 'optimized',
  chunkLoadTimeout: 8000,
  maxConcurrentChunks: 4,
}

// Network simulation utilities
export function simulateNetworkConditions(
  conditions: 'slow-3g' | 'fast-3g' | 'wifi'
) {
  const networkProfiles = {
    'slow-3g': { latency: 2000, bandwidth: '400kbps' },
    'fast-3g': { latency: 500, bandwidth: '1.6Mbps' },
    wifi: { latency: 50, bandwidth: '30Mbps' },
  }

  return networkProfiles[conditions]
}

// Device optimization targets
export const deviceOptimization = {
  mobile: { maxTTI: 2000, chunkPriority: 'aggressive' },
  desktop: { maxTTI: 1500, chunkPriority: 'balanced' },
}

// Bundle constraints validation - using production implementation
export function validateBundleConstraints(
  bundleStats: BundleAnalysis
): boolean {
  return bundleAnalyzer.validateBundleConstraints(bundleStats)
}
