import { NextRequest, NextResponse } from 'next/server'

import { createServerClient } from '@/lib/auth/server'

// Force dynamic rendering for API routes that use authentication
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { password } = body

    if (!password) {
      return NextResponse.json(
        { error: 'New password is required' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Check if user is authenticated (has valid session from reset link)
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Invalid or expired reset link' },
        { status: 401 }
      )
    }

    // Update the password
    const { error } = await supabase.auth.updateUser({
      password: password
    })

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Failed to update password' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      message: 'Password updated successfully',
    }, { status: 200 })

  } catch (error) {
    console.error('Update password error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update password',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
