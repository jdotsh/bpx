// Sign out route for BPMN Studio Web SaaS
// Release 1 Day 2: Authentication Setup

import { createServerClient } from '@/lib/auth/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = createServerClient()
  
  try {
    await supabase.auth.signOut()
    
    return NextResponse.redirect(
      new URL('/auth/signin?message=signed_out', request.url)
    )
  } catch (error) {
    console.error('Sign out error:', error)
    
    return NextResponse.redirect(
      new URL('/auth/signin?error=signout_failed', request.url)
    )
  }
}