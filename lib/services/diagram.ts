// Temporary stub - Prisma removed, Supabase migration in progress
import { createServerClient } from '@/lib/auth/server'

export interface DiagramWithProject {
  id: string
  name: string
  content: string
  projectId: string
  ownerId: string
  createdAt: Date
  updatedAt: Date
  project: {
    id: string
    name: string
  }
}

export interface DiagramWithVersions extends DiagramWithProject {
  versions: any[]
  project: {
    id: string
    name: string
    ownerId: string
  }
}

export class DiagramService {
  
  static async createDiagram(
    userId: string, 
    data: any
  ): Promise<any> {
    const supabase = createServerClient()
    
    // Verify user has access to the project
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', data.projectId)
      .eq('owner_id', userId)
      .single()

    if (!project) {
      return null
    }

    const { data: diagram, error } = await supabase
      .from('diagrams')
      .insert({
        ...data,
        owner_id: userId,
        version: 1
      })
      .select()
      .single()

    return diagram
  }
  
  static async updateDiagram(
    userId: string, 
    diagramId: string, 
    data: any
  ): Promise<any> {
    const supabase = createServerClient()
    
    const { data: diagram, error } = await supabase
      .from('diagrams')
      .update(data)
      .eq('id', diagramId)
      .eq('owner_id', userId)
      .select()
      .single()

    return diagram
  }
  
  static async deleteDiagram(
    userId: string, 
    diagramId: string
  ): Promise<boolean> {
    const supabase = createServerClient()
    
    const { error } = await supabase
      .from('diagrams')
      .delete()
      .eq('id', diagramId)
      .eq('owner_id', userId)

    return !error
  }
  
  static async getDiagram(
    userId: string, 
    diagramId: string
  ): Promise<any> {
    const supabase = createServerClient()
    
    const { data: diagram } = await supabase
      .from('diagrams')
      .select(`
        *,
        project:projects(id, name, owner_id)
      `)
      .eq('id', diagramId)
      .eq('owner_id', userId)
      .single()

    return diagram
  }
  
  static async listDiagrams(
    userId: string, 
    projectId?: string
  ): Promise<any[]> {
    const supabase = createServerClient()
    
    let query = supabase
      .from('diagrams')
      .select(`
        *,
        project:projects(id, name)
      `)
      .eq('owner_id', userId)
    
    if (projectId) {
      query = query.eq('project_id', projectId)
    }
    
    const { data: diagrams } = await query
    return diagrams || []
  }
  
  static async saveDiagram(
    userId: string, 
    diagramId: string, 
    data: any
  ): Promise<any> {
    return DiagramService.updateDiagram(userId, diagramId, data)
  }
}