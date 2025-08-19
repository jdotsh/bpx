// Middleware for BPMN Studio Web SaaS
// Release 1 Day 2: Route Protection

import { createMiddlewareClient } from '@/lib/auth/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const supabase = createMiddlewareClient(request)

  // Refresh session if needed
  const { data: { user }, error } = await supabase.auth.getUser()

  // Protected routes that require authentication
  // Temporarily removing /studio for testing BPMN canvas
  const protectedRoutes = ['/dashboard', '/projects', '/settings']
  const isProtectedRoute = protectedRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )

  // API routes that require authentication
  const protectedApiRoutes = ['/api/diagrams', '/api/projects', '/api/profile']
  const isProtectedApiRoute = protectedApiRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )

  // If accessing protected route without auth, redirect to login
  if (isProtectedRoute && (!user || error)) {
    const loginUrl = new URL('/auth/signin', request.url)
    loginUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  // If accessing protected API without auth, return 401
  if (isProtectedApiRoute && (!user || error)) {
    return new NextResponse(
      JSON.stringify({ 
        error: 'Unauthorized',
        message: 'Authentication required' 
      }),
      { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }

  // If already authenticated and trying to access auth pages, redirect to dashboard
  const authRoutes = ['/auth/signin', '/auth/signup', '/auth/reset']
  const isAuthRoute = authRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )

  if (isAuthRoute && user && !error) {
    const redirectTo = request.nextUrl.searchParams.get('redirectTo')
    const redirectUrl = redirectTo ? new URL(redirectTo, request.url) : new URL('/dashboard', request.url)
    return NextResponse.redirect(redirectUrl)
  }

  // Add security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-XSS-Protection', '1; mode=block')

  // Add user ID to headers for API routes (if authenticated)
  if (user && !error) {
    response.headers.set('X-User-ID', user.id)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api/health).*)',
  ],
}