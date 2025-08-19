import { prisma } from '@/lib/prisma'
import type { Project, Diagram } from '@prisma/client'
import type { CreateProjectInput, UpdateProjectInput } from '@/lib/validations/project'
import { toPrismaJson } from '@/lib/core/types/prisma-helpers'

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

export class ProjectService {
  
  static async createProject(
    userId: string, 
    data: CreateProjectInput
  ): Promise<Project | null> {
    try {
      const project = await prisma.project.create({
        data: {
          name: data.name,
          description: data.description,
          ownerId: userId,
          version: 1,
          metadata: toPrismaJson(data.metadata || {})
        }
      })
      return project
    } catch (error) {
      console.error('Error creating project:', error)
      return null
    }
  }

  static async getProjectById(
    projectId: string, 
    userId: string
  ): Promise<ProjectWithDiagrams | null> {
    try {
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
      return project as ProjectWithDiagrams
    } catch (error) {
      console.error('Error getting project by ID:', error)
      return null
    }
  }

  static async getUserProjects(
    userId: string, 
    page: number = 1, 
    limit: number = 20
  ): Promise<ProjectWithDiagrams[]> {
    try {
      const projects = await prisma.project.findMany({
        where: {
          ownerId: userId,
          deletedAt: null
        },
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
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      })
      return projects as ProjectWithDiagrams[]
    } catch (error) {
      console.error('Error getting user projects:', error)
      return []
    }
  }

  static async updateProject(
    projectId: string,
    userId: string,
    data: UpdateProjectInput
  ): Promise<Project | null> {
    try {
      const updateData: any = {
        version: { increment: 1 }
      }
      
      if (data.name !== undefined) updateData.name = data.name
      if (data.description !== undefined) updateData.description = data.description
      if (data.metadata !== undefined) updateData.metadata = toPrismaJson(data.metadata || {})
      
      const project = await prisma.project.update({
        where: {
          id: projectId,
          ownerId: userId,
          deletedAt: null
        },
        data: updateData
      })
      return project
    } catch (error) {
      console.error('Error updating project:', error)
      return null
    }
  }

  static async deleteProject(
    projectId: string,
    userId: string
  ): Promise<boolean> {
    try {
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
      return true
    } catch (error) {
      console.error('Error deleting project:', error)
      return false
    }
  }

  static async getRecentProjects(
    userId: string, 
    limit: number = 5
  ): Promise<Project[]> {
    try {
      const projects = await prisma.project.findMany({
        where: {
          ownerId: userId,
          deletedAt: null
        },
        orderBy: { updatedAt: 'desc' },
        take: limit
      })
      return projects
    } catch (error) {
      console.error('Error getting recent projects:', error)
      return []
    }
  }

  static async duplicateProject(
    projectId: string,
    userId: string,
    newName?: string
  ): Promise<Project | null> {
    try {
      const originalProject = await prisma.project.findFirst({
        where: {
          id: projectId,
          ownerId: userId,
          deletedAt: null
        },
        include: {
          diagrams: {
            where: { deletedAt: null }
          }
        }
      })

      if (!originalProject) {
        return null
      }

      // Create duplicate project
      const duplicatedProject = await prisma.project.create({
        data: {
          name: newName || `${originalProject.name} (Copy)`,
          description: originalProject.description,
          metadata: originalProject.metadata as any,
          ownerId: userId,
          version: 1
        }
      })

      // Duplicate all diagrams
      if (originalProject.diagrams.length > 0) {
        const diagramsToCreate = originalProject.diagrams.map(diagram => ({
          title: diagram.title,
          bpmnXml: diagram.bpmnXml,
          thumbnailUrl: diagram.thumbnailUrl,
          metadata: diagram.metadata as any,
          projectId: duplicatedProject.id,
          ownerId: userId,
          version: 1,
          isPublic: false
        }))

        await prisma.diagram.createMany({
          data: diagramsToCreate
        })
      }

      return duplicatedProject
    } catch (error) {
      console.error('Error duplicating project:', error)
      return null
    }
  }
}