// Server-side auth for BPMN Studio Web SaaS
// Release 1 Day 2: Authentication Setup

import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'

// Server-side auth (for API routes, server components)
export function createServerClient() {
  const cookieStore = cookies()

  return createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}

// Middleware auth (for route protection)
export function createMiddlewareClient(request: NextRequest) {
  return createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          request.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )
}

// Get current user (server-side)
export async function getCurrentUser() {
  const supabase = createServerClient()
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return null
    }

    return user
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

// Get user profile with org info
export async function getUserProfile(userId: string) {
  const supabase = createServerClient()
  
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select(`
        *,
        subscriptions (
          plan,
          status,
          current_period_end
        )
      `)
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error getting user profile:', error)
      return null
    }

    return profile
  } catch (error) {
    console.error('Error getting user profile:', error)
    return null
  }
}

// Create profile on signup
export async function createUserProfile(user: any) {
  const supabase = createServerClient()
  
  try {
    // Create profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        avatar_url: user.user_metadata?.avatar_url,
      })
      .select()
      .single()

    if (profileError) {
      console.error('Error creating profile:', profileError)
      return null
    }

    // Create free subscription
    const { error: subscriptionError } = await supabase
      .from('subscriptions')
      .insert({
        profile_id: user.id,
        stripe_customer_id: `temp_${user.id}`, // Will be updated when Stripe customer is created
        plan: 'FREE',
        status: 'ACTIVE',
        current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      })

    if (subscriptionError) {
      console.error('Error creating subscription:', subscriptionError)
      // Don't fail profile creation if subscription fails
    }

    return profile
  } catch (error) {
    console.error('Error creating user profile:', error)
    return null
  }
}