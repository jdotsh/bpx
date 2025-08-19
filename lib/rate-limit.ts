import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { NextRequest } from 'next/server'

// Initialize Redis client if configured
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null

// Rate limit configurations for different operations
export const rateLimiters = {
  // API rate limits
  api: {
    reads: redis ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 requests per minute
      analytics: true,
      prefix: 'ratelimit:api:reads',
    }) : null,
    
    writes: redis ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(30, '1 m'), // 30 writes per minute
      analytics: true,
      prefix: 'ratelimit:api:writes',
    }) : null,
    
    ai: redis ? new Ratelimit({
      redis,
      limiter: Ratelimit.tokenBucket(10, '1 h', 10), // 10 AI requests per hour
      analytics: true,
      prefix: 'ratelimit:api:ai',
    }) : null,
  },
  
  // Auth rate limits
  auth: {
    signin: redis ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '15 m'), // 5 attempts per 15 minutes
      analytics: true,
      prefix: 'ratelimit:auth:signin',
    }) : null,
    
    signup: redis ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(3, '1 h'), // 3 signups per hour
      analytics: true,
      prefix: 'ratelimit:auth:signup',
    }) : null,
    
    passwordReset: redis ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(3, '1 h'), // 3 reset attempts per hour
      analytics: true,
      prefix: 'ratelimit:auth:reset',
    }) : null,
  },
  
  // File operations
  files: {
    upload: redis ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, '1 h'), // 20 uploads per hour
      analytics: true,
      prefix: 'ratelimit:files:upload',
    }) : null,
    
    export: redis ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(50, '1 h'), // 50 exports per hour
      analytics: true,
      prefix: 'ratelimit:files:export',
    }) : null,
  },
  
  // Collaboration
  collaboration: {
    realtime: redis ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(1000, '1 m'), // 1000 events per minute
      analytics: true,
      prefix: 'ratelimit:collab:realtime',
    }) : null,
    
    invites: redis ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '1 h'), // 10 invites per hour
      analytics: true,
      prefix: 'ratelimit:collab:invites',
    }) : null,
  }
}

// Rate limit response
export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: Date
  retryAfter?: number
}

// Get identifier from request
export function getIdentifier(request: NextRequest): string {
  // Try to get user ID from headers (set by middleware)
  const userId = request.headers.get('x-user-id')
  if (userId) return `user:${userId}`
  
  // Fall back to IP address
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : 
             request.headers.get('x-real-ip') || 
             'unknown'
  
  return `ip:${ip}`
}

// Check rate limit
export async function checkRateLimit(
  limiter: Ratelimit | null,
  identifier: string
): Promise<RateLimitResult> {
  // If Redis not configured, allow all requests (development mode)
  if (!limiter) {
    return {
      success: true,
      limit: 999999,
      remaining: 999999,
      reset: new Date(Date.now() + 60000),
    }
  }
  
  try {
    const { success, limit, remaining, reset } = await limiter.limit(identifier)
    
    const result: RateLimitResult = {
      success,
      limit,
      remaining,
      reset: new Date(reset),
    }
    
    if (!success) {
      result.retryAfter = Math.floor((reset - Date.now()) / 1000)
    }
    
    return result
  } catch (error) {
    console.error('Rate limit check failed:', error)
    // On error, allow the request but log it
    return {
      success: true,
      limit: 999999,
      remaining: 999999,
      reset: new Date(Date.now() + 60000),
    }
  }
}

// Rate limit middleware helper
export async function withRateLimit(
  request: NextRequest,
  limiter: Ratelimit | null,
  options?: {
    identifier?: string
    errorMessage?: string
  }
): Promise<Response | null> {
  const identifier = options?.identifier || getIdentifier(request)
  const result = await checkRateLimit(limiter, identifier)
  
  if (!result.success) {
    return new Response(
      JSON.stringify({
        error: options?.errorMessage || 'Too many requests',
        retryAfter: result.retryAfter,
        reset: result.reset.toISOString(),
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': result.limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': result.reset.toISOString(),
          'Retry-After': result.retryAfter?.toString() || '60',
        },
      }
    )
  }
  
  // Return null to continue with request
  return null
}

// IP-based rate limiting for anonymous users
export async function checkIPRateLimit(
  request: NextRequest,
  limiter: Ratelimit | null
): Promise<RateLimitResult> {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : 
             request.headers.get('x-real-ip') || 
             'unknown'
  
  return checkRateLimit(limiter, `ip:${ip}`)
}

// User-based rate limiting for authenticated users
export async function checkUserRateLimit(
  userId: string,
  limiter: Ratelimit | null
): Promise<RateLimitResult> {
  return checkRateLimit(limiter, `user:${userId}`)
}

// Reset rate limit for a specific identifier (admin use)
export async function resetRateLimit(
  identifier: string,
  prefix: string
): Promise<boolean> {
  if (!redis) return false
  
  try {
    const key = `${prefix}:${identifier}`
    await redis.del(key)
    return true
  } catch (error) {
    console.error('Failed to reset rate limit:', error)
    return false
  }
}

// Get rate limit analytics
export async function getRateLimitAnalytics(
  prefix: string,
  hours = 24
): Promise<any> {
  if (!redis) return null
  
  try {
    // This would typically query your analytics data
    // Implementation depends on how you store analytics
    const data = await redis.get(`analytics:${prefix}:${hours}h`)
    return data
  } catch (error) {
    console.error('Failed to get rate limit analytics:', error)
    return null
  }
}