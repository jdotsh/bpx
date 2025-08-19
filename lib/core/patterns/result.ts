/**
 * Result Pattern Implementation
 * Provides type-safe error handling without exceptions
 */

import { ApplicationError } from '../errors/application-error'

export type Result<T, E extends ApplicationError = ApplicationError> = 
  | { success: true; data: T; error?: never }
  | { success: false; error: E; data?: never }

/**
 * Result utility functions for cleaner error handling
 */
export class ResultUtils {
  /**
   * Create a successful result
   */
  static ok<T>(data: T): Result<T> {
    return { success: true, data }
  }

  /**
   * Create an error result
   */
  static error<E extends ApplicationError>(error: E): Result<never, E> {
    return { success: false, error }
  }

  /**
   * Wrap a function that might throw
   */
  static wrap<T, Args extends any[]>(
    fn: (...args: Args) => T,
    context?: string
  ) {
    return (...args: Args): Result<T> => {
      try {
        const data = fn(...args)
        return ResultUtils.ok(data)
      } catch (error) {
        const appError = error instanceof ApplicationError 
          ? error 
          : new ApplicationError(
              error instanceof Error ? error.message : String(error),
              'WRAPPED_FUNCTION_ERROR',
              { context: { operation: context || 'wrapped_function' } }
            )
        return ResultUtils.error(appError)
      }
    }
  }

  /**
   * Wrap an async function that might throw
   */
  static wrapAsync<T, Args extends any[]>(
    fn: (...args: Args) => Promise<T>,
    context?: string
  ) {
    return async (...args: Args): Promise<Result<T>> => {
      try {
        const data = await fn(...args)
        return ResultUtils.ok(data)
      } catch (error) {
        const appError = error instanceof ApplicationError 
          ? error 
          : new ApplicationError(
              error instanceof Error ? error.message : String(error),
              'WRAPPED_ASYNC_FUNCTION_ERROR',
              { context: { operation: context || 'wrapped_async_function' } }
            )
        return ResultUtils.error(appError)
      }
    }
  }

  /**
   * Chain operations on successful results
   */
  static map<T, U>(
    result: Result<T>,
    mapper: (data: T) => U
  ): Result<U> {
    if (!result.success) {
      return result
    }
    
    try {
      return ResultUtils.ok(mapper(result.data))
    } catch (error) {
      const appError = error instanceof ApplicationError 
        ? error 
        : new ApplicationError(
            error instanceof Error ? error.message : String(error),
            'MAP_OPERATION_ERROR'
          )
      return ResultUtils.error(appError)
    }
  }

  /**
   * Chain async operations on successful results
   */
  static async mapAsync<T, U>(
    result: Result<T>,
    mapper: (data: T) => Promise<U>
  ): Promise<Result<U>> {
    if (!result.success) {
      return result
    }
    
    try {
      const data = await mapper(result.data)
      return ResultUtils.ok(data)
    } catch (error) {
      const appError = error instanceof ApplicationError 
        ? error 
        : new ApplicationError(
            error instanceof Error ? error.message : String(error),
            'MAP_ASYNC_OPERATION_ERROR'
          )
      return ResultUtils.error(appError)
    }
  }

  /**
   * Chain operations that return Results
   */
  static flatMap<T, U>(
    result: Result<T>,
    mapper: (data: T) => Result<U>
  ): Result<U> {
    if (!result.success) {
      return result
    }
    
    try {
      return mapper(result.data)
    } catch (error) {
      const appError = error instanceof ApplicationError 
        ? error 
        : new ApplicationError(
            error instanceof Error ? error.message : String(error),
            'FLAT_MAP_OPERATION_ERROR'
          )
      return ResultUtils.error(appError)
    }
  }

  /**
   * Combine multiple results - all must succeed
   */
  static combine<T extends readonly unknown[]>(
    ...results: { [K in keyof T]: Result<T[K]> }
  ): Result<T> {
    const data = [] as any
    
    for (const result of results) {
      if (!result.success) {
        return result
      }
      data.push(result.data)
    }
    
    return ResultUtils.ok(data as T)
  }

  /**
   * Execute a function on error
   */
  static onError<T>(
    result: Result<T>,
    handler: (error: ApplicationError) => void
  ): Result<T> {
    if (!result.success) {
      handler(result.error)
    }
    return result
  }

  /**
   * Provide a default value on error
   */
  static withDefault<T>(
    result: Result<T>,
    defaultValue: T
  ): T {
    return result.success ? result.data : defaultValue
  }

  /**
   * Unwrap result or throw the error
   */
  static unwrap<T>(result: Result<T>): T {
    if (!result.success) {
      throw result.error
    }
    return result.data
  }

  /**
   * Check if result is successful
   */
  static isOk<T>(result: Result<T>): result is { success: true; data: T } {
    return result.success
  }

  /**
   * Check if result is an error
   */
  static isError<T>(result: Result<T>): result is { success: false; error: ApplicationError } {
    return !result.success
  }
}

// Convenience aliases
export const Ok = ResultUtils.ok
export const Err = ResultUtils.error
export const { wrap, wrapAsync, map, mapAsync, flatMap, combine, onError, withDefault, unwrap, isOk, isError } = ResultUtils