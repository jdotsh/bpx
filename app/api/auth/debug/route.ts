import { NextResponse } from 'next/server'

import { createServerClient } from '@/lib/auth/server'

// Force dynamic rendering for API routes that use authentication
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Check environment variables
    const config = {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
      anonKeyStart: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + '...',
      serviceKeyStart: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20) + '...',
    }

    // Try to connect to Supabase
    const supabase = createServerClient()
    let authHealthy = false
    let authError = null

    try {
      // Try a simple auth check
      const { error } = await supabase.auth.getSession()
      if (!error) {
        authHealthy = true
      } else {
        authError = error.message
      }
    } catch (err) {
      authError = err instanceof Error ? err.message : 'Unknown error'
    }

    // Check if API keys are valid format
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    
    const validKeyFormat = (key: string) => {
      // Supabase keys are JWTs - should have 3 parts separated by dots
      return key.split('.').length === 3 && key.startsWith('eyJ')
    }

    const diagnosis = {
      environment: {
        ...config,
        validAnonKeyFormat: validKeyFormat(anonKey),
        validServiceKeyFormat: validKeyFormat(serviceKey),
      },
      auth: {
        healthy: authHealthy,
        error: authError
      },
      recommendations: [] as string[]
    }

    // Add recommendations
    if (!config.hasSupabaseUrl) {
      diagnosis.recommendations.push('Missing NEXT_PUBLIC_SUPABASE_URL')
    }
    if (!config.hasAnonKey) {
      diagnosis.recommendations.push('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY')
    }
    if (!config.hasServiceKey) {
      diagnosis.recommendations.push('Missing SUPABASE_SERVICE_ROLE_KEY')
    }
    if (config.hasAnonKey && !diagnosis.environment.validAnonKeyFormat) {
      diagnosis.recommendations.push('NEXT_PUBLIC_SUPABASE_ANON_KEY appears to be invalid format')
    }
    if (config.hasServiceKey && !diagnosis.environment.validServiceKeyFormat) {
      diagnosis.recommendations.push('SUPABASE_SERVICE_ROLE_KEY appears to be invalid format')
    }
    if (authError?.includes('Invalid API key')) {
      diagnosis.recommendations.push('API key is being rejected by Supabase - check if keys match your project')
    }

    return NextResponse.json({
      status: diagnosis.recommendations.length === 0 ? 'ok' : 'issues_found',
      diagnosis,
      message: diagnosis.recommendations.length === 0 
        ? 'Configuration looks good' 
        : 'Configuration issues found - see recommendations'
    })
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to run diagnostics'
    }, { status: 500 })
  }
}
