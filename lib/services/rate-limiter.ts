import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Validate required environment variables
function validateRateLimiterConfig() {
  if (!process.env.REDIS_URL) {
    throw new Error('REDIS_URL environment variable is required for rate limiting')
  }
  if (!process.env.REDIS_TOKEN) {
    throw new Error('REDIS_TOKEN environment variable is required for rate limiting')
  }
}

// Initialize Redis client with validation
validateRateLimiterConfig()

const redis = new Redis({
  url: process.env.REDIS_URL!,
  token: process.env.REDIS_TOKEN!,
})

// Different rate limiters for different tiers
export const rateLimiters = {
  // Free tier: 5 AI generations per minute, 20 per day
  free: {
    perMinute: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '1 m'),
      analytics: true,
      prefix: 'ratelimit:free:minute',
    }),
    perDay: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, '24 h'),
      analytics: true,
      prefix: 'ratelimit:free:day',
    }),
  },
  
  // Pro tier: 30 per minute, 500 per day
  pro: {
    perMinute: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(30, '1 m'),
      analytics: true,
      prefix: 'ratelimit:pro:minute',
    }),
    perDay: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(500, '24 h'),
      analytics: true,
      prefix: 'ratelimit:pro:day',
    }),
  },
  
  // Enterprise: Much higher limits
  enterprise: {
    perMinute: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, '1 m'),
      analytics: true,
      prefix: 'ratelimit:enterprise:minute',
    }),
    perDay: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5000, '24 h'),
      analytics: true,
      prefix: 'ratelimit:enterprise:day',
    }),
  },
  
  // API endpoints rate limiting
  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'),
    analytics: true,
    prefix: 'ratelimit:api',
  }),
}

// Check rate limit for a user
export async function checkUserRateLimit(
  userId: string,
  plan: 'free' | 'pro' | 'enterprise' = 'free'
): Promise<{
  success: boolean
  remaining: number
  reset: Date
  message?: string
}> {
  const limiter = rateLimiters[plan]
  
  // Check per-minute limit
  const minuteCheck = await limiter.perMinute.limit(userId)
  if (!minuteCheck.success) {
    return {
      success: false,
      remaining: minuteCheck.remaining,
      reset: new Date(minuteCheck.reset),
      message: 'Too many requests. Please wait a minute before trying again.'
    }
  }
  
  // Check daily limit
  const dayCheck = await limiter.perDay.limit(userId)
  if (!dayCheck.success) {
    return {
      success: false,
      remaining: dayCheck.remaining,
      reset: new Date(dayCheck.reset),
      message: 'Daily limit reached. Please upgrade your plan for more generations.'
    }
  }
  
  return {
    success: true,
    remaining: Math.min(minuteCheck.remaining, dayCheck.remaining),
    reset: new Date(Math.min(minuteCheck.reset, dayCheck.reset))
  }
}

// Check API rate limit
export async function checkApiRateLimit(identifier: string) {
  const { success, limit, reset, remaining } = await rateLimiters.api.limit(identifier)
  
  return {
    success,
    limit,
    reset,
    remaining,
  }
}