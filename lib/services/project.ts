// Temporary stub - Prisma removed, Supabase migration in progress
import { createServerClient } from '@/lib/auth/server'

export interface ProjectWithDiagrams {
  id: string
  name: string
  description?: string
  ownerId: string
  createdAt: Date
  updatedAt: Date
  diagrams: any[]
  _count: {
    diagrams: number
  }
}

export class ProjectService {
  
  static async createProject(
    userId: string, 
    data: any
  ): Promise<any> {
    const supabase = createServerClient()
    
    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        name: data.name,
        description: data.description,
        owner_id: userId,
        version: 1,
        metadata: data.metadata || {}
      })
      .select()
      .single()

    return project
  }
  
  static async updateProject(
    userId: string, 
    projectId: string, 
    data: any
  ): Promise<any> {
    const supabase = createServerClient()
    
    const { data: project, error } = await supabase
      .from('projects')
      .update({
        name: data.name,
        description: data.description,
        metadata: data.metadata,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)
      .eq('owner_id', userId)
      .select()
      .single()

    return project
  }
  
  static async deleteProject(
    userId: string, 
    projectId: string
  ): Promise<boolean> {
    const supabase = createServerClient()
    
    // Soft delete by setting deleted_at
    const { error } = await supabase
      .from('projects')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', projectId)
      .eq('owner_id', userId)

    return !error
  }
  
  static async getProject(
    userId: string, 
    projectId: string
  ): Promise<any> {
    const supabase = createServerClient()
    
    const { data: project } = await supabase
      .from('projects')
      .select(`
        *,
        diagrams (
          id,
          name,
          updated_at
        )
      `)
      .eq('id', projectId)
      .eq('owner_id', userId)
      .is('deleted_at', null)
      .single()

    if (project) {
      project._count = { diagrams: project.diagrams?.length || 0 }
    }

    return project
  }
  
  static async listProjects(userId: string): Promise<any[]> {
    const supabase = createServerClient()
    
    const { data: projects } = await supabase
      .from('projects')
      .select(`
        *,
        diagrams (
          id,
          name,
          updated_at
        )
      `)
      .eq('owner_id', userId)
      .is('deleted_at', null)
      .order('updated_at', { ascending: false })

    return projects?.map(project => ({
      ...project,
      _count: { diagrams: project.diagrams?.length || 0 }
    })) || []
  }
  
  static async getProjectStats(
    userId: string, 
    projectId: string
  ): Promise<any> {
    const supabase = createServerClient()
    
    const { data: project } = await supabase
      .from('projects')
      .select(`
        id,
        name,
        diagrams (count)
      `)
      .eq('id', projectId)
      .eq('owner_id', userId)
      .single()

    if (!project) return null

    return {
      projectId: project.id,
      name: project.name,
      diagramCount: project.diagrams?.length || 0,
      lastUpdated: new Date()
    }
  }
}