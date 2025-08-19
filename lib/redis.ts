import { Redis } from '@upstash/redis'

// Validate required environment variables
function validateRedisConfig() {
  if (!process.env.REDIS_URL) {
    throw new Error('REDIS_URL environment variable is required')
  }
  if (!process.env.REDIS_TOKEN) {
    throw new Error('REDIS_TOKEN environment variable is required')
  }
}

// Initialize Redis client with validation
validateRedisConfig()

export const redis = new Redis({
  url: process.env.REDIS_URL!,
  token: process.env.REDIS_TOKEN!,
})

// Rate limiting helper
export async function checkRateLimit(
  identifier: string,
  limit: number = 10,
  window: number = 60 // seconds
): Promise<{ success: boolean; remaining: number }> {
  const key = `rate_limit:${identifier}:${Math.floor(Date.now() / 1000 / window)}`
  
  const current = await redis.incr(key)
  
  if (current === 1) {
    await redis.expire(key, window)
  }
  
  return {
    success: current <= limit,
    remaining: Math.max(0, limit - current)
  }
}

// Caching helpers
export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const data = await redis.get(key)
    return data as T
  } catch (error) {
    console.error('Redis get error:', error)
    return null
  }
}

export async function setCached<T>(
  key: string, 
  value: T, 
  ttl: number = 3600 // 1 hour default
): Promise<void> {
  try {
    await redis.set(key, value, { ex: ttl })
  } catch (error) {
    console.error('Redis set error:', error)
  }
}

// AI generation caching
export async function getCachedGeneration(prompt: string): Promise<any | null> {
  const key = `ai:generation:${hashPrompt(prompt)}`
  return getCached(key)
}

export async function setCachedGeneration(prompt: string, result: any): Promise<void> {
  const key = `ai:generation:${hashPrompt(prompt)}`
  await setCached(key, result, 3600 * 24) // Cache for 24 hours
}

// Simple hash function for prompt keys
function hashPrompt(prompt: string): string {
  let hash = 0
  for (let i = 0; i < prompt.length; i++) {
    const char = prompt.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36)
}