import { type CreateNextContextOptions } from '@trpc/server/adapters/next'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createContext(opts: CreateNextContextOptions) {
  // Create Supabase server client
  const cookieStore = cookies()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key',
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )

  // Get user from session
  const { data: { user } } = await supabase.auth.getUser()

  return {
    supabase,
    user,
    userId: user?.id,
  }
}

export type Context = Awaited<ReturnType<typeof createContext>>