/**
 * Security Middleware and Vulnerability Prevention
 * OWASP Top 10 protection and security best practices
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import crypto from 'crypto'

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 60

// Store for rate limiting (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

/**
 * Rate limiting middleware
 */
export function rateLimit(identifier: string, maxRequests = RATE_LIMIT_MAX_REQUESTS) {
  const now = Date.now()
  const record = rateLimitStore.get(identifier)

  if (!record || now > record.resetTime) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    })
    return { allowed: true, remaining: maxRequests - 1 }
  }

  if (record.count >= maxRequests) {
    return { 
      allowed: false, 
      remaining: 0,
      resetTime: record.resetTime 
    }
  }

  record.count++
  return { 
    allowed: true, 
    remaining: maxRequests - record.count 
  }
}

/**
 * Input sanitization for XSS prevention
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .trim()
}

/**
 * BPMN XML validation and sanitization
 */
const BpmnXmlSchema = z.string()
  .min(50, 'BPMN XML too short')
  .max(10_000_000, 'BPMN XML too large (10MB limit)')
  .refine(
    (xml) => !/<script|javascript:|on\w+=/i.test(xml),
    'Potential XSS detected in BPMN XML'
  )
  .refine(
    (xml) => xml.includes('bpmn:definitions'),
    'Invalid BPMN XML structure'
  )

export function validateBpmnXml(xml: string): { valid: boolean; error?: string } {
  try {
    BpmnXmlSchema.parse(xml)
    return { valid: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, error: error.issues[0]?.message }
    }
    return { valid: false, error: 'Invalid BPMN XML' }
  }
}

/**
 * SQL injection prevention (additional layer on top of Prisma)
 */
export function sanitizeSqlInput(input: string): string {
  return input
    .replace(/['";\\]/g, '') // Remove quotes and escape characters
    .replace(/--/g, '') // Remove SQL comments
    .replace(/\/\*/g, '') // Remove multi-line comments
    .replace(/\*\//g, '')
    .replace(/\b(DROP|DELETE|INSERT|UPDATE|ALTER|CREATE|EXEC|EXECUTE)\b/gi, '') // Remove SQL keywords
}

/**
 * CSRF token generation and validation
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

export function validateCsrfToken(token: string, sessionToken: string): boolean {
  if (!token || !sessionToken) return false
  return crypto.timingSafeEqual(
    Buffer.from(token),
    Buffer.from(sessionToken)
  )
}

/**
 * Content Security Policy headers
 */
export function getSecurityHeaders(): Record<string, string> {
  return {
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.stripe.com",
      "frame-src 'self' https://js.stripe.com",
      "worker-src 'self' blob:",
      "media-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests"
    ].join('; '),
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
  }
}

/**
 * File upload validation
 */
export function validateFileUpload(
  file: File,
  options: {
    maxSize?: number
    allowedTypes?: string[]
    allowedExtensions?: string[]
  } = {}
): { valid: boolean; error?: string } {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = ['text/xml', 'application/xml', 'application/json', 'text/yaml'],
    allowedExtensions = ['.bpmn', '.xml', '.json', '.yaml', '.yml']
  } = options

  // Check file size
  if (file.size > maxSize) {
    return { 
      valid: false, 
      error: `File too large. Maximum size: ${maxSize / 1024 / 1024}MB` 
    }
  }

  // Check MIME type
  if (!allowedTypes.includes(file.type)) {
    return { 
      valid: false, 
      error: `Invalid file type. Allowed: ${allowedTypes.join(', ')}` 
    }
  }

  // Check file extension
  const extension = '.' + file.name.split('.').pop()?.toLowerCase()
  if (!allowedExtensions.includes(extension)) {
    return { 
      valid: false, 
      error: `Invalid file extension. Allowed: ${allowedExtensions.join(', ')}` 
    }
  }

  return { valid: true }
}

/**
 * Password strength validation
 */
export function validatePasswordStrength(password: string): {
  valid: boolean
  score: number
  suggestions: string[]
} {
  const suggestions: string[] = []
  let score = 0

  if (password.length >= 8) score++
  else suggestions.push('Use at least 8 characters')

  if (password.length >= 12) score++
  
  if (/[a-z]/.test(password)) score++
  else suggestions.push('Include lowercase letters')

  if (/[A-Z]/.test(password)) score++
  else suggestions.push('Include uppercase letters')

  if (/\d/.test(password)) score++
  else suggestions.push('Include numbers')

  if (/[^a-zA-Z0-9]/.test(password)) score++
  else suggestions.push('Include special characters')

  // Check for common patterns
  if (/^[a-zA-Z]+$/.test(password) || /^\d+$/.test(password)) {
    score = Math.max(0, score - 2)
    suggestions.push('Avoid using only letters or only numbers')
  }

  // Check for sequential characters
  if (/abc|123|qwerty/i.test(password)) {
    score = Math.max(0, score - 1)
    suggestions.push('Avoid sequential characters')
  }

  return {
    valid: score >= 4,
    score: Math.min(5, score),
    suggestions
  }
}

/**
 * JWT token validation
 */
export function validateJwtToken(token: string): boolean {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return false

    // Basic structure validation
    const [header, payload] = parts.slice(0, 2).map(part => {
      try {
        return JSON.parse(Buffer.from(part, 'base64').toString())
      } catch {
        return null
      }
    })

    if (!header || !payload) return false
    if (!header.alg || !header.typ) return false
    if (!payload.exp || !payload.iat) return false

    // Check expiration
    const now = Math.floor(Date.now() / 1000)
    if (payload.exp < now) return false

    return true
  } catch {
    return false
  }
}

/**
 * API request validation middleware
 */
export async function validateApiRequest(
  request: NextRequest,
  options: {
    requireAuth?: boolean
    rateLimit?: boolean
    csrfProtection?: boolean
  } = {}
): Promise<{ valid: boolean; error?: string; response?: NextResponse }> {
  const {
    requireAuth = true,
    rateLimit: enableRateLimit = true,
    csrfProtection = false
  } = options

  // Rate limiting
  if (enableRateLimit) {
    const identifier = request.ip || request.headers.get('x-forwarded-for') || 'anonymous'
    const rateLimitResult = rateLimit(identifier)
    
    if (!rateLimitResult.allowed) {
      return {
        valid: false,
        error: 'Rate limit exceeded',
        response: NextResponse.json(
          { error: 'Too many requests' },
          { 
            status: 429,
            headers: {
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': new Date(rateLimitResult.resetTime!).toISOString()
            }
          }
        )
      }
    }
  }

  // CSRF protection for state-changing methods
  if (csrfProtection && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
    const csrfToken = request.headers.get('x-csrf-token')
    const sessionToken = request.cookies.get('csrf-token')?.value

    if (!csrfToken || !sessionToken || !validateCsrfToken(csrfToken, sessionToken)) {
      return {
        valid: false,
        error: 'Invalid CSRF token',
        response: NextResponse.json(
          { error: 'Invalid CSRF token' },
          { status: 403 }
        )
      }
    }
  }

  // Authentication check
  if (requireAuth) {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        valid: false,
        error: 'Missing authentication',
        response: NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }
    }

    const token = authHeader.substring(7)
    if (!validateJwtToken(token)) {
      return {
        valid: false,
        error: 'Invalid authentication token',
        response: NextResponse.json(
          { error: 'Invalid or expired token' },
          { status: 401 }
        )
      }
    }
  }

  return { valid: true }
}