'use client'

import { useEffect, useState } from 'react'
import { createClient } from './client'
import type { User, Session } from '@supabase/supabase-js'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
          setError(error.message)
        } else {
          setSession(session)
          setUser(session?.user ?? null)
        }
      } catch (err) {
        console.error('Error in getInitialSession:', err)
        setError('Failed to get session')
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)

      // Handle specific auth events
      switch (event) {
        case 'SIGNED_IN':
          console.log('User signed in')
          break
        case 'SIGNED_OUT':
          console.log('User signed out')
          // Clear any cached data
          break
        case 'TOKEN_REFRESHED':
          console.log('Token refreshed')
          break
        case 'USER_UPDATED':
          console.log('User updated')
          break
        case 'PASSWORD_RECOVERY':
          console.log('Password recovery initiated')
          break
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase.auth])

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    setError(null)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return { user: null, session: null, error }
    }

    setUser(data.user)
    setSession(data.session)
    setLoading(false)
    return { user: data.user, session: data.session, error: null }
  }

  const signUp = async (email: string, password: string, metadata?: any) => {
    setLoading(true)
    setError(null)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      }
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return { user: null, session: null, error }
    }

    setUser(data.user)
    setSession(data.session)
    setLoading(false)
    return { user: data.user, session: data.session, error: null }
  }

  const signOut = async () => {
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signOut()

    if (error) {
      setError(error.message)
      setLoading(false)
      return { error }
    }

    setUser(null)
    setSession(null)
    setLoading(false)
    return { error: null }
  }

  const resetPassword = async (email: string) => {
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return { error }
    }

    setLoading(false)
    return { error: null }
  }

  const updatePassword = async (newPassword: string) => {
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return { error }
    }

    setLoading(false)
    return { error: null }
  }

  return {
    user,
    session,
    loading,
    error,
    isAuthenticated: !!session,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
  }
}

// Hook to require authentication
export function useRequireAuth(redirectTo = '/auth/signin') {
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = `${redirectTo}?redirectTo=${encodeURIComponent(window.location.pathname)}`
    }
  }, [user, loading, redirectTo])

  return { user, loading }
}

// Hook to get user profile
export function useProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    if (!user) {
      setProfile(null)
      setLoading(false)
      return
    }

    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select(`
            *,
            subscriptions (
              plan,
              status,
              current_period_end
            )
          `)
          .eq('id', user.id)
          .single()

        if (error) {
          console.error('Error fetching profile:', error)
          setError(error.message)
        } else {
          setProfile(data)
        }
      } catch (err) {
        console.error('Error in fetchProfile:', err)
        setError('Failed to fetch profile')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()

    // Subscribe to profile changes
    const subscription = supabase
      .channel(`profile-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Profile changed:', payload)
          setProfile(payload.new)
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [user, supabase])

  const updateProfile = async (updates: any) => {
    if (!user) return { error: 'No user logged in' }

    setLoading(true)
    setError(null)

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      setError(error.message)
      setLoading(false)
      return { profile: null, error }
    }

    setProfile(data)
    setLoading(false)
    return { profile: data, error: null }
  }

  return {
    profile,
    loading,
    error,
    updateProfile,
    subscription: profile?.subscriptions?.[0],
    isPro: profile?.subscriptions?.[0]?.plan === 'PROFESSIONAL',
    isEnterprise: profile?.subscriptions?.[0]?.plan === 'ENTERPRISE',
  }
}