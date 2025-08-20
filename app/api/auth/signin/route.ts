import { NextRequest, NextResponse } from 'next/server'

import { createServerClient } from '@/lib/auth/server'

// Force dynamic rendering for API routes that use authentication
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Check if running locally without Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!supabaseUrl || supabaseUrl.includes('localhost:54321')) {
      // Check if local Supabase is running
      try {
        const response = await fetch(`${supabaseUrl}/auth/v1/health`).catch(() => null)
        if (!response || !response.ok) {
          // Return mock response for local testing
          return NextResponse.json({
            user: {
              id: `local-user-${Date.now()}`,
              email,
              name: email.split('@')[0],
              created_at: new Date().toISOString()
            },
            session: {
              access_token: `local-token-${Date.now()}`,
              refresh_token: `local-refresh-${Date.now()}`,
              expires_at: Date.now() + 3600000
            },
            message: 'Signed in locally (test mode - Supabase not running)'
          }, { status: 200 })
        }
      } catch (err) {
        // Local Supabase not running, use mock
        return NextResponse.json({
          user: {
            id: `local-user-${Date.now()}`,
            email,
            name: email.split('@')[0],
            created_at: new Date().toISOString()
          },
          session: {
            access_token: `local-token-${Date.now()}`,
            refresh_token: `local-refresh-${Date.now()}`,
            expires_at: Date.now() + 3600000
          },
          message: 'Signed in locally (test mode - Supabase not running)'
        }, { status: 200 })
      }
    }

    // Create Supabase client
    const supabase = createServerClient()

    // Sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      // Handle specific errors with user-friendly messages
      if (error.message.includes('Invalid login credentials')) {
        return NextResponse.json(
          { 
            error: 'Invalid email or password',
            message: 'The email or password you entered is incorrect. Please try again.'
          },
          { status: 401 }
        )
      }

      if (error.message.includes('Email not confirmed')) {
        return NextResponse.json(
          { 
            error: 'Email not verified',
            message: 'Please check your email and verify your account before signing in.',
            requiresEmailVerification: true
          },
          { status: 403 }
        )
      }

      if (error.message.includes('fetch failed') || error.message.includes('ENOTFOUND')) {
        return NextResponse.json(
          { 
            error: 'Connection error',
            message: 'Unable to connect to authentication service. Please check your internet connection or try again later.'
          },
          { status: 503 }
        )
      }

      return NextResponse.json(
        { 
          error: 'Sign in failed',
          message: error.message || 'An error occurred while signing in. Please try again.'
        },
        { status: 400 }
      )
    }

    if (!data.user || !data.session) {
      return NextResponse.json(
        { error: 'Failed to authenticate' },
        { status: 401 }
      )
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single()

    // Create response with session cookie
    const response = NextResponse.json({
      user: {
        id: data.user.id,
        email: data.user.email,
        name: profile?.name || data.user.user_metadata?.full_name,
        avatar_url: profile?.avatar_url,
        created_at: data.user.created_at,
      },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
      },
      message: 'Signed in successfully',
    }, { status: 200 })

    // Set auth cookies for server-side auth
    response.cookies.set({
      name: 'sb-access-token',
      value: data.session.access_token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    response.cookies.set({
      name: 'sb-refresh-token',
      value: data.session.refresh_token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    })

    return response

  } catch (error) {
    console.error('Signin error:', error)
    
    // Check for network/connection errors
    if (error instanceof Error) {
      if (error.message.includes('fetch failed') || error.message.includes('ENOTFOUND')) {
        return NextResponse.json(
          { 
            error: 'Connection error',
            message: 'Cannot connect to authentication service. If testing locally, make sure Supabase is running or use mock authentication.'
          },
          { status: 503 }
        )
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Sign in failed',
        message: 'An unexpected error occurred. Please try again.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
