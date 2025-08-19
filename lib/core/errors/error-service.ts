/**
 * Centralized Error Service
 * Handles error normalization, logging, and notification
 */

import { ApplicationError, ErrorContext, ErrorSeverity } from './application-error'

export interface ErrorMetrics {
  errorCount: number
  errorRate: number
  lastError?: ApplicationError
  errorsByCategory: Record<string, number>
  errorsBySeverity: Record<ErrorSeverity, number>
}

export interface ErrorServiceConfig {
  enableConsoleLogging: boolean
  enableMetrics: boolean
  enableNotifications: boolean
  maxErrorHistory: number
  logLevel: 'debug' | 'info' | 'warn' | 'error'
}

class ErrorServiceImplementation {
  private config: ErrorServiceConfig = {
    enableConsoleLogging: true,
    enableMetrics: true,
    enableNotifications: false,
    maxErrorHistory: 100,
    logLevel: 'error'
  }

  private errorHistory: ApplicationError[] = []
  private metrics: ErrorMetrics = {
    errorCount: 0,
    errorRate: 0,
    errorsByCategory: {},
    errorsBySeverity: {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    }
  }

  configure(config: Partial<ErrorServiceConfig>) {
    this.config = { ...this.config, ...config }
  }

  /**
   * Main error handling entry point
   */
  handle(error: unknown, context?: Partial<ErrorContext>): ApplicationError {
    const normalizedError = this.normalize(error, context)
    
    this.recordError(normalizedError)
    this.logError(normalizedError)
    this.updateMetrics(normalizedError)
    
    if (this.shouldNotify(normalizedError)) {
      this.notify(normalizedError)
    }
    
    return normalizedError
  }

  /**
   * Normalize any error into ApplicationError
   */
  private normalize(error: unknown, context?: Partial<ErrorContext>): ApplicationError {
    if (error instanceof ApplicationError) {
      return error
    }

    if (error instanceof Error) {
      return new ApplicationError(
        error.message,
        'UNKNOWN_ERROR',
        {
          cause: error,
          context: context ? { operation: 'unknown', ...context } : { operation: 'unknown' }
        }
      )
    }

    // Handle string errors
    if (typeof error === 'string') {
      return new ApplicationError(
        error,
        'STRING_ERROR',
        {
          context: context ? { operation: 'unknown', ...context } : { operation: 'unknown' }
        }
      )
    }

    // Handle unknown error types
    return new ApplicationError(
      'An unknown error occurred',
      'UNKNOWN_ERROR',
      {
        context: {
          operation: 'unknown',
          ...context,
          metadata: {
            ...context?.metadata,
            originalError: JSON.stringify(error)
          }
        }
      }
    )
  }

  /**
   * Record error in history for analysis
   */
  private recordError(error: ApplicationError) {
    if (!this.config.enableMetrics) return

    this.errorHistory.unshift(error)
    
    // Maintain history size limit
    if (this.errorHistory.length > this.config.maxErrorHistory) {
      this.errorHistory = this.errorHistory.slice(0, this.config.maxErrorHistory)
    }
  }

  /**
   * Log error based on configuration
   */
  private logError(error: ApplicationError) {
    if (!this.config.enableConsoleLogging) return

    const logData = {
      message: error.message,
      code: error.code,
      severity: error.severity,
      category: error.category,
      context: error.context,
      stack: error.stack
    }

    switch (error.severity) {
      case 'critical':
      case 'high':
        console.error('🚨 [ERROR]', logData)
        break
      case 'medium':
        if (this.config.logLevel === 'warn' || this.config.logLevel === 'info' || this.config.logLevel === 'debug') {
          console.warn('⚠️  [WARN]', logData)
        }
        break
      case 'low':
        if (this.config.logLevel === 'info' || this.config.logLevel === 'debug') {
          console.info('ℹ️  [INFO]', logData)
        }
        break
    }
  }

  /**
   * Update error metrics
   */
  private updateMetrics(error: ApplicationError) {
    if (!this.config.enableMetrics) return

    this.metrics.errorCount++
    this.metrics.lastError = error
    
    // Update category counts
    this.metrics.errorsByCategory[error.category] = 
      (this.metrics.errorsByCategory[error.category] || 0) + 1
    
    // Update severity counts
    this.metrics.errorsBySeverity[error.severity]++
    
    // Calculate error rate (errors per minute over last 10 minutes)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000)
    const recentErrors = this.errorHistory.filter(
      err => new Date(err.timestamp) > tenMinutesAgo
    )
    this.metrics.errorRate = recentErrors.length / 10 // errors per minute
  }

  /**
   * Determine if error should trigger notifications
   */
  private shouldNotify(error: ApplicationError): boolean {
    if (!this.config.enableNotifications) return false
    
    // Notify on critical errors or high frequency
    return error.severity === 'critical' || 
           (error.severity === 'high' && this.metrics.errorRate > 5)
  }

  /**
   * Send error notifications
   */
  private notify(error: ApplicationError) {
    // In a real implementation, this would integrate with:
    // - Slack/Discord webhooks
    // - Email services
    // - Error tracking services (Sentry, Bugsnag)
    // - Monitoring systems (DataDog, New Relic)
    
    console.error('📢 [NOTIFICATION] Critical error occurred:', {
      code: error.code,
      message: error.message,
      context: error.context
    })
  }

  /**
   * Get current error metrics
   */
  getMetrics(): ErrorMetrics {
    return { ...this.metrics }
  }

  /**
   * Get error history
   */
  getHistory(): ApplicationError[] {
    return [...this.errorHistory]
  }

  /**
   * Clear error history and reset metrics
   */
  reset() {
    this.errorHistory = []
    this.metrics = {
      errorCount: 0,
      errorRate: 0,
      errorsByCategory: {},
      errorsBySeverity: {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0
      }
    }
  }
}

// Singleton instance
export const ErrorService = new ErrorServiceImplementation()

// Helper functions for common patterns
export const handleAsync = async <T>(
  promise: Promise<T>,
  context?: Partial<ErrorContext>
): Promise<[ApplicationError | null, T | null]> => {
  try {
    const result = await promise
    return [null, result]
  } catch (error) {
    return [ErrorService.handle(error, context), null]
  }
}

export const handleSync = <T>(
  fn: () => T,
  context?: Partial<ErrorContext>
): [ApplicationError | null, T | null] => {
  try {
    const result = fn()
    return [null, result]
  } catch (error) {
    return [ErrorService.handle(error, context), null]
  }
}