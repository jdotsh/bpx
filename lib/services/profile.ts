// Temporary stub - Prisma removed, Supabase migration in progress
import { createServerClient } from '@/lib/auth/server'

export interface ProfileWithSubscription {
  id: string
  email: string
  displayName?: string
  avatarUrl?: string
  subscription?: any
}

export class ProfileService {
  
  static async getOrCreateProfile(userId: string): Promise<ProfileWithSubscription | null> {
    const supabase = createServerClient()
    
    // Try to get existing profile
    let { data: profile } = await supabase
      .from('profiles')
      .select(`
        *,
        subscription:subscriptions(*)
      `)
      .eq('id', userId)
      .single()

    if (!profile) {
      // Get user info from Supabase auth
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Create new profile
        const { data: newProfile } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            email: user.email,
            display_name: user.user_metadata?.display_name || user.email?.split('@')[0],
            avatar_url: user.user_metadata?.avatar_url
          })
          .select(`
            *,
            subscription:subscriptions(*)
          `)
          .single()
        
        profile = newProfile
      }
    }

    return profile
  }
  
  static async getProfile(userId: string): Promise<any> {
    const supabase = createServerClient()
    
    const { data: profile } = await supabase
      .from('profiles')
      .select(`
        *,
        subscription:subscriptions(*)
      `)
      .eq('id', userId)
      .single()

    return profile
  }
  
  static async updateProfile(
    userId: string, 
    data: any
  ): Promise<any> {
    const supabase = createServerClient()
    
    const { data: profile, error } = await supabase
      .from('profiles')
      .update(data)
      .eq('id', userId)
      .select()
      .single()

    return profile
  }
  
  static async createProfile(data: any): Promise<any> {
    const supabase = createServerClient()
    
    const { data: profile, error } = await supabase
      .from('profiles')
      .insert(data)
      .select()
      .single()

    return profile
  }
  
  static async getProfileByEmail(email: string): Promise<any> {
    const supabase = createServerClient()
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single()

    return profile
  }
  
  static async deleteProfile(userId: string): Promise<boolean> {
    const supabase = createServerClient()
    
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId)

    return !error
  }
  
  static async getSubscription(userId: string): Promise<any> {
    const supabase = createServerClient()
    
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('profile_id', userId)
      .single()

    return subscription
  }
}