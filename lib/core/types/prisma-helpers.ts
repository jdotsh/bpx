/**
 * Type-safe Prisma JSON helpers
 * Ensures compatibility with Prisma's InputJsonValue type
 */

import type { Prisma } from '@prisma/client'

/**
 * Safely converts any value to Prisma InputJsonValue
 * Handles null, undefined, and complex objects
 */
export function toPrismaJson(value: any): Prisma.InputJsonValue | undefined {
  if (value === undefined) return undefined
  if (value === null) return null as any
  
  // Handle Date objects
  if (value instanceof Date) {
    return value.toISOString()
  }
  
  // Handle arrays
  if (Array.isArray(value)) {
    return value.map(item => toPrismaJson(item)) as Prisma.InputJsonValue[]
  }
  
  // Handle objects
  if (typeof value === 'object') {
    const result: Record<string, Prisma.InputJsonValue> = {}
    for (const [key, val] of Object.entries(value)) {
      const converted = toPrismaJson(val)
      if (converted !== undefined) {
        result[key] = converted
      }
    }
    return result
  }
  
  // Primitives (string, number, boolean) are valid InputJsonValue
  return value as Prisma.InputJsonValue
}

/**
 * Type guard to check if a value is a valid Prisma JsonValue
 */
export function isValidPrismaJson(value: unknown): value is Prisma.JsonValue {
  if (value === null) return true
  if (typeof value === 'string') return true
  if (typeof value === 'number') return true
  if (typeof value === 'boolean') return true
  
  if (Array.isArray(value)) {
    return value.every(item => isValidPrismaJson(item))
  }
  
  if (typeof value === 'object' && value !== null) {
    return Object.values(value).every(val => isValidPrismaJson(val))
  }
  
  return false
}

/**
 * Safely extract metadata from Prisma JsonValue
 */
export function extractMetadata<T extends Record<string, any>>(
  metadata: Prisma.JsonValue | null,
  defaultValue: T
): T {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return defaultValue
  }
  
  return metadata as T
}