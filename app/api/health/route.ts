import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createServerClient } from '@/lib/auth/server'

interface HealthCheck {
  status: 'ok' | 'error' | 'degraded'
  latency?: number
  error?: string
  warning?: string
}

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  environment: string
  version: string
  uptime: number
  checks: Record<string, HealthCheck>
  metrics: {
    dbLatencyMs: number
    authLatencyMs: number
    totalCheckTimeMs: number
  }
}

export async function GET(request: Request) {
  const startTime = Date.now()
  const url = new URL(request.url)
  
  // Quick liveness check
  if (url.searchParams.get('type') === 'liveness') {
    return NextResponse.json({ status: 'alive' }, { status: 200 })
  }
  
  const checks: Record<string, HealthCheck> = {}

  // Check database connection with timeout
  let dbLatency = 0
  try {
    const dbStart = Date.now()
    await Promise.race([
      prisma.$queryRaw`SELECT 1 as test`,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database timeout')), 5000)
      )
    ])
    dbLatency = Date.now() - dbStart
    checks.database = {
      status: 'ok',
      latency: dbLatency
    }
  } catch (error) {
    checks.database = {
      status: 'error',
      error: error instanceof Error ? error.message : 'Database connection failed',
      latency: Date.now() - startTime
    }
  }

  // Check Supabase Auth
  let authLatency = 0
  try {
    const authStart = Date.now()
    const supabase = createServerClient()
    const { error } = await Promise.race([
      supabase.auth.getSession(),
      new Promise<any>((_, reject) => 
        setTimeout(() => reject(new Error('Auth timeout')), 3000)
      )
    ])
    authLatency = Date.now() - authStart
    
    if (error) {
      checks.auth = {
        status: 'error',
        error: `Auth service error: ${error.message}`,
        latency: authLatency
      }
    } else {
      checks.auth = {
        status: 'ok',
        latency: authLatency
      }
    }
  } catch (error) {
    checks.auth = {
      status: 'error',
      error: error instanceof Error ? error.message : 'Auth service unavailable',
      latency: Date.now() - startTime
    }
  }
  
  // Check Redis (optional)
  try {
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      const { Redis } = await import('@upstash/redis')
      const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
      const redisStart = Date.now()
      await Promise.race([
        redis.ping(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Redis timeout')), 3000)
        )
      ])
      checks.redis = {
        status: 'ok',
        latency: Date.now() - redisStart
      }
    } else {
      checks.redis = {
        status: 'degraded',
        warning: 'Redis not configured (optional for caching)'
      }
    }
  } catch (error) {
    checks.redis = {
      status: 'degraded',
      warning: 'Redis unavailable (non-critical)',
      error: error instanceof Error ? error.message : 'Redis connection failed'
    }
  }

  // Check environment variables
  const requiredEnvVars = [
    'DATABASE_URL',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ]
  
  const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar])
  
  checks.environment = {
    status: missingEnvVars.length === 0 ? 'ok' : 'error',
    ...(missingEnvVars.length > 0 && {
      error: `Missing required environment variables: ${missingEnvVars.join(', ')}`
    })
  }

  // Determine overall health status
  const hasError = Object.values(checks).some(check => check.status === 'error')
  const hasDegraded = Object.values(checks).some(check => check.status === 'degraded')
  const criticalError = checks.database?.status === 'error' || checks.auth?.status === 'error'
  
  let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
  if (criticalError) {
    overallStatus = 'unhealthy'
  } else if (hasError || hasDegraded) {
    overallStatus = 'degraded'
  }

  const response: HealthStatus = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    environment: process.env.NEXT_PUBLIC_ENVIRONMENT || 'development',
    version: process.env.npm_package_version || '2.0.0',
    uptime: process.uptime(),
    checks,
    metrics: {
      dbLatencyMs: dbLatency,
      authLatencyMs: authLatency,
      totalCheckTimeMs: Date.now() - startTime
    }
  }

  // Return appropriate status code
  const statusCode = overallStatus === 'healthy' ? 200 : 
                     overallStatus === 'degraded' ? 200 : 503

  return NextResponse.json(response, {
    status: statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-Health-Status': overallStatus
    }
  })
}

// Quick readiness check for container orchestration
export async function HEAD() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return new NextResponse(null, { status: 200 })
  } catch {
    return new NextResponse(null, { status: 503 })
  }
}