// Input Boundary - Consistent Zod Parsing
// R2: Production Tightening

import { ZodSchema, ZodError } from 'zod'

export type ParseResult<T> = 
  | { ok: true; data: T }
  | { ok: false; status: number; body: { type: string; title: string; detail: string; issues?: any } }

/**
 * Universal JSON parser with Zod validation
 * Returns typed result with consistent error format
 */
export async function parseJson<T>(
  req: Request, 
  schema: ZodSchema<T>
): Promise<ParseResult<T>> {
  try {
    const body = await req.json()
    const result = schema.safeParse(body)
    
    if (!result.success) {
      const issues = result.error.flatten()
      return {
        ok: false,
        status: 400,
        body: {
          type: '/errors/validation',
          title: 'Validation Error',
          detail: formatValidationErrors(result.error),
          issues: {
            fieldErrors: issues.fieldErrors,
            formErrors: issues.formErrors
          }
        }
      }
    }
    
    return { ok: true, data: result.data }
  } catch (error) {
    // Invalid JSON
    return {
      ok: false,
      status: 400,
      body: {
        type: '/errors/parse',
        title: 'Parse Error',
        detail: 'Invalid JSON in request body'
      }
    }
  }
}

/**
 * Parse query parameters with Zod validation
 */
export function parseQuery<T>(
  searchParams: URLSearchParams,
  schema: ZodSchema<T>
): ParseResult<T> {
  const query = Object.fromEntries(searchParams)
  const result = schema.safeParse(query)
  
  if (!result.success) {
    const issues = result.error.flatten()
    return {
      ok: false,
      status: 400,
      body: {
        type: '/errors/validation',
        title: 'Query Validation Error',
        detail: formatValidationErrors(result.error),
        issues: {
          fieldErrors: issues.fieldErrors,
          formErrors: issues.formErrors
        }
      }
    }
  }
  
  return { ok: true, data: result.data }
}

/**
 * Format Zod errors into human-readable messages
 */
function formatValidationErrors(error: ZodError): string {
  const messages = error.issues.map(err => {
    const path = err.path.length > 0 ? `${err.path.join('.')}: ` : ''
    return `${path}${err.message}`
  })
  
  return messages.join(', ')
}