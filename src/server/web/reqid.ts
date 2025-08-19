// Request ID Generation and Logging
// R2: Production Tightening

/**
 * Generate unique request ID for tracing
 * Format: random + timestamp for uniqueness and sortability
 */
export function reqIdHeader(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

/**
 * Extract or generate request ID from headers
 */
export function getRequestId(req: Request): string {
  return req.headers.get('x-request-id') ?? reqIdHeader()
}

/**
 * Enhanced logging with request ID context
 */
export function logError(requestId: string, operation: string, error: unknown): void {
  console.error(`[api][${requestId}][${operation}]`, {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    timestamp: new Date().toISOString(),
  })
}

/**
 * Log API request for monitoring
 */
export function logRequest(
  requestId: string, 
  method: string, 
  url: string, 
  userId?: string
): void {
  console.log(`[api][${requestId}] ${method} ${url}`, {
    userId,
    timestamp: new Date().toISOString(),
  })
}