/**
 * Enterprise Error Handling System
 * Provides structured error management with context and observability
 */

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical'
export type ErrorCategory = 'validation' | 'authorization' | 'business' | 'system' | 'network'

export interface ErrorContext {
  operation: string
  userId?: string
  sessionId?: string
  requestId?: string
  userAgent?: string
  timestamp?: string
  metadata?: Record<string, unknown>
}

export class ApplicationError extends Error {
  public readonly code: string
  public readonly statusCode: number
  public readonly severity: ErrorSeverity
  public readonly category: ErrorCategory
  public readonly context: ErrorContext
  public readonly timestamp: string
  public readonly isOperational: boolean
  public readonly cause?: Error

  constructor(
    message: string,
    code: string,
    options: {
      statusCode?: number
      severity?: ErrorSeverity
      category?: ErrorCategory
      context?: ErrorContext
      isOperational?: boolean
      cause?: Error
    } = {}
  ) {
    super(message)
    
    this.name = 'ApplicationError'
    this.code = code
    this.statusCode = options.statusCode ?? 500
    this.severity = options.severity ?? 'medium'
    this.category = options.category ?? 'system'
    this.context = options.context ?? { operation: 'unknown' }
    this.timestamp = new Date().toISOString()
    this.isOperational = options.isOperational ?? true
    
    if (options.cause) {
      this.cause = options.cause
    }
    
    // Ensure proper prototype chain
    Object.setPrototypeOf(this, ApplicationError.prototype)
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      severity: this.severity,
      category: this.category,
      context: this.context,
      timestamp: this.timestamp,
      isOperational: this.isOperational,
      stack: this.stack
    }
  }
}

// Specialized Error Types
export class ValidationError extends ApplicationError {
  constructor(message: string, field?: string, value?: unknown, context?: ErrorContext) {
    super(message, 'VALIDATION_ERROR', {
      statusCode: 400,
      severity: 'medium',
      category: 'validation',
      context: {
        ...context,
        operation: context?.operation || 'validation',
        metadata: {
          ...context?.metadata,
          field,
          value: typeof value === 'object' ? JSON.stringify(value) : value
        }
      }
    })
  }
}

export class AuthorizationError extends ApplicationError {
  constructor(message: string, requiredPermission?: string, context?: ErrorContext) {
    super(message, 'AUTHORIZATION_ERROR', {
      statusCode: 403,
      severity: 'high',
      category: 'authorization',
      context: {
        ...context,
        operation: context?.operation || 'authorization',
        metadata: {
          ...context?.metadata,
          requiredPermission
        }
      }
    })
  }
}

export class BusinessLogicError extends ApplicationError {
  constructor(message: string, code: string, context?: ErrorContext) {
    super(message, code, {
      statusCode: 422,
      severity: 'medium',
      category: 'business',
      context
    })
  }
}

export class SystemError extends ApplicationError {
  constructor(message: string, code: string, cause?: Error, context?: ErrorContext) {
    super(message, code, {
      statusCode: 500,
      severity: 'critical',
      category: 'system',
      context,
      cause
    })
  }
}

export class NetworkError extends ApplicationError {
  constructor(message: string, url?: string, statusCode?: number, context?: ErrorContext) {
    super(message, 'NETWORK_ERROR', {
      statusCode: statusCode ?? 503,
      severity: 'high',
      category: 'network',
      context: {
        ...context,
        operation: context?.operation || 'network',
        metadata: {
          ...context?.metadata,
          url
        }
      }
    })
  }
}