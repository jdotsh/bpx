// Enterprise User Authentication for API Routes
// R2: API Foundations

import { createServerClient, getCurrentUser, getUserProfile } from '@/lib/auth/server'
import { ForbiddenError, NotFoundError } from '../web/error'

/**
 * Get authenticated user ID from request context
 * Throws if user is not authenticated
 */
export async function requireUserId(): Promise<string> {
  const user = await getCurrentUser()
  
  if (!user?.id) {
    throw new ForbiddenError('Authentication required')
  }
  
  return user.id
}

/**
 * Get authenticated user with profile information
 * Includes subscription plan for rate limiting
 */
export async function requireUserWithProfile(): Promise<{
  id: string
  email: string
  name?: string | null
  plan: 'FREE' | 'PRO' | 'ENTERPRISE'
  status: 'ACTIVE' | 'CANCELED' | 'PAST_DUE'
}> {
  const user = await getCurrentUser()
  
  if (!user?.id) {
    throw new ForbiddenError('Authentication required')
  }
  
  const profile = await getUserProfile(user.id)
  
  if (!profile) {
    throw new NotFoundError('User profile')
  }
  
  return {
    id: user.id,
    email: user.email!,
    name: profile.name,
    plan: profile.subscriptions?.plan || 'FREE',
    status: profile.subscriptions?.status || 'ACTIVE'
  }
}

/**
 * Check if user can access resource
 * Uses RLS but adds explicit ownership check for clarity
 */
export async function checkResourceAccess(
  resourceId: string,
  resourceType: 'project' | 'diagram',
  requiredAccess: 'read' | 'write' | 'delete' = 'read'
): Promise<boolean> {
  const userId = await requireUserId()
  const supabase = createServerClient()
  
  try {
    if (resourceType === 'project') {
      const { data: project } = await supabase
        .from('projects')
        .select('owner_id, collaborators(user_id, role)')
        .eq('id', resourceId)
        .single()
        
      if (!project) return false
      
      // Owner has full access
      if (project.owner_id === userId) return true
      
      // Check collaborator access
      const collaboration = project.collaborators?.find(c => c.user_id === userId)
      if (!collaboration) return false
      
      // Role-based access control
      switch (requiredAccess) {
        case 'read': return ['OWNER', 'EDITOR', 'VIEWER'].includes(collaboration.role)
        case 'write': return ['OWNER', 'EDITOR'].includes(collaboration.role)
        case 'delete': return collaboration.role === 'OWNER'
        default: return false
      }
    }
    
    if (resourceType === 'diagram') {
      const { data: diagram } = await supabase
        .from('diagrams')
        .select(`
          owner_id,
          project:projects!inner(
            owner_id,
            collaborators(user_id, role)
          )
        `)
        .eq('id', resourceId)
        .single()
        
      if (!diagram) return false
      
      // Diagram owner has full access
      if (diagram.owner_id === userId) return true
      
      // Check project-level access
      const project = diagram.project as any
      if (project.owner_id === userId) return true
      
      const collaboration = project.collaborators?.find((c: any) => c.user_id === userId)
      if (!collaboration) return false
      
      switch (requiredAccess) {
        case 'read': return ['OWNER', 'EDITOR', 'VIEWER'].includes(collaboration.role)
        case 'write': return ['OWNER', 'EDITOR'].includes(collaboration.role)
        case 'delete': return ['OWNER'].includes(collaboration.role)
        default: return false
      }
    }
    
    return false
  } catch (error) {
    console.error('Resource access check failed:', error)
    return false
  }
}

/**
 * Require specific resource access or throw
 */
export async function requireResourceAccess(
  resourceId: string,
  resourceType: 'project' | 'diagram',
  requiredAccess: 'read' | 'write' | 'delete' = 'read'
): Promise<void> {
  const hasAccess = await checkResourceAccess(resourceId, resourceType, requiredAccess)
  
  if (!hasAccess) {
    throw new ForbiddenError(`Insufficient permissions for ${requiredAccess} access to ${resourceType}`)
  }
}

/**
 * Get user's subscription plan for rate limiting
 */
export async function getUserPlan(): Promise<'FREE' | 'PRO' | 'ENTERPRISE'> {
  try {
    const user = await requireUserWithProfile()
    return user.plan
  } catch {
    return 'FREE' // Default to most restrictive plan
  }
}