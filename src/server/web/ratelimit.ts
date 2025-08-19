// Route-Aware Rate Limiting - Production Grade
// R2: Production Tightening

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Redis client (fail gracefully if not configured)
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({ 
      url: process.env.UPSTASH_REDIS_REST_URL, 
      token: process.env.UPSTASH_REDIS_REST_TOKEN 
    })
  : null

// Bucket-specific limiters
const defaultLimiter = redis && new Ratelimit({ 
  redis, 
  limiter: Ratelimit.slidingWindow(100, '1 m') 
})

const writeLimiter = redis && new Ratelimit({ 
  redis, 
  limiter: Ratelimit.slidingWindow(30, '1 m') 
})

const aiLimiter = redis && new Ratelimit({ 
  redis, 
  limiter: Ratelimit.slidingWindow(10, '1 m') 
})

/**
 * Route-aware rate limiting with user + IP + route bucket
 */
export async function guard(
  req: Request, 
  userId: string | null, 
  bucket: 'read' | 'write' | 'ai' = 'read'
): Promise<boolean> {
  if (!redis) return true // Fail open if Redis unavailable
  
  // Extract IP for multi-dimensional limiting
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0] || '0.0.0.0'
  
  // Create compound key: bucket:user:ip
  const key = `${bucket}:${userId ?? 'anon'}:${ip}`
  
  // Select appropriate limiter
  const limiter = bucket === 'write' 
    ? writeLimiter 
    : bucket === 'ai' 
    ? aiLimiter 
    : defaultLimiter
  
  if (!limiter) return true
  
  try {
    const result = await limiter.limit(key)
    return result.success
  } catch (error) {
    console.error('Rate limiting failed:', error)
    return true // Fail open
  }
}

/**
 * Apply rate limit check (alias for guard)
 */
export const applyRateLimit = guard

/**
 * Add rate limit headers to response
 */
export function addRateLimitHeaders(headers: Headers, remaining?: number): void {
  if (remaining !== undefined) {
    headers.set('X-RateLimit-Remaining', remaining.toString())
  }
}