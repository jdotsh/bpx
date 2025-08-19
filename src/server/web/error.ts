// Problem+JSON - Production Grade Error Handling
// R2: Production Tightening

import { NextResponse } from 'next/server'

// Clean problem type definition
export type Problem = {
  type: string
  title: string
  detail?: string
  instance?: string
}

// Domain-specific errors
export class ConflictError extends Error {
  constructor(message = 'Version conflict') {
    super(message)
    this.name = 'ConflictError'
  }
}

export class NotFoundError extends Error {
  constructor(message = 'Not found') {
    super(message)
    this.name = 'NotFoundError'
  }
}

export class ForbiddenError extends Error {
  constructor(message = 'Forbidden') {
    super(message)
    this.name = 'ForbiddenError'
  }
}

export class RateLimitError extends Error {
  constructor(message = 'Rate limit exceeded') {
    super(message)
    this.name = 'RateLimitError'
  }
}

/**
 * Convert errors to RFC 7807 Problem Details
 * Simplified, consistent mapping
 */
export function toProblem(error: unknown): [number, Problem] {
  if (error instanceof ConflictError) {
    return [409, {
      type: '/errors/conflict',
      title: 'Version conflict',
      detail: error.message
    }]
  }
  
  if (error instanceof NotFoundError) {
    return [404, {
      type: '/errors/not-found',
      title: 'Not found',
      detail: error.message
    }]
  }
  
  if (error instanceof ForbiddenError) {
    return [403, {
      type: '/errors/forbidden',
      title: 'Forbidden',
      detail: error.message
    }]
  }
  
  if (error instanceof RateLimitError) {
    return [429, {
      type: '/errors/rate-limit',
      title: 'Too many requests',
      detail: error.message
    }]
  }
  
  // Log unexpected server errors
  console.error('Unexpected API error:', error)
  
  return [500, {
    type: '/errors/server',
    title: 'Server error',
    detail: process.env.NODE_ENV === 'development' 
      ? String(error) 
      : 'An unexpected error occurred'
  }]
}

/**
 * Create consistent error response
 */
export function createProblemResponse(
  error: unknown, 
  requestId?: string
): NextResponse {
  const [status, problem] = toProblem(error)
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/problem+json'
  }
  
  if (requestId) {
    headers['X-Request-ID'] = requestId
  }
  
  return NextResponse.json(problem, { status, headers })
}

/**
 * Error handler wrapper for API routes
 */
export function withErrorHandler<T extends any[], R>(
  handler: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R | NextResponse> => {
    try {
      return await handler(...args)
    } catch (error) {
      return createProblemResponse(error)
    }
  }
}