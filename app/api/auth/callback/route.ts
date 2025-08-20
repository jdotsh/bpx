import { NextRequest, NextResponse } from 'next/server'

import { createServerClient } from '@/lib/auth/server'

// Force dynamic rendering for API routes that use authentication
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const redirectTo = requestUrl.searchParams.get('redirectTo') || '/dashboard'

  if (!code) {
    return NextResponse.redirect(new URL('/auth/signin?error=missing_code', requestUrl.origin))
  }

  try {
    const supabase = createServerClient()

    // Exchange code for session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('Auth callback error:', error)
      return NextResponse.redirect(
        new URL(`/auth/signin?error=${encodeURIComponent(error.message)}`, requestUrl.origin)
      )
    }

    if (!data.session) {
      return NextResponse.redirect(
        new URL('/auth/signin?error=no_session', requestUrl.origin)
      )
    }

    // Check if this is a new user (first sign in)
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single()

    // Redirect to onboarding if new user, otherwise to dashboard
    const destination = !profile ? '/onboarding' : redirectTo

    // Create response with redirect
    const response = NextResponse.redirect(new URL(destination, requestUrl.origin))

    // Set auth cookies
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
    console.error('Auth callback error:', error)
    return NextResponse.redirect(
      new URL('/auth/signin?error=callback_failed', requestUrl.origin)
    )
  }
}
