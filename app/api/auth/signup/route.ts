import { NextRequest, NextResponse } from 'next/server'

import { createServerClient } from '@/lib/auth/server'
import { createUserProfile } from '@/lib/auth/server'

// Force dynamic rendering for API routes that use authentication
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name } = body

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
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
              name: name || email.split('@')[0],
              created_at: new Date().toISOString()
            },
            message: 'Account created locally (test mode - Supabase not running). No email verification needed.',
            requiresEmailVerification: false,
            canSignInImmediately: true
          }, { status: 201 })
        }
      } catch (err) {
        // Local Supabase not running, use mock
        return NextResponse.json({
          user: {
            id: `local-user-${Date.now()}`,
            email,
            name: name || email.split('@')[0],
            created_at: new Date().toISOString()
          },
          message: 'Account created locally (test mode - Supabase not running). No email verification needed.',
          requiresEmailVerification: false,
          canSignInImmediately: true
        }, { status: 201 })
      }
    }

    // Create Supabase client
    const supabase = createServerClient()

    // Sign up user with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name || email.split('@')[0],
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      }
    })

    if (error) {
      // Handle specific Supabase errors with user-friendly messages
      if (error.message.includes('already registered') || error.message.includes('duplicate')) {
        return NextResponse.json(
          { 
            error: 'Email already registered',
            message: 'An account with this email already exists. Please sign in or use a different email.'
          },
          { status: 409 }
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
          error: 'Signup failed',
          message: error.message || 'Failed to create account. Please try again.'
        },
        { status: 400 }
      )
    }

    if (!data.user) {
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 500 }
      )
    }

    // Check if email confirmation is required
    const confirmationRequired = data.user.confirmed_at === null

    // Response based on confirmation status
    if (confirmationRequired) {
      return NextResponse.json({
        user: {
          id: data.user.id,
          email: data.user.email,
          created_at: data.user.created_at
        },
        message: 'Account created successfully! Please check your email to verify your account.',
        requiresEmailVerification: true,
        canSignInImmediately: false
      }, { status: 201 })
    } else {
      // If auto-confirmed (e.g., in some Supabase configurations)
      // Try to create user profile, but don't fail if database not ready
      try {
        await createUserProfile(data.user)
      } catch (profileError) {
        console.log('Profile creation skipped - database may not be configured yet')
      }

      return NextResponse.json({
        user: {
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.full_name || name,
          created_at: data.user.created_at
        },
        session: data.session ? {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at
        } : null,
        message: 'Account created successfully!',
        requiresEmailVerification: false,
        canSignInImmediately: true
      }, { status: 201 })
    }

  } catch (error) {
    console.error('Signup error:', error)
    
    // Check for network/connection errors
    if (error instanceof Error) {
      if (error.message.includes('fetch failed') || error.message.includes('ENOTFOUND')) {
        return NextResponse.json(
          { 
            error: 'Connection error',
            message: 'Cannot connect to authentication service. If testing locally, make sure Supabase is running or the application will use mock authentication.'
          },
          { status: 503 }
        )
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Signup failed',
        message: 'An unexpected error occurred. Please try again.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
