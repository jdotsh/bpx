import { prisma } from '@/lib/prisma'
import { createServerClient } from '@/lib/auth/server'
import type { Profile, Subscription } from '@prisma/client'

export interface ProfileWithSubscription extends Profile {
  subscription: Subscription | null
}

export class ProfileService {
  
  static async getOrCreateProfile(userId: string): Promise<ProfileWithSubscription | null> {
    try {
      // Try to get existing profile
      let profile = await prisma.profile.findUnique({
        where: { id: userId },
        include: { subscription: true }
      })

      if (!profile) {
        // Get user info from Supabase
        const supabase = createServerClient()
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error || !user || user.id !== userId) {
          return null
        }

        // Create new profile with free subscription
        profile = await prisma.profile.create({
          data: {
            id: userId,
            email: user.email!,
            name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            avatarUrl: user.user_metadata?.avatar_url,
            subscription: {
              create: {
                stripeCustomerId: `temp_${userId}`,
                plan: 'FREE',
                status: 'ACTIVE',
                currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
              }
            }
          },
          include: { subscription: true }
        })
      }

      return profile
    } catch (error) {
      console.error('Error getting/creating profile:', error)
      return null
    }
  }

  static async updateProfile(
    userId: string, 
    data: Partial<Pick<Profile, 'name' | 'avatarUrl'>>
  ): Promise<Profile | null> {
    try {
      const profile = await prisma.profile.update({
        where: { id: userId },
        data
      })
      return profile
    } catch (error) {
      console.error('Error updating profile:', error)
      return null
    }
  }

  static async getProfileById(userId: string): Promise<ProfileWithSubscription | null> {
    try {
      const profile = await prisma.profile.findUnique({
        where: { id: userId },
        include: { subscription: true }
      })
      return profile
    } catch (error) {
      console.error('Error getting profile by ID:', error)
      return null
    }
  }

  static async hasActivePremiumSubscription(userId: string): Promise<boolean> {
    try {
      const subscription = await prisma.subscription.findFirst({
        where: {
          profileId: userId,
          status: 'ACTIVE',
          plan: { in: ['PRO', 'ENTERPRISE'] },
          currentPeriodEnd: { gt: new Date() }
        }
      })
      return !!subscription
    } catch (error) {
      console.error('Error checking premium subscription:', error)
      return false
    }
  }

  static async getUserStats(userId: string) {
    try {
      const [projectCount, diagramCount] = await Promise.all([
        prisma.project.count({
          where: { 
            ownerId: userId,
            deletedAt: null 
          }
        }),
        prisma.diagram.count({
          where: { 
            ownerId: userId,
            deletedAt: null 
          }
        })
      ])

      return {
        projectCount,
        diagramCount
      }
    } catch (error) {
      console.error('Error getting user stats:', error)
      return {
        projectCount: 0,
        diagramCount: 0
      }
    }
  }
}