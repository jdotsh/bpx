import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, getCurrentUser, getUserProfile } from '@/lib/auth/server'

// Force dynamic rendering for this route since it uses authentication cookies
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()

    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'No active session' },
        { status: 401 }
      )
    }

    // Get user details
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get user profile with subscription info
    const profile = await getUserProfile(user.id)

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: profile?.name || user.user_metadata?.full_name,
        avatar_url: profile?.avatar_url,
        created_at: user.created_at,
        email_confirmed: user.email_confirmed_at !== null,
      },
      profile,
      session: {
        access_token: session.access_token,
        expires_at: session.expires_at,
      }
    }, { status: 200 })

  } catch (error) {
    console.error('Session error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to get session',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}