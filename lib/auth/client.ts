// Client-side auth for BPMN Studio Web SaaS
// Release 1 Day 2: Authentication Setup

import { createBrowserClient } from '@supabase/ssr'

// Client-side auth (for React components)
export function createClient() {
  // Use fallback values for build process when env vars are not set
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'
  
  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey
  )
}