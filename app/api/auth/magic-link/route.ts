import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/auth/server'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Send magic link
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      }
    })

    if (error) {
      // Handle specific error cases
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { 
            error: 'Too many attempts',
            message: 'You\'ve requested too many magic links. Please wait a few minutes before trying again.'
          },
          { status: 429 }
        )
      }

      return NextResponse.json(
        { 
          error: error.message,
          message: 'Failed to send magic link. Please check your email address and try again.'
        },
        { status: 400 }
      )
    }

    return NextResponse.json({ 
      success: true,
      message: 'Magic link sent! Check your email to sign in.'
    })
  } catch (error) {
    console.error('Magic link error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'Unable to send magic link. Please try again later.'
      },
      { status: 500 }
    )
  }
}