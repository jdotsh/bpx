/**
 * Enhanced Project Service with Enterprise Error Handling
 * Implements Result pattern and comprehensive error management
 */

import { createServerClient } from '@/lib/auth/server'
import { Result, Ok, Err } from '@/lib/core/patterns/result'
import { ApplicationError, ValidationError, BusinessLogicError, SystemError } from '@/lib/core/errors/application-error'
import { ErrorService } from '@/lib/core/errors/error-service'

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

export interface ProjectStats {
  totalProjects: number
  activeProjects: number
  totalDiagrams: number
  storageUsed: number
}

export class EnhancedProjectService {
  
  static async createProject(
    userId: string, 
    data: any
  ): Promise<Result<any, ApplicationError>> {
    try {
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

      if (error) {
        return Err(new SystemError('Failed to create project', 'CREATE_PROJECT_ERROR'))
      }

      return Ok(project)
    } catch (error) {
      console.error('Error creating project:', error)
      return Err(new SystemError('Unexpected error creating project', 'CREATE_PROJECT_UNEXPECTED'))
    }
  }
  
  static async updateProject(
    userId: string, 
    projectId: string, 
    data: any
  ): Promise<Result<any, ApplicationError>> {
    try {
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

      if (error) {
        return Err(new SystemError('Failed to update project', 'UPDATE_PROJECT_ERROR'))
      }

      if (!project) {
        return Err(new BusinessLogicError('Project not found or access denied', 'PROJECT_NOT_FOUND'))
      }

      return Ok(project)
    } catch (error) {
      console.error('Error updating project:', error, { userId, projectId })
      return Err(new SystemError('Unexpected error updating project', 'UPDATE_PROJECT_UNEXPECTED'))
    }
  }
  
  static async deleteProject(
    userId: string, 
    projectId: string
  ): Promise<Result<boolean, ApplicationError>> {
    try {
      const supabase = createServerClient()
      
      // Check if project has diagrams
      const { data: diagrams } = await supabase
        .from('diagrams')
        .select('id')
        .eq('project_id', projectId)
        .limit(1)
      
      if (diagrams && diagrams.length > 0) {
        return Err(new BusinessLogicError('Cannot delete project with existing diagrams', 'PROJECT_HAS_DIAGRAMS'))
      }
      
      // Soft delete
      const { error } = await supabase
        .from('projects')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', projectId)
        .eq('owner_id', userId)

      if (error) {
        return Err(new SystemError('Failed to delete project', 'DELETE_PROJECT_ERROR'))
      }

      return Ok(true)
    } catch (error) {
      console.error('Error deleting project:', error, { userId, projectId })
      return Err(new SystemError('Unexpected error deleting project', 'DELETE_PROJECT_UNEXPECTED'))
    }
  }
  
  static async getProject(
    userId: string, 
    projectId: string
  ): Promise<Result<ProjectWithDiagrams, ApplicationError>> {
    try {
      const supabase = createServerClient()
      
      const { data: project, error } = await supabase
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

      if (error) {
        return Err(new SystemError('Failed to fetch project', 'FETCH_PROJECT_ERROR'))
      }

      if (!project) {
        return Err(new BusinessLogicError('Project not found', 'PROJECT_NOT_FOUND'))
      }

      const enhancedProject = {
        ...project,
        _count: { diagrams: project.diagrams?.length || 0 }
      }

      return Ok(enhancedProject)
    } catch (error) {
      console.error('Error fetching project:', error, { userId, projectId })
      return Err(new SystemError('Unexpected error fetching project', 'FETCH_PROJECT_UNEXPECTED'))
    }
  }
  
  static async listProjects(userId: string): Promise<Result<ProjectWithDiagrams[], ApplicationError>> {
    try {
      const supabase = createServerClient()
      
      const { data: projects, error } = await supabase
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

      if (error) {
        return Err(new SystemError('Failed to list projects', 'LIST_PROJECTS_ERROR'))
      }

      const enhancedProjects = projects?.map(project => ({
        ...project,
        _count: { diagrams: project.diagrams?.length || 0 }
      })) || []

      return Ok(enhancedProjects)
    } catch (error) {
      console.error('Error listing projects:', error, { userId })
      return Err(new SystemError('Unexpected error listing projects', 'LIST_PROJECTS_UNEXPECTED'))
    }
  }
  
  static async getProjectStats(userId: string): Promise<Result<ProjectStats, ApplicationError>> {
    try {
      const supabase = createServerClient()
      
      // Get project counts
      const { count: totalProjects } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', userId)
      
      const { count: activeProjects } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', userId)
        .is('deleted_at', null)
      
      // Get diagram count
      const { count: totalDiagrams } = await supabase
        .from('diagrams')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', userId)
      
      const stats: ProjectStats = {
        totalProjects: totalProjects || 0,
        activeProjects: activeProjects || 0,
        totalDiagrams: totalDiagrams || 0,
        storageUsed: 0 // Placeholder - would need actual storage calculation
      }

      return Ok(stats)
    } catch (error) {
      console.error('Error fetching project stats:', error, { userId })
      return Err(new SystemError('Failed to fetch project statistics', 'FETCH_STATS_ERROR'))
    }
  }
}