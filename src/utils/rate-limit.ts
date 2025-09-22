// ABOUTME: Rate limiting utilities for performance monitoring endpoints

import type { NextRequest } from 'next/server'

export interface RateLimitConfig {
  maxRequests: number
  windowMs: number
  keyGenerator?: (request: NextRequest) => string
}

export interface RateLimitResult {
  success: boolean
  remaining: number
  resetTime: number
  error?: string
}

// In-memory storage for development (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

/**
 * Performance-specific rate limiter
 */
export class PerformanceRateLimiter {
  private static readonly DEFAULT_CONFIG: RateLimitConfig = {
    maxRequests: 100,
    windowMs: 60 * 60 * 1000, // 1 hour
  }

  static async checkLimit(
    request: NextRequest,
    config: Partial<RateLimitConfig> = {}
  ): Promise<RateLimitResult> {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config }
    const key = finalConfig.keyGenerator
      ? finalConfig.keyGenerator(request)
      : this.getDefaultKey(request)

    const now = Date.now()
    const windowEnd = now + finalConfig.windowMs

    // Clean up expired entries occasionally
    if (Math.random() < 0.01) {
      this.cleanup(now)
    }

    const current = rateLimitStore.get(key)

    if (!current) {
      // First request
      rateLimitStore.set(key, { count: 1, resetTime: windowEnd })
      return {
        success: true,
        remaining: finalConfig.maxRequests - 1,
        resetTime: windowEnd,
      }
    }

    if (now >= current.resetTime) {
      // Window expired, reset
      rateLimitStore.set(key, { count: 1, resetTime: windowEnd })
      return {
        success: true,
        remaining: finalConfig.maxRequests - 1,
        resetTime: windowEnd,
      }
    }

    if (current.count >= finalConfig.maxRequests) {
      // Rate limit exceeded
      return {
        success: false,
        remaining: 0,
        resetTime: current.resetTime,
        error: 'Rate limit exceeded',
      }
    }

    // Increment and allow
    rateLimitStore.set(key, {
      count: current.count + 1,
      resetTime: current.resetTime,
    })
    return {
      success: true,
      remaining: finalConfig.maxRequests - current.count - 1,
      resetTime: current.resetTime,
    }
  }

  private static getDefaultKey(request: NextRequest): string {
    // Use IP + User-Agent for more granular limiting
    const ip = this.getClientIP(request)
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const userAgentHash = this.simpleHash(userAgent)
    return `performance:${ip}:${userAgentHash}`
  }

  private static getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for')
    const realIP = request.headers.get('x-real-ip')
    const cfIP = request.headers.get('cf-connecting-ip')

    if (forwarded) {
      return forwarded.split(',')[0].trim()
    }
    if (realIP) return realIP
    if (cfIP) return cfIP
    return 'unknown'
  }

  private static simpleHash(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32bit integer
    }
    return hash.toString(16)
  }

  private static cleanup(now: number): void {
    for (const [key, value] of rateLimitStore.entries()) {
      if (now >= value.resetTime) {
        rateLimitStore.delete(key)
      }
    }
  }
}

/**
 * Rate limiting configurations for different performance endpoints
 */
export const PERFORMANCE_RATE_LIMITS = {
  METRICS_SUBMISSION: {
    maxRequests: 100,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  METRICS_BATCH: {
    maxRequests: 10,
    windowMs: 60 * 60 * 1000, // 1 hour (stricter for batch)
  },
  DASHBOARD_ACCESS: {
    maxRequests: 1000,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
} as const

/**
 * Simple rate limiter function for backward compatibility
 */
export async function rateLimit(
  request: NextRequest,
  config: Partial<RateLimitConfig>
): Promise<RateLimitResult> {
  return PerformanceRateLimiter.checkLimit(request, config)
}
