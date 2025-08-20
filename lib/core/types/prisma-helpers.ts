/**
 * Type-safe JSON helpers (Prisma removed)
 * Ensures compatibility with JSON types
 */

/**
 * Safely converts any value to JSON-compatible value
 * Handles null, undefined, and complex objects
 */
export function toPrismaJson(value: any): any {
  if (value === undefined) return undefined
  if (value === null) return null
  
  // Handle Date objects
  if (value instanceof Date) {
    return value.toISOString()
  }
  
  // Handle arrays
  if (Array.isArray(value)) {
    return value.map(item => toPrismaJson(item))
  }
  
  // Handle objects
  if (typeof value === 'object') {
    const result: Record<string, any> = {}
    for (const [key, val] of Object.entries(value)) {
      const converted = toPrismaJson(val)
      if (converted !== undefined) {
        result[key] = converted
      }
    }
    return result
  }
  
  // Primitives (string, number, boolean) are valid
  return value
}

/**
 * Type guard to check if a value is valid JSON
 */
export function isValidPrismaJson(value: unknown): boolean {
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
 * Safely extract metadata from JSON value
 */
export function extractMetadata<T extends Record<string, any>>(
  metadata: any,
  defaultValue: T
): T {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return defaultValue
  }
  
  return metadata as T
}