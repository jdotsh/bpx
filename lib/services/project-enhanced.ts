/**
 * Enhanced Project Service with Enterprise Error Handling
 * Implements Result pattern and comprehensive error management
 */

import { prisma } from '@/lib/prisma'
import type { Project, Diagram } from '@prisma/client'
import type { CreateProjectInput, UpdateProjectInput } from '@/lib/validations/project'
import { Result, Ok, Err } from '@/lib/core/patterns/result'
import { ApplicationError, ValidationError, BusinessLogicError, SystemError } from '@/lib/core/errors/application-error'
import { ErrorService } from '@/lib/core/errors/error-service'

export interface ProjectWithDiagrams extends Project {
  diagrams: (Partial<Diagram> & { 
    id: string
    title: string
    updatedAt: Date
  })[]
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

export class ProjectService {
  
  /**
   * Create a new project with comprehensive validation
   */
  static async createProject(
    userId: string, 
    data: CreateProjectInput
  ): Promise<Result<Project>> {
    const context = { 
      operation: 'createProject', 
      userId,
      projectName: data.name 
    }

    try {
      // Validation
      if (!userId) {
        return Err(new ValidationError('User ID is required', 'userId', userId, context))
      }

      if (!data.name?.trim()) {
        return Err(new ValidationError('Project name is required', 'name', data.name, context))
      }

      // Business logic validation
      const existingProject = await prisma.project.findFirst({
        where: {
          name: data.name.trim(),
          ownerId: userId,
          deletedAt: null
        }
      })

      if (existingProject) {
        return Err(new BusinessLogicError(
          `Project with name "${data.name}" already exists`,
          'PROJECT_ALREADY_EXISTS',
          context
        ))
      }

      // Create project
      const project = await prisma.project.create({
        data: {
          ...data,
          name: data.name.trim(),
          ownerId: userId,
          version: 1,
          metadata: data.metadata as any
        }
      })

      return Ok(project)

    } catch (error) {
      const appError = new SystemError(
        'Failed to create project',
        'PROJECT_CREATE_FAILED',
        error instanceof Error ? error : undefined,
        context
      )
      ErrorService.handle(appError, context)
      return Err(appError)
    }
  }

  /**
   * Get project by ID with access control
   */
  static async getProjectById(
    projectId: string, 
    userId: string
  ): Promise<Result<ProjectWithDiagrams>> {
    const context = { 
      operation: 'getProjectById', 
      userId, 
      projectId 
    }

    try {
      // Validation
      if (!projectId) {
        return Err(new ValidationError('Project ID is required', 'projectId', projectId, context))
      }

      if (!userId) {
        return Err(new ValidationError('User ID is required', 'userId', userId, context))
      }

      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          ownerId: userId,
          deletedAt: null
        },
        include: {
          diagrams: {
            where: { deletedAt: null },
            orderBy: { updatedAt: 'desc' },
            select: {
              id: true,
              title: true,
              thumbnailUrl: true,
              metadata: true,
              version: true,
              isPublic: true,
              createdAt: true,
              updatedAt: true
            }
          },
          _count: {
            select: { diagrams: true }
          }
        }
      })

      if (!project) {
        return Err(new BusinessLogicError(
          'Project not found or access denied',
          'PROJECT_NOT_FOUND',
          context
        ))
      }

      return Ok(project as ProjectWithDiagrams)

    } catch (error) {
      const appError = new SystemError(
        'Failed to retrieve project',
        'PROJECT_FETCH_FAILED',
        error instanceof Error ? error : undefined,
        context
      )
      ErrorService.handle(appError, context)
      return Err(appError)
    }
  }

  /**
   * Get user projects with pagination and filtering
   */
  static async getUserProjects(
    userId: string, 
    options: {
      page?: number
      limit?: number
      search?: string
      sortBy?: 'name' | 'updatedAt' | 'createdAt'
      sortOrder?: 'asc' | 'desc'
    } = {}
  ): Promise<Result<{ projects: ProjectWithDiagrams[]; total: number; hasMore: boolean }>> {
    const { 
      page = 1, 
      limit = 20, 
      search,
      sortBy = 'updatedAt',
      sortOrder = 'desc'
    } = options

    const context = { 
      operation: 'getUserProjects', 
      userId, 
      page, 
      limit,
      search
    }

    try {
      // Validation
      if (!userId) {
        return Err(new ValidationError('User ID is required', 'userId', userId, context))
      }

      if (page < 1) {
        return Err(new ValidationError('Page must be greater than 0', 'page', page, context))
      }

      if (limit < 1 || limit > 100) {
        return Err(new ValidationError('Limit must be between 1 and 100', 'limit', limit, context))
      }

      const where = {
        ownerId: userId,
        deletedAt: null,
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } }
          ]
        })
      }

      // Get total count for pagination
      const total = await prisma.project.count({ where })

      // Get projects
      const projects = await prisma.project.findMany({
        where,
        include: {
          diagrams: {
            where: { deletedAt: null },
            orderBy: { updatedAt: 'desc' },
            take: 3, // Only show 3 recent diagrams per project
            select: {
              id: true,
              title: true,
              thumbnailUrl: true,
              updatedAt: true
            }
          },
          _count: {
            select: { diagrams: true }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit
      })

      const hasMore = total > page * limit

      return Ok({
        projects: projects as ProjectWithDiagrams[],
        total,
        hasMore
      })

    } catch (error) {
      const appError = new SystemError(
        'Failed to retrieve user projects',
        'USER_PROJECTS_FETCH_FAILED',
        error instanceof Error ? error : undefined,
        context
      )
      ErrorService.handle(appError, context)
      return Err(appError)
    }
  }

  /**
   * Update project with validation
   */
  static async updateProject(
    projectId: string,
    userId: string,
    data: UpdateProjectInput
  ): Promise<Result<Project>> {
    const context = { 
      operation: 'updateProject', 
      userId, 
      projectId 
    }

    try {
      // Validation
      if (!projectId) {
        return Err(new ValidationError('Project ID is required', 'projectId', projectId, context))
      }

      if (!userId) {
        return Err(new ValidationError('User ID is required', 'userId', userId, context))
      }

      // Check if project exists and user has access
      const existingProject = await prisma.project.findFirst({
        where: {
          id: projectId,
          ownerId: userId,
          deletedAt: null
        }
      })

      if (!existingProject) {
        return Err(new BusinessLogicError(
          'Project not found or access denied',
          'PROJECT_NOT_FOUND',
          context
        ))
      }

      // Check for name conflicts if name is being updated
      if (data.name && data.name !== existingProject.name) {
        const nameConflict = await prisma.project.findFirst({
          where: {
            name: data.name.trim(),
            ownerId: userId,
            deletedAt: null,
            id: { not: projectId }
          }
        })

        if (nameConflict) {
          return Err(new BusinessLogicError(
            `Project with name "${data.name}" already exists`,
            'PROJECT_NAME_CONFLICT',
            context
          ))
        }
      }

      // Update project
      const project = await prisma.project.update({
        where: {
          id: projectId,
          ownerId: userId,
          deletedAt: null
        },
        data: {
          ...data,
          ...(data.name && { name: data.name.trim() }),
          metadata: data.metadata as any,
          version: { increment: 1 }
        }
      })

      return Ok(project)

    } catch (error) {
      const appError = new SystemError(
        'Failed to update project',
        'PROJECT_UPDATE_FAILED',
        error instanceof Error ? error : undefined,
        context
      )
      ErrorService.handle(appError, context)
      return Err(appError)
    }
  }

  /**
   * Soft delete project
   */
  static async deleteProject(
    projectId: string,
    userId: string
  ): Promise<Result<void>> {
    const context = { 
      operation: 'deleteProject', 
      userId, 
      projectId 
    }

    try {
      // Validation
      if (!projectId) {
        return Err(new ValidationError('Project ID is required', 'projectId', projectId, context))
      }

      if (!userId) {
        return Err(new ValidationError('User ID is required', 'userId', userId, context))
      }

      // Check if project exists and user has access
      const existingProject = await prisma.project.findFirst({
        where: {
          id: projectId,
          ownerId: userId,
          deletedAt: null
        }
      })

      if (!existingProject) {
        return Err(new BusinessLogicError(
          'Project not found or access denied',
          'PROJECT_NOT_FOUND',
          context
        ))
      }

      // Soft delete project (this will cascade to diagrams via triggers or app logic)
      await prisma.project.update({
        where: {
          id: projectId,
          ownerId: userId,
          deletedAt: null
        },
        data: {
          deletedAt: new Date()
        }
      })

      return Ok(undefined)

    } catch (error) {
      const appError = new SystemError(
        'Failed to delete project',
        'PROJECT_DELETE_FAILED',
        error instanceof Error ? error : undefined,
        context
      )
      ErrorService.handle(appError, context)
      return Err(appError)
    }
  }

  /**
   * Get project statistics for user
   */
  static async getProjectStats(userId: string): Promise<Result<ProjectStats>> {
    const context = { operation: 'getProjectStats', userId }

    try {
      if (!userId) {
        return Err(new ValidationError('User ID is required', 'userId', userId, context))
      }

      const [projectCount, diagramCount] = await Promise.all([
        prisma.project.count({
          where: { ownerId: userId, deletedAt: null }
        }),
        prisma.diagram.count({
          where: { ownerId: userId, deletedAt: null }
        })
      ])

      // Calculate storage usage (simplified - in reality you'd measure actual file sizes)
      const activeProjects = await prisma.project.findMany({
        where: { 
          ownerId: userId, 
          deletedAt: null,
          updatedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Active in last 30 days
        },
        select: { id: true }
      })

      return Ok({
        totalProjects: projectCount,
        activeProjects: activeProjects.length,
        totalDiagrams: diagramCount,
        storageUsed: diagramCount * 1024 // Simplified calculation
      })

    } catch (error) {
      const appError = new SystemError(
        'Failed to retrieve project statistics',
        'PROJECT_STATS_FAILED',
        error instanceof Error ? error : undefined,
        context
      )
      ErrorService.handle(appError, context)
      return Err(appError)
    }
  }
}