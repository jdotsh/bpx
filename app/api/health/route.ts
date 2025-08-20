import { NextResponse } from 'next/server'
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

  // Check Supabase Database connection with timeout
  let dbLatency = 0
  try {
    const dbStart = Date.now()
    const supabase = createServerClient()
    
    // Test database connection with a simple query
    const { error } = await Promise.race([
      supabase.from('profiles').select('count', { count: 'exact', head: true }),
      new Promise<any>((_, reject) => 
        setTimeout(() => reject(new Error('Database timeout')), 5000)
      )
    ])
    
    dbLatency = Date.now() - dbStart
    
    if (error) {
      checks.database = {
        status: 'error',
        error: `Database error: ${error.message}`,
        latency: dbLatency
      }
    } else {
      checks.database = {
        status: 'ok',
        latency: dbLatency
      }
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

  // Check environment variables
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
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
    environment: process.env.NODE_ENV || 'development',
    version: '2.0.0',
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
    const supabase = createServerClient()
    const { error } = await supabase
      .from('profiles')
      .select('count', { count: 'exact', head: true })
    
    if (error) {
      return new NextResponse(null, { status: 503 })
    }
    return new NextResponse(null, { status: 200 })
  } catch {
    return new NextResponse(null, { status: 503 })
  }
}