import { type CreateNextContextOptions } from '@trpc/server/adapters/next'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

export async function createContext(opts: CreateNextContextOptions) {
  // Create Supabase server client
  const cookieStore = cookies()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
    db: prisma,
    supabase,
    user,
    userId: user?.id,
  }
}

export type Context = Awaited<ReturnType<typeof createContext>>