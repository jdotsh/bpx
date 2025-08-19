// Client-side auth for BPMN Studio Web SaaS
// Release 1 Day 2: Authentication Setup

import { createBrowserClient } from '@supabase/ssr'

// Client-side auth (for React components)
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}