// ETag Helper with Weak Tag Support
// R2: Production Tightening

import { createHash } from 'crypto'

/**
 * Generate ETag from payload with optional weak flag
 * Uses SHA-1 for speed (this is for caching, not security)
 */
export const makeETag = (payload: unknown, weak: boolean = false): string => {
  const content = typeof payload === 'string' 
    ? payload 
    : JSON.stringify(payload)
    
  const hash = createHash('sha1')
    .update(content, 'utf8')
    .digest('hex')
    
  return `${weak ? 'W/' : ''}"${hash}"`
}

/**
 * Check if client has current version (304 Not Modified)
 */
export const notModified = (req: Request, etag: string): boolean => {
  const ifNoneMatch = req.headers.get('if-none-match')
  return ifNoneMatch === etag
}

/**
 * Alias for notModified
 */
export const isNotModified = notModified

/**
 * Generate version-based ETag
 */
export const makeVersionETag = (version: number, weak: boolean = true): string => {
  return makeETag(`v${version}`, weak)
}

/**
 * Handle conditional GET with ETag
 */
export function handleConditionalGet(req: Request, etag: string): boolean {
  return notModified(req, etag)
}

/**
 * Create 304 Not Modified response
 */
export function createNotModifiedResponse(): Response {
  return new Response(null, { status: 304 })
}

/**
 * Create response with ETag header
 */
export function createETagResponse(data: any, etag: string, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'ETag': etag
    }
  })
}