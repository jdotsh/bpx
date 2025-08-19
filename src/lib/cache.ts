// Redis Read-Through Cache with Clean Invalidation
// R2: Production Tightening

import { Redis } from '@upstash/redis'

// Redis client with graceful fallback
export const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({ 
      url: process.env.UPSTASH_REDIS_REST_URL, 
      token: process.env.UPSTASH_REDIS_REST_TOKEN 
    })
  : null

/**
 * Get cached value with type safety
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!redis) return null
  
  try {
    const result = await redis.get<T>(key)
    return result ?? null
  } catch (error) {
    console.error('Cache get failed:', key, error)
    return null // Fail gracefully
  }
}

/**
 * Set cached value with TTL
 */
export async function cacheSet<T>(
  key: string, 
  value: T, 
  ttlSec: number = 60
): Promise<void> {
  if (!redis) return
  
  try {
    await redis.set(key, value, { ex: ttlSec })
  } catch (error) {
    console.error('Cache set failed:', key, error)
    // Don't throw - caching failures shouldn't break requests
  }
}

/**
 * Delete cached value
 */
export async function cacheDel(key: string): Promise<void> {
  if (!redis) return
  
  try {
    await redis.del(key)
  } catch (error) {
    console.error('Cache delete failed:', key, error)
  }
}

/**
 * Delete multiple cache keys (pattern-based invalidation)
 */
export async function cacheDelPattern(pattern: string): Promise<void> {
  if (!redis) return
  
  try {
    // Get keys matching pattern
    const keys = await redis.keys(pattern)
    if (keys.length > 0) {
      await redis.del(...keys)
    }
  } catch (error) {
    console.error('Cache pattern delete failed:', pattern, error)
  }
}

/**
 * Cache key generators for consistent naming
 */
export const cacheKeys = {
  // Diagram summaries
  diagramSummary: (id: string) => `summary:diagram:${id}`,
  diagramsList: (projectId?: string, query?: string) => 
    `list:diagrams:${projectId || 'all'}:${query || 'none'}`,
  
  // Project summaries  
  projectSummary: (id: string) => `summary:project:${id}`,
  projectsList: (userId: string, query?: string) => 
    `list:projects:${userId}:${query || 'none'}`,
  
  // User-specific caches
  userProjects: (userId: string) => `user:${userId}:projects`,
  userDiagrams: (userId: string) => `user:${userId}:diagrams`,
} as const

/**
 * Invalidate related caches when diagram changes
 */
export async function invalidateDiagramCaches(
  diagramId: string, 
  projectId: string, 
  userId: string
): Promise<void> {
  const keysToDelete = [
    cacheKeys.diagramSummary(diagramId),
    cacheKeys.userDiagrams(userId),
    cacheKeys.diagramsList(projectId),
    cacheKeys.diagramsList(), // All diagrams list
  ]
  
  await Promise.all(keysToDelete.map(key => cacheDel(key)))
}

/**
 * Invalidate related caches when project changes
 */
export async function invalidateProjectCaches(
  projectId: string, 
  userId: string
): Promise<void> {
  const keysToDelete = [
    cacheKeys.projectSummary(projectId),
    cacheKeys.userProjects(userId),
    cacheKeys.projectsList(userId),
  ]
  
  // Also invalidate all diagrams in this project
  await cacheDelPattern(`list:diagrams:${projectId}:*`)
  
  await Promise.all(keysToDelete.map(key => cacheDel(key)))
}