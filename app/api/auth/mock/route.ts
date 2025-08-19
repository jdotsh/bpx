import { NextRequest, NextResponse } from 'next/server'

// Mock authentication for local testing without Supabase
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, email, password, name } = body

    // Mock user data
    const mockUser = {
      id: `mock-user-${Date.now()}`,
      email: email || 'test@example.com',
      name: name || email?.split('@')[0] || 'Test User',
      created_at: new Date().toISOString(),
      email_confirmed_at: new Date().toISOString()
    }

    const mockSession = {
      access_token: `mock-access-${Date.now()}`,
      refresh_token: `mock-refresh-${Date.now()}`,
      expires_at: Date.now() + 3600000, // 1 hour
      user: mockUser
    }

    switch (action) {
      case 'signup':
        return NextResponse.json({
          user: mockUser,
          session: mockSession,
          message: 'Mock signup successful! (Local testing mode - no real account created)'
        }, { status: 201 })

      case 'signin':
        return NextResponse.json({
          user: mockUser,
          session: mockSession,
          message: 'Mock signin successful! (Local testing mode)'
        }, { status: 200 })

      case 'signout':
        return NextResponse.json({
          message: 'Mock signout successful!'
        }, { status: 200 })

      default:
        return NextResponse.json({
          error: 'Invalid action'
        }, { status: 400 })
    }
  } catch (error) {
    return NextResponse.json({
      error: 'Mock auth error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}